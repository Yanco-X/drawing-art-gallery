"""
Writing a piece's Deep Zoom pyramid to storage.

Split from `images.py`, which is deliberately pure -- it knows about pixels
and nothing else. This is the seam where tiles meet a storage backend, and
it is shared by the upload route and the backfill script so the two cannot
drift apart about where a tile goes.
"""

import itertools
import logging
from concurrent.futures import ThreadPoolExecutor

from ..models import Piece
from .images import tile_pyramid

logger = logging.getLogger(__name__)

# Tiles are written in parallel because the bottleneck is the round trip,
# not the bytes. Generating the pyramid for a 25-megapixel piece costs about
# 6s of CPU; storing its 547 tiles one at a time cost another 12s of waiting
# on MinIO. Eight is enough to hide almost all of that without opening so
# many connections that the object store starts queueing them anyway.
WRITE_WORKERS = 8

# How many tiles are held in memory at once. Batching keeps a large pyramid
# from being fully materialised before the first write goes out; at a few
# tens of kilobytes each this is well under a megabyte.
WRITE_BATCH = 64


def write_tiles(storage, piece: Piece, raw: bytes) -> int:
    """
    Generate and store every tile for a piece. Returns how many were written.

    Any failed write raises, and raises before the rest of the pyramid is
    attempted -- a partial pyramid is worse than none, because the viewer
    would open on it and then stop partway through a zoom.
    """
    written = 0
    tiles = tile_pyramid(raw)

    def store(tile) -> None:
        level, column, row, data = tile
        storage.save(piece.tile_key(level, column, row), data, "image/webp")

    with ThreadPoolExecutor(max_workers=WRITE_WORKERS) as pool:
        while True:
            batch = list(itertools.islice(tiles, WRITE_BATCH))
            if not batch:
                break
            # list() rather than leaving the map lazy: it forces every write
            # in the batch to finish here, so an exception surfaces now
            # instead of being swallowed when the pool shuts down.
            list(pool.map(store, batch))
            written += len(batch)

    logger.info("wrote %d tiles for piece %s", written, piece.id)
    return written


def clear_tiles(storage, piece: Piece) -> None:
    """
    Remove a piece's pyramid, leaving its renditions alone.

    Used before regenerating, so a half-written pyramid from an interrupted
    run cannot leave stale tiles mixed in with fresh ones at levels the new
    image does not reach.
    """
    storage.delete_prefix(piece.tile_prefix + "/")
