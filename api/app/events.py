"""In-process activity pub/sub for Server-Sent Events (SSE).

Events are JSON objects pushed to every connected ``GET /events`` client.
Publishing is safe to call from **sync** FastAPI route handlers (they run in a
thread pool): each payload is scheduled onto the main asyncio loop with
``call_soon_threadsafe``.

Multi-worker deployments only broadcast within a single process; upgrading to
Redis pub/sub is a documented follow-up.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, Set

_log = logging.getLogger("gulp.api.events")


class ActivityHub:
    """Fan-out JSON lines to all subscribed SSE queues."""

    def __init__(self) -> None:
        self._queues: Set[asyncio.Queue] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    def attach_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Call once from an async lifespan hook with ``get_running_loop()``."""
        self._loop = loop

    def subscribe(self) -> asyncio.Queue:
        """Register a subscriber queue; caller must :meth:`unsubscribe` when done."""
        q: asyncio.Queue = asyncio.Queue(maxsize=48)
        self._queues.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._queues.discard(q)

    def publish(self, payload: Dict[str, Any]) -> None:
        """Enqueue ``payload`` as a JSON string for every subscriber."""
        loop = self._loop
        if loop is None or not self._queues:
            return
        text = json.dumps(payload, ensure_ascii=False)
        for q in list(self._queues):

            def _put(qq: asyncio.Queue = q, msg: str = text) -> None:
                try:
                    qq.put_nowait(msg)
                except asyncio.QueueFull:
                    try:
                        qq.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                    try:
                        qq.put_nowait(msg)
                    except asyncio.QueueFull:
                        _log.debug("activity queue still full after drop-one")

            try:
                loop.call_soon_threadsafe(_put)
            except RuntimeError:
                self._queues.discard(q)


hub = ActivityHub()
