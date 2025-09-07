from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Tienda de Fundas de Patines", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enum para categorías de patines
class TipoPatines(str, Enum):
    ARTISTICOS = "artisticos"
    HOCKEY = "hockey"
    VELOCIDAD = "velocidad"
    RECREATIVOS = "recreativos"

# Modelo para productos (fundas de patines)
class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    categoria: TipoPatines
    tallas_disponibles: List[str]
    colores_disponibles: List[str]
    material: str
    stock: int
    imagen_url: Optional[str] = None
    caracteristicas: Optional[List[str]] = []

class Producto(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    descripcion: str
    precio: float
    categoria: TipoPatines
    tallas_disponibles: List[str]
    colores_disponibles: List[str]
    material: str
    stock: int
    imagen_url: Optional[str] = None
    caracteristicas: Optional[List[str]] = []
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)
    activo: bool = True

# Modelo para items del carrito
class ItemCarrito(BaseModel):
    producto_id: str
    cantidad: int
    talla: str
    color: str

class CarritoCreate(BaseModel):
    items: List[ItemCarrito]
    
class Carrito(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[ItemCarrito]
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)
    total: float = 0.0

# Modelo para pedidos
class DatosCliente(BaseModel):
    nombre: str
    email: str
    telefono: str
    direccion: str
    ciudad: str
    codigo_postal: str

class PedidoCreate(BaseModel):
    carrito_id: str
    datos_cliente: DatosCliente
    metodo_pago: str

class Pedido(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    carrito_id: str
    datos_cliente: DatosCliente
    metodo_pago: str
    total: float
    estado: str = "pendiente"
    fecha_pedido: datetime = Field(default_factory=datetime.utcnow)

# RUTAS PARA PRODUCTOS
@api_router.get("/")
async def root():
    return {"message": "API Tienda de Fundas de Patines", "version": "1.0.0"}

@api_router.post("/productos", response_model=Producto)
async def crear_producto(producto: ProductoCreate):
    """Crear un nuevo producto (funda de patines)"""
    producto_dict = producto.dict()
    producto_obj = Producto(**producto_dict)
    await db.productos.insert_one(producto_obj.dict())
    return producto_obj

@api_router.get("/productos", response_model=List[Producto])
async def obtener_productos(categoria: Optional[str] = None):
    """Obtener todos los productos o filtrar por categoría"""
    query = {"activo": True}
    if categoria:
        query["categoria"] = categoria
    
    productos = await db.productos.find(query).to_list(100)
    return [Producto(**producto) for producto in productos]

@api_router.get("/productos/{producto_id}", response_model=Producto)
async def obtener_producto(producto_id: str):
    """Obtener un producto específico"""
    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return Producto(**producto)

@api_router.put("/productos/{producto_id}", response_model=Producto)
async def actualizar_producto(producto_id: str, producto_actualizado: ProductoCreate):
    """Actualizar un producto"""
    producto = await db.productos.find_one({"id": producto_id})
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    await db.productos.update_one(
        {"id": producto_id},
        {"$set": producto_actualizado.dict()}
    )
    
    producto_actualizado = await db.productos.find_one({"id": producto_id})
    return Producto(**producto_actualizado)

@api_router.delete("/productos/{producto_id}")
async def eliminar_producto(producto_id: str):
    """Eliminar un producto (marcarlo como inactivo)"""
    resultado = await db.productos.update_one(
        {"id": producto_id},
        {"$set": {"activo": False}}
    )
    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado correctamente"}

# RUTAS PARA CARRITO
@api_router.post("/carrito", response_model=Carrito)
async def crear_carrito(carrito_data: CarritoCreate):
    """Crear un nuevo carrito"""
    # Calcular el total
    total = 0.0
    for item in carrito_data.items:
        producto = await db.productos.find_one({"id": item.producto_id})
        if producto:
            total += producto["precio"] * item.cantidad
    
    carrito_dict = carrito_data.dict()
    carrito_dict["total"] = total
    carrito_obj = Carrito(**carrito_dict)
    
    await db.carritos.insert_one(carrito_obj.dict())
    return carrito_obj

@api_router.get("/carrito/{carrito_id}", response_model=Carrito)
async def obtener_carrito(carrito_id: str):
    """Obtener un carrito específico"""
    carrito = await db.carritos.find_one({"id": carrito_id})
    if not carrito:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")
    return Carrito(**carrito)

# RUTAS PARA PEDIDOS
@api_router.post("/pedidos", response_model=Pedido)
async def crear_pedido(pedido_data: PedidoCreate):
    """Crear un nuevo pedido"""
    # Obtener el carrito
    carrito = await db.carritos.find_one({"id": pedido_data.carrito_id})
    if not carrito:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")
    
    # Crear el pedido
    pedido_dict = pedido_data.dict()
    pedido_dict["total"] = carrito["total"]
    pedido_obj = Pedido(**pedido_dict)
    
    await db.pedidos.insert_one(pedido_obj.dict())
    return pedido_obj

@api_router.get("/pedidos", response_model=List[Pedido])
async def obtener_pedidos():
    """Obtener todos los pedidos"""
    pedidos = await db.pedidos.find().to_list(100)
    return [Pedido(**pedido) for pedido in pedidos]

@api_router.get("/pedidos/{pedido_id}", response_model=Pedido)
async def obtener_pedido(pedido_id: str):
    """Obtener un pedido específico"""
    pedido = await db.pedidos.find_one({"id": pedido_id})
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return Pedido(**pedido)

# RUTA PARA LAS CATEGORÍAS
@api_router.get("/categorias")
async def obtener_categorias():
    """Obtener todas las categorías disponibles"""
    return {
        "categorias": [
            {"value": "artisticos", "label": "Patines Artísticos"},
            {"value": "hockey", "label": "Patines de Hockey"},
            {"value": "velocidad", "label": "Patines de Velocidad"},
            {"value": "recreativos", "label": "Patines Recreativos"}
        ]
    }

# Incluir el router en la app principal
app.include_router(api_router)

# Middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()