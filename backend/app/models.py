import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Table,
    Text,
    Uuid,
    text,
)
from flask_login import UserMixin
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

# Uuid (generic) rather than the postgresql dialect type: it renders as a
# native uuid on Postgres and as CHAR(32) elsewhere, which lets the test
# suite run against SQLite without a second set of models.


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


piece_tags = Table(
    "piece_tags",
    Base.metadata,
    Column(
        "piece_id",
        Uuid,
        ForeignKey("pieces.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id",
        Uuid,
        ForeignKey("tags.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class User(Base, UserMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="visitor", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    pieces: Mapped[list["Piece"]] = relationship(back_populates="user")


class Piece(Base):
    __tablename__ = "pieces"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # No path or URL column: every object key derives from this row's id, so
    # there is nothing to keep in sync and nothing to migrate when the
    # storage backend changes. The API composes public URLs at read time.
    original_ext: Mapped[str] = mapped_column(String(10), nullable=False)
    byte_size: Mapped[int | None] = mapped_column(Integer)

    # Rendered as "{medium} · {year}" on the card and the wall label.
    medium: Mapped[str | None] = mapped_column(String(100))
    year: Mapped[int | None] = mapped_column(Integer)

    # Recorded at upload from the stored file. The masonry reserves each
    # card's height from width/height, so measuring in the browser instead
    # would reflow the whole grid as images arrive.
    width: Mapped[int | None] = mapped_column(Integer)
    height: Mapped[int | None] = mapped_column(Integer)

    # Whether the Deep Zoom pyramid under <id>/tiles/ has been written.
    # A flag rather than a storage probe: the detail view needs to know on
    # every read, and a HEAD request per piece to answer it would be absurd.
    # False is always safe -- it means the viewer falls back to the display
    # rendition, which is what a piece uploaded before tiling existed does
    # until the backfill reaches it.
    tiles_ready: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=text("false")
    )

    # Null is exhibited, set is waived. A timestamp rather than a boolean so
    # the reserve has a sort order and "waived three days ago" is free.
    waived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_date: Mapped[date | None] = mapped_column(Date)  # when the art was made
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    user: Mapped["User | None"] = relationship(back_populates="pieces")
    tags: Mapped[list["Tag"]] = relationship(
        secondary=piece_tags, back_populates="pieces", lazy="selectin"
    )
    collection_links: Mapped[list["CollectionPiece"]] = relationship(
        back_populates="piece", cascade="all, delete-orphan"
    )

    @property
    def aspect_ratio(self) -> float | None:
        if not self.width or not self.height:
            return None
        return self.width / self.height

    @property
    def is_waived(self) -> bool:
        return self.waived_at is not None

    @property
    def storage_prefix(self) -> str:
        return f"{self.id}/"

    def key(self, variant: str) -> str:
        """
        Object key for one rendition.

        `original` keeps its uploaded format; the derivatives are WebP.
        Deriving these rather than storing them is what keeps the row free
        of anything backend-specific.
        """
        if variant == "original":
            return f"{self.id}/original.{self.original_ext}"
        return f"{self.id}/{variant}.webp"

    @property
    def tile_prefix(self) -> str:
        """
        Where this piece's Deep Zoom tiles live.

        Under the piece's own prefix, so deleting the piece already removes
        them -- `delete_prefix` lists and batches, which is what makes a
        five-hundred-tile pyramid no different from a single file.
        """
        return f"{self.id}/tiles"

    def tile_key(self, level: int, column: int, row: int) -> str:
        return f"{self.tile_prefix}/{level}/{column}_{row}.webp"


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # An explicit face for the collection, chosen from its own pieces.
    # SET NULL rather than CASCADE: losing the cover piece must not delete
    # the collection. Falls back to the first member, then a gradient swatch.
    cover_piece_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("pieces.id", ondelete="SET NULL")
    )
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, onupdate=_utcnow
    )

    cover_piece: Mapped["Piece | None"] = relationship(foreign_keys=[cover_piece_id])
    piece_links: Mapped[list["CollectionPiece"]] = relationship(
        back_populates="collection",
        cascade="all, delete-orphan",
        order_by="CollectionPiece.display_order",
        lazy="selectin",
    )

    @property
    def pieces(self) -> list["Piece"]:
        return [link.piece for link in self.piece_links]

    @property
    def piece_count(self) -> int:
        return len(self.piece_links)

    @property
    def resolved_cover(self) -> "Piece | None":
        if self.cover_piece is not None:
            return self.cover_piece
        return self.piece_links[0].piece if self.piece_links else None


class CollectionPiece(Base):
    """
    Membership, with the owner's curated order.

    display_order is deliberately not unique: membership is replaced as a
    whole ordered list, and a uniqueness constraint would trip on the
    transient duplicates that any reshuffle passes through. The composite
    primary key already stops a piece appearing twice in one collection.
    """

    __tablename__ = "collection_pieces"
    __table_args__ = (
        Index("ix_collection_pieces_order", "collection_id", "display_order"),
    )

    collection_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("collections.id", ondelete="CASCADE"), primary_key=True
    )
    piece_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("pieces.id", ondelete="CASCADE"), primary_key=True
    )
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    collection: Mapped["Collection"] = relationship(back_populates="piece_links")
    piece: Mapped["Piece"] = relationship(
        back_populates="collection_links", lazy="joined"
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    pieces: Mapped[list["Piece"]] = relationship(
        secondary=piece_tags, back_populates="tags"
    )
