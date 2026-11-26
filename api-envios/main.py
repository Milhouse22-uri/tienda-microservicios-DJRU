import re
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="api-envios")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# guia -> {guia, pedido_id, creado_en}
GUIAS: dict[str, dict] = {}


def ok(data, codigo: int = 200):
    return JSONResponse(status_code=codigo, content={"ok": True, "data": data})


def error(mensaje: str, codigo: int):
    return JSONResponse(status_code=codigo, content={"ok": False, "error": mensaje})


@app.exception_handler(RequestValidationError)
async def validacion(_: Request, exc: RequestValidationError):
    campos = ", ".join(str(e["loc"][-1]) for e in exc.errors())
    return error(f"Datos inválidos o faltantes: {campos}", 400)


@app.exception_handler(Exception)
async def interno(_: Request, exc: Exception):
    return error(f"Error interno: {exc}", 500)


class Cotizacion(BaseModel):
    codigo_postal: str | int
    cantidad: int = 1


class Generar(BaseModel):
    pedido_id: int


def estado_por_tiempo(creado_en: datetime) -> str:
    minutos = (datetime.now(timezone.utc) - creado_en).total_seconds() / 60
    if minutos < 2:
        return "preparando"
    if minutos < 5:
        return "en_transito"
    return "entregado"


@app.get("/health")
def health():
    return {"ok": True, "servicio": "api-envios"}


@app.post("/api/envios/cotizar")
def cotizar(body: Cotizacion):
    cp = str(body.codigo_postal).strip()
    if not re.fullmatch(r"\d{5}", cp):
        return error("codigo_postal debe tener 5 dígitos", 400)
    if body.cantidad <= 0:
        return error("cantidad debe ser mayor a 0", 400)

    costo = 99 + 15 * body.cantidad
    if cp.startswith("38"):  # Guanajuato
        dias = 2
    else:
        dias = 5
        costo += 50
    return ok({"codigo_postal": cp, "cantidad": body.cantidad, "costo_envio": costo, "dias_estimados": dias})


@app.post("/api/envios/generar")
def generar(body: Generar):
    if body.pedido_id <= 0:
        return error("pedido_id debe ser mayor a 0", 400)
    guia = "GUIA-" + uuid.uuid4().hex[:8].upper()
    creado = datetime.now(timezone.utc)
    GUIAS[guia] = {"guia": guia, "pedido_id": body.pedido_id, "creado_en": creado}
    return ok({"guia": guia, "pedido_id": body.pedido_id, "estado": "preparando"}, 201)


@app.get("/api/envios/rastreo/{guia}")
def rastreo(guia: str):
    envio = GUIAS.get(guia.upper())
    if not envio:
        return error("Guía no encontrada", 404)
    return ok({
        "guia": envio["guia"],
        "pedido_id": envio["pedido_id"],
        "estado": estado_por_tiempo(envio["creado_en"]),
        "creado_en": envio["creado_en"].isoformat(),
    })
