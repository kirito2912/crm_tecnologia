"""Trace registration failures without logging credentials or invitation tokens."""
import logging
import time
import traceback
import uuid

from starlette.responses import JSONResponse

logger = logging.getLogger("uvicorn.error")


async def trace_registration(request, call_next):
    if request.method != "POST" or request.url.path != "/api/v1/invitaciones/completar-registro":
        return await call_next(request)
    reference = uuid.uuid4().hex[:12]
    started = time.monotonic()
    logger.info("[REGISTRO %s] Inicio", reference)
    try:
        response = await call_next(request)
    except Exception as exc:
        frames = " > ".join(f"{frame.name}:{frame.lineno}" for frame in traceback.extract_tb(exc.__traceback__))
        original = getattr(exc, "orig", None)
        sqlstate = getattr(original, "sqlstate", None) or getattr(original, "pgcode", None)
        logger.error("[REGISTRO %s] Error=%s SQLSTATE=%s Ubicacion=%s", reference, type(exc).__name__, sqlstate, frames)
        response = JSONResponse(
            status_code=500,
            content={"detail": f"El servidor no pudo confirmar el registro. Contacta al administrador con la referencia {reference}.", "request_id": reference},
        )
    response.headers["X-Request-ID"] = reference
    logger.info("[REGISTRO %s] Fin HTTP=%s duracion=%.2fs", reference, response.status_code, time.monotonic() - started)
    return response
