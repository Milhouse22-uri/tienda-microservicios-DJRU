import os
from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pymongo import DESCENDING, MongoClient

app = FastAPI(title="api-resenas")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

cliente = MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017"), serverSelectionTimeoutMS=5000)
coleccion = cliente[os.getenv("MONGO_DB", "resenas_db")]["resenas"]


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


class NuevaResena(BaseModel):
    producto_id: int
    usuario_id: int
    calificacion: int
    comentario: str = ""


def serializar(doc: dict) -> dict:
    return {
        "id": str(doc["_id"]),
        "producto_id": doc["producto_id"],
        "usuario_id": doc["usuario_id"],
        "calificacion": doc["calificacion"],
        "comentario": doc.get("comentario", ""),
        "fecha": doc["fecha"].isoformat() if isinstance(doc.get("fecha"), datetime) else doc.get("fecha"),
    }


@app.get("/health")
def health():
    return {"ok": True, "servicio": "api-resenas"}


@app.get("/api/resenas/promedios")
def promedios():
    pipeline = [
        {"$group": {"_id": "$producto_id", "promedio": {"$avg": "$calificacion"}, "total": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    datos = [
        {"producto_id": d["_id"], "promedio": round(d["promedio"], 1), "total": d["total"]}
        for d in coleccion.aggregate(pipeline)
    ]
    return ok(datos)


@app.get("/api/resenas/producto/{producto_id}")
def por_producto(producto_id: int):
    resenas = [serializar(d) for d in coleccion.find({"producto_id": producto_id}).sort("fecha", DESCENDING)]
    total = len(resenas)
    promedio = round(sum(r["calificacion"] for r in resenas) / total, 1) if total else 0
    return ok({"producto_id": producto_id, "promedio": promedio, "total": total, "resenas": resenas})


@app.post("/api/resenas")
def crear(body: NuevaResena):
    if not 1 <= body.calificacion <= 5:
        return error("calificacion debe estar entre 1 y 5", 400)
    if body.producto_id <= 0 or body.usuario_id <= 0:
        return error("producto_id y usuario_id deben ser mayores a 0", 400)
    doc = {
        "producto_id": body.producto_id,
        "usuario_id": body.usuario_id,
        "calificacion": body.calificacion,
        "comentario": body.comentario.strip(),
        "fecha": datetime.now(timezone.utc),
    }
    resultado = coleccion.insert_one(doc)
    doc["_id"] = resultado.inserted_id
    return ok(serializar(doc), 201)
