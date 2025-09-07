from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from enum import Enum
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Tienda de Fundas de Patines - API Completa", version="2.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Enum para categorías de patines
class TipoPatines(str, Enum):
    ARTISTICOS = "artisticos"
    HOCKEY = "hockey"
    VELOCIDAD = "velocidad"
    RECREATIVOS = "recreativos"

# Enum para roles de usuario
class RolUsuario(str, Enum):
    CLIENTE = "cliente"
    ADMIN = "admin"

# MODELOS DE USUARIO Y AUTENTICACIÓN
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class Usuario(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    email: EmailStr
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    rol: RolUsuario = RolUsuario.CLIENTE
    activo: bool = True
    fecha_registro: datetime = Field(default_factory=datetime.utcnow)

class UsuarioResponse(BaseModel):
    id: str
    nombre: str
    email: str
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    ciudad: Optional[str] = None
    codigo_postal: Optional[str] = None
    rol: RolUsuario
    fecha_registro: datetime

# MODELOS DE PRODUCTOS
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

# MODELOS DE CARRITO Y PEDIDOS
class ItemCarrito(BaseModel):
    producto_id: str
    cantidad: int
    talla: str
    color: str

class CarritoCreate(BaseModel):
    items: List[ItemCarrito]
    usuario_id: Optional[str] = None
    
class Carrito(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[ItemCarrito]
    usuario_id: Optional[str] = None
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)
    total: float = 0.0

class DatosCliente(BaseModel):
    nombre: str
    email: str
    telefono: str
    direccion: str
    ciudad: str
    codigo_postal: str

class PedidoCreate(BaseModel):
    carrito_id: str
    datos_cliente: Optional[DatosCliente] = None
    metodo_pago: str

class Pedido(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    carrito_id: str
    usuario_id: Optional[str] = None
    datos_cliente: Optional[DatosCliente] = None
    metodo_pago: str
    total: float
    estado: str = "pendiente"
    fecha_pedido: datetime = Field(default_factory=datetime.utcnow)

# MODELOS DE PAGO
class PagoCreate(BaseModel):
    carrito_id: str
    metodo: str  # "stripe" o "paypal"

class TransaccionPago(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    usuario_id: Optional[str] = None
    carrito_id: str
    amount: float
    currency: str = "eur"
    payment_status: str = "pending"
    metadata: Optional[Dict[str, Any]] = {}
    fecha_creacion: datetime = Field(default_factory=datetime.utcnow)

# FUNCIONES DE UTILIDAD
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")
    
    user = await db.usuarios.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return Usuario(**user)

async def get_admin_user(current_user: Usuario = Depends(get_current_user)):
    if current_user.rol != RolUsuario.ADMIN:
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requieren permisos de administrador")
    return current_user

# RUTAS DE AUTENTICACIÓN
@api_router.post("/auth/register", response_model=UsuarioResponse)
async def registrar_usuario(usuario_data: UsuarioCreate):
    """Registrar un nuevo usuario"""
    # Verificar si el email ya existe
    existing_user = await db.usuarios.find_one({"email": usuario_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    # Crear usuario
    usuario_dict = usuario_data.dict()
    usuario_dict["password"] = hash_password(usuario_data.password)
    usuario_obj = Usuario(**usuario_dict)
    
    await db.usuarios.insert_one(usuario_obj.dict())
    return UsuarioResponse(**usuario_obj.dict())

@api_router.post("/auth/login")
async def login_usuario(usuario_login: UsuarioLogin):
    """Iniciar sesión"""
    user = await db.usuarios.find_one({"email": usuario_login.email})
    if not user or not verify_password(usuario_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    if not user["activo"]:
        raise HTTPException(status_code=401, detail="Usuario inactivo")
    
    access_token = create_access_token(data={"sub": user["id"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UsuarioResponse(**user)
    }

@api_router.get("/auth/me", response_model=UsuarioResponse)
async def get_current_user_info(current_user: Usuario = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return UsuarioResponse(**current_user.dict())

# RUTAS PARA PRODUCTOS
@api_router.get("/")
async def root():
    return {"message": "API Tienda de Fundas de Patines", "version": "2.0.0"}

@api_router.post("/productos", response_model=Producto)
async def crear_producto(producto: ProductoCreate, admin_user: Usuario = Depends(get_admin_user)):
    """Crear un nuevo producto (solo administradores)"""
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
async def actualizar_producto(producto_id: str, producto_actualizado: ProductoCreate, admin_user: Usuario = Depends(get_admin_user)):
    """Actualizar un producto (solo administradores)"""
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
async def eliminar_producto(producto_id: str, admin_user: Usuario = Depends(get_admin_user)):
    """Eliminar un producto (solo administradores)"""
    resultado = await db.productos.update_one(
        {"id": producto_id},
        {"$set": {"activo": False}}
    )
    if resultado.matched_count == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"message": "Producto eliminado correctamente"}

# RUTAS PARA CARRITO
@api_router.post("/carrito", response_model=Carrito)
async def crear_carrito(carrito_data: CarritoCreate, current_user: Optional[Usuario] = None):
    """Crear un nuevo carrito"""
    try:
        current_user = await get_current_user()
        carrito_data.usuario_id = current_user.id
    except:
        pass  # Usuario anónimo
    
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
async def crear_pedido(pedido_data: PedidoCreate, current_user: Optional[Usuario] = None):
    """Crear un nuevo pedido"""
    try:
        current_user = await get_current_user()
    except:
        current_user = None
    
    # Obtener el carrito
    carrito = await db.carritos.find_one({"id": pedido_data.carrito_id})
    if not carrito:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")
    
    # Crear el pedido
    pedido_dict = pedido_data.dict()
    pedido_dict["total"] = carrito["total"]
    if current_user:
        pedido_dict["usuario_id"] = current_user.id
    pedido_obj = Pedido(**pedido_dict)
    
    await db.pedidos.insert_one(pedido_obj.dict())
    return pedido_obj

@api_router.get("/pedidos", response_model=List[Pedido])
async def obtener_pedidos(current_user: Usuario = Depends(get_current_user)):
    """Obtener pedidos del usuario o todos si es admin"""
    if current_user.rol == RolUsuario.ADMIN:
        pedidos = await db.pedidos.find().to_list(100)
    else:
        pedidos = await db.pedidos.find({"usuario_id": current_user.id}).to_list(100)
    
    return [Pedido(**pedido) for pedido in pedidos]

# RUTAS DE PAGO CON STRIPE
@api_router.post("/pagos/checkout")
async def crear_checkout_session(pago_data: PagoCreate, request: Request):
    """Crear sesión de checkout con Stripe"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    
    # Obtener el carrito
    carrito = await db.carritos.find_one({"id": pago_data.carrito_id})
    if not carrito:
        raise HTTPException(status_code=404, detail="Carrito no encontrado")
    
    # Configurar Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # URLs de éxito y cancelación
    success_url = f"{host_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/checkout/cancel"
    
    # Crear sesión de checkout
    checkout_request = CheckoutSessionRequest(
        amount=float(carrito["total"]),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "carrito_id": pago_data.carrito_id,
            "usuario_id": carrito.get("usuario_id", "anonimo")
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Guardar transacción
    transaccion = TransaccionPago(
        session_id=session.session_id,
        usuario_id=carrito.get("usuario_id"),
        carrito_id=pago_data.carrito_id,
        amount=float(carrito["total"]),
        currency="eur",
        payment_status="pending",
        metadata={"session_url": session.url}
    )
    
    await db.payment_transactions.insert_one(transaccion.dict())
    
    return {
        "checkout_url": session.url,
        "session_id": session.session_id
    }

@api_router.get("/pagos/status/{session_id}")
async def obtener_estado_pago(session_id: str):
    """Obtener el estado de un pago"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Actualizar transacción en BD
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {"payment_status": status_response.payment_status}}
    )
    
    return {
        "status": status_response.status,
        "payment_status": status_response.payment_status,
        "amount_total": status_response.amount_total,
        "currency": status_response.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Webhook de Stripe"""
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Stripe no configurado")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Actualizar transacción
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {"payment_status": webhook_response.payment_status}}
        )
        
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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

# RUTAS DE ADMINISTRACIÓN
@api_router.get("/admin/usuarios", response_model=List[UsuarioResponse])
async def obtener_usuarios(admin_user: Usuario = Depends(get_admin_user)):
    """Obtener todos los usuarios (solo administradores)"""
    usuarios = await db.usuarios.find().to_list(100)
    return [UsuarioResponse(**usuario) for usuario in usuarios]

@api_router.get("/admin/estadisticas")
async def obtener_estadisticas(admin_user: Usuario = Depends(get_admin_user)):
    """Obtener estadísticas de la tienda"""
    total_productos = await db.productos.count_documents({"activo": True})
    total_usuarios = await db.usuarios.count_documents({"activo": True})
    total_pedidos = await db.pedidos.count_documents({})
    
    # Ventas del último mes
    fecha_mes = datetime.utcnow() - timedelta(days=30)
    ventas_mes = await db.pedidos.aggregate([
        {"$match": {"fecha_pedido": {"$gte": fecha_mes}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]).to_list(1)
    
    ventas_total = ventas_mes[0]["total"] if ventas_mes else 0
    
    return {
        "total_productos": total_productos,
        "total_usuarios": total_usuarios,
        "total_pedidos": total_pedidos,
        "ventas_mes": ventas_total
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

@app.on_event("startup")
async def startup_event():
    """Crear usuario admin por defecto"""
    admin_exists = await db.usuarios.find_one({"email": "admin@fundasdepatin.com"})
    if not admin_exists:
        admin_user = Usuario(
            nombre="Administrador",
            email="admin@fundasdepatin.com",
            telefono="",
            direccion="",
            ciudad="",
            codigo_postal="",
            rol=RolUsuario.ADMIN
        )
        admin_dict = admin_user.dict()
        admin_dict["password"] = hash_password("admin123")
        await db.usuarios.insert_one(admin_dict)
        logger.info("Usuario administrador creado: admin@fundasdepatin.com / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()