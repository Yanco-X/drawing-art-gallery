"""
Visit events in, and the owner's summary of them out -- context/METRICS.md.
"""

import re
from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import delete, select

from ..auth import is_owner, require_owner
from ..db import SessionLocal
from ..errors import ApiError
from ..models import Collection, Piece, VisitEvent
from .helpers import client_ip, parse_uuid

bp = Blueprint("visits", __name__, url_prefix="/visits")

MAX_EVENT_BYTES = 1024
MAX_RANGE_DAYS = 366
MAX_ZONE_NAME = 64
# 25 months, rounded down: the privacy page promises it -- context/METRICS.md section 7.
EVENT_RETENTION = timedelta(days=750)
# Wide, but inside what date arithmetic on either end survives.
EARLIEST_DAY = date(2000, 1, 1)
LATEST_DAY = date(2999, 12, 31)
PIECE_KINDS = {"piece_view", "detailed_view"}
KINDS = PIECE_KINDS | {"visit", "collection_view"}
BOT_AGENT = re.compile(r"bot|crawl|spider|slurp|headless", re.IGNORECASE)
MOBILE_AGENT = re.compile(r"Mobi|Android|iPhone|iPad")


@bp.post("")
def record_event():
    """
    Every well-formed event answers 204, stored or not: a different answer
    for a draft collection or a waived piece would confirm it exists.
    """
    size = request.content_length
    if size is None:
        raise ApiError("A Content-Length is required.", status=411)
    if size > MAX_EVENT_BYTES:
        raise ApiError("An event is at most 1 KB.", status=413)

    per_client = current_app.extensions["visits_per_client"]
    client = client_ip()
    if per_client.is_blocked(client):
        raise ApiError("Too many events. Try again later.", status=429)
    per_client.record(client)

    event = _parse_event(request.get_json(silent=True))
    agent = request.headers.get("User-Agent", "")
    # admit() last: only an event about to be stored spends the hour's budget.
    ignored = (
        is_owner()
        or not agent
        or BOT_AGENT.search(agent)
        or not _target_is_exhibited(event)
        or not current_app.extensions["visits_budget"].admit()
    )
    if not ignored:
        event.device = "mobile" if MOBILE_AGENT.search(agent) else "desktop"
        session = SessionLocal()
        session.add(event)
        session.commit()
    return "", 204


def _parse_event(body) -> VisitEvent:
    if not isinstance(body, dict):
        raise ApiError("An event is a JSON object.")
    kind = body.get("kind")
    if kind not in KINDS:
        raise ApiError("kind is not a known event.")

    event = VisitEvent(kind=kind, visitor_id=parse_uuid(body.get("visitorId"), "visitorId"))
    piece_id, collection_id = body.get("pieceId"), body.get("collectionId")
    wants_piece = kind in PIECE_KINDS
    wants_collection = kind == "collection_view"
    if (piece_id is not None) != wants_piece or (collection_id is not None) != wants_collection:
        raise ApiError(f"{kind} names the wrong target.")

    if wants_piece:
        event.piece_id = parse_uuid(piece_id, "pieceId")
    if wants_collection:
        event.collection_id = parse_uuid(collection_id, "collectionId")
    return event


def _target_is_exhibited(event: VisitEvent) -> bool:
    session = SessionLocal()
    if event.piece_id:
        row = session.execute(
            select(Piece.waived_at).where(Piece.id == event.piece_id)
        ).first()
        return row is not None and row.waived_at is None
    if event.collection_id:
        return bool(
            session.scalar(
                select(Collection.is_public).where(Collection.id == event.collection_id)
            )
        )
    return True


@bp.get("/summary")
@require_owner
def visit_summary():
    first_day, last_day, zone = _parse_range(request.args)
    days = (last_day - first_day).days + 1
    previous_first = first_day - timedelta(days=days)

    session = SessionLocal()
    rows = session.execute(
        select(
            VisitEvent.visitor_id,
            VisitEvent.kind,
            VisitEvent.piece_id,
            VisitEvent.collection_id,
            VisitEvent.device,
            VisitEvent.created_at,
        ).where(
            VisitEvent.created_at >= _midnight(previous_first, zone),
            VisitEvent.created_at < _midnight(last_day + timedelta(days=1), zone),
        )
    ).all()

    # ponytail: counted in Python, since AT TIME ZONE is Postgres-only and the
    # suites run on SQLite. A SQL GROUP BY when a year is measurably slow.
    current, previous = [], []
    for row in rows:
        day = _as_utc(row.created_at).astimezone(zone).date()
        (current if day >= first_day else previous).append((day, row))

    return jsonify(
        {
            "range": {
                "from": first_day.isoformat(),
                "to": last_day.isoformat(),
                "tz": zone.key,
            },
            "visitors": {
                "unique": _unique(current),
                "visits": _visits(current),
                "previousUnique": _unique(previous),
                "previousVisits": _visits(previous),
            },
            "devices": _devices(current),
            "daily": _daily(current, first_day, days),
            "pieces": _pieces(session, current),
            "collections": _collections(session, current),
        }
    )


def _parse_range(args) -> tuple[date, date, ZoneInfo]:
    try:
        first_day = date.fromisoformat(args.get("from", ""))
        last_day = date.fromisoformat(args.get("to", ""))
    except ValueError:
        raise ApiError("from and to are dates, as YYYY-MM-DD.")
    if not (EARLIEST_DAY <= first_day and last_day <= LATEST_DAY):
        raise ApiError("from and to fall between 2000 and 2999.")
    if not 0 <= (last_day - first_day).days < MAX_RANGE_DAYS:
        raise ApiError(f"The range runs forwards and spans at most {MAX_RANGE_DAYS} days.")

    name = args.get("tz", "UTC")
    if len(name) > MAX_ZONE_NAME:
        raise ApiError("tz is not a known time zone.")
    try:
        zone = ZoneInfo(name)
    except (ZoneInfoNotFoundError, ValueError):
        raise ApiError("tz is not a known time zone.")
    return first_day, last_day, zone


def _midnight(day: date, zone: ZoneInfo) -> datetime:
    return datetime.combine(day, time.min, tzinfo=zone).astimezone(timezone.utc)


def _as_utc(moment: datetime) -> datetime:
    # SQLite hands back naive datetimes; they were stored as UTC.
    return moment if moment.tzinfo else moment.replace(tzinfo=timezone.utc)


def _unique(events) -> int:
    return len({row.visitor_id for _, row in events})


def _visits(events) -> int:
    return sum(1 for _, row in events if row.kind == "visit")


def _devices(events) -> dict[str, int]:
    visitors = {"mobile": set(), "desktop": set()}
    for _, row in events:
        visitors[row.device].add(row.visitor_id)
    return {device: len(ids) for device, ids in visitors.items()}


def _daily(events, first_day: date, days: int) -> list[dict]:
    visitors = {first_day + timedelta(days=n): set() for n in range(days)}
    visits = dict.fromkeys(visitors, 0)
    for day, row in events:
        visitors[day].add(row.visitor_id)
        visits[day] += row.kind == "visit"
    return [
        {"date": day.isoformat(), "unique": len(ids), "visits": visits[day]}
        for day, ids in visitors.items()
    ]


def _viewers_by(events, kind: str, target: str) -> defaultdict:
    viewers = defaultdict(set)
    for _, row in events:
        if row.kind == kind:
            viewers[getattr(row, target)].add(row.visitor_id)
    return viewers


def _pieces(session, events) -> list[dict]:
    viewers = _viewers_by(events, "piece_view", "piece_id")
    detailed = _viewers_by(events, "detailed_view", "piece_id")
    ids = list(viewers.keys() | detailed.keys())
    if not ids:
        return []
    titles = session.execute(select(Piece.id, Piece.title).where(Piece.id.in_(ids))).all()
    pieces = [
        {
            "id": str(piece_id),
            "title": title,
            "viewers": len(viewers[piece_id]),
            "detailedViewers": len(detailed[piece_id]),
        }
        for piece_id, title in titles
    ]
    return sorted(pieces, key=lambda piece: piece["viewers"], reverse=True)


def _collections(session, events) -> list[dict]:
    viewers = _viewers_by(events, "collection_view", "collection_id")
    if not viewers:
        return []
    found = session.execute(
        select(Collection.id, Collection.name, Collection.slug).where(
            Collection.id.in_(list(viewers))
        )
    ).all()
    collections = [
        {"id": str(c.id), "name": c.name, "slug": c.slug, "viewers": len(viewers[c.id])}
        for c in found
    ]
    return sorted(collections, key=lambda collection: collection["viewers"], reverse=True)


def purge_expired_events(session, now: datetime | None = None) -> int:
    cutoff = (now or datetime.now(timezone.utc)) - EVENT_RETENTION
    return session.execute(delete(VisitEvent).where(VisitEvent.created_at < cutoff)).rowcount
