import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, Plus, Minus, Star, Filter, User, LogOut, Settings, BarChart3, Package, Users, CreditCard, CheckCircle, XCircle, UserPlus, LogIn } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Contexto de autenticación
const AuthContext = React.createContext();

// Componente del Header
const Header = ({ carritoItems, setMostrarCarrito, usuario, logout, setMostrarLogin }) => {
  const totalItems = carritoItems.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <header className="bg-gradient-to-r from-pink-600 to-teal-500 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="https://customer-assets.emergentagent.com/job_practica-espanol-2/artifacts/kzi4phui_ChatGPT%20Image%2013%20may%202025%2C%2010_52_32.png" 
              alt="Fundas de Patín"
              className="h-12 w-12 object-contain bg-white rounded-lg p-1"
            />
            <div>
              <h1 className="text-2xl font-bold">fundasdepatin.com</h1>
              <p className="text-pink-100 text-sm">Protege tus patines con estilo</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {usuario ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm">Hola, {usuario.nombre}</span>
                {usuario.rol === 'admin' && (
                  <a href="/admin" className="bg-yellow-500 text-black px-3 py-1 rounded-lg text-sm font-semibold hover:bg-yellow-400">
                    Admin
                  </a>
                )}
                <button
                  onClick={logout}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-3 py-2 transition-all duration-200 flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMostrarLogin(true)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2 transition-all duration-200 flex items-center space-x-2"
              >
                <User className="h-5 w-5" />
                <span>Iniciar Sesión</span>
              </button>
            )}
            
            <button
              onClick={() => setMostrarCarrito(true)}
              className="relative bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2 transition-all duration-200 flex items-center space-x-2"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="font-semibold">Carrito</span>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-pink-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

// Modal de Login/Registro
const LoginModal = ({ mostrarLogin, setMostrarLogin, setUsuario }) => {
  const [esRegistro, setEsRegistro] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    codigo_postal: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = esRegistro ? '/auth/register' : '/auth/login';
      const data = esRegistro ? formData : { email: formData.email, password: formData.password };
      
      const response = await axios.post(`${API}${endpoint}`, data);
      
      if (esRegistro) {
        setEsRegistro(false);
        setError('');
        alert('Registro exitoso. Ahora puedes iniciar sesión.');
      } else {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUsuario(response.data.user);
        setMostrarLogin(false);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  if (!mostrarLogin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="bg-gradient-to-r from-pink-600 to-teal-500 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{esRegistro ? 'Registro' : 'Iniciar Sesión'}</h2>
            <button
              onClick={() => setMostrarLogin(false)}
              className="text-white hover:text-pink-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {esRegistro && (
            <>
              <input
                type="text"
                placeholder="Nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
                required
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
              />
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                  className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
                />
                <input
                  type="text"
                  placeholder="C.P."
                  value={formData.codigo_postal}
                  onChange={(e) => setFormData({...formData, codigo_postal: e.target.value})}
                  className="w-24 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />
          
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-teal-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : (esRegistro ? 'Registrarse' : 'Iniciar Sesión')}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setEsRegistro(!esRegistro)}
              className="text-pink-600 hover:text-pink-800 font-medium"
            >
              {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente de Filtros
const Filtros = ({ categorias, categoriaSeleccionada, setCategoriaSeleccionada }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <Filter className="h-5 w-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-gray-800">Filtrar por categoría</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setCategoriaSeleccionada("")}
          className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
            categoriaSeleccionada === "" 
              ? "bg-pink-600 text-white shadow-lg" 
              : "bg-gray-100 text-gray-700 hover:bg-pink-100"
          }`}
        >
          Todas
        </button>
        {categorias.map((categoria) => (
          <button
            key={categoria.value}
            onClick={() => setCategoriaSeleccionada(categoria.value)}
            className={`px-4 py-2 rounded-full font-medium transition-all duration-200 ${
              categoriaSeleccionada === categoria.value 
                ? "bg-pink-600 text-white shadow-lg" 
                : "bg-gray-100 text-gray-700 hover:bg-pink-100"
            }`}
          >
            {categoria.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Componente de Producto
const ProductoCard = ({ producto, agregarAlCarrito }) => {
  const [tallaSeleccionada, setTallaSeleccionada] = useState(producto.tallas_disponibles[0]);
  const [colorSeleccionado, setColorSeleccionado] = useState(producto.colores_disponibles[0]);

  // Mapeo de imágenes por categoría
  const imagenesPorCategoria = {
    artisticos: "https://images.unsplash.com/photo-1609900179380-6cf74a55a827?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHxyb2xsZXIlMjBza2F0ZSUyMHByb3RlY3Rpb258ZW58MHx8fHwxNzU3MjQ2MDU3fDA&ixlib=rb-4.1.0&q=85",
    hockey: "https://images.unsplash.com/photo-1550035213-d042e26b45e0?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwzfHxmdW5kYXMlMjBwYXRpbmVzfGVufDB8fHx8MTc1NzI0NjA1MHww&ixlib=rb-4.1.0&q=85",
    velocidad: "https://images.unsplash.com/photo-1747720630334-04ec9b605823?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxyb2xsZXIlMjBza2F0ZSUyMHByb3RlY3Rpb258ZW58MHx8fHwxNzU3MjQ2MDU3fDA&ixlib=rb-4.1.0&q=85",
    recreativos: "https://images.unsplash.com/photo-1734524671529-c59a6d2e33b6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHw0fHxyb2xsZXIlMjBza2F0ZSUyMHByb3RlY3Rpb258ZW58MHx8fHwxNzU3MjQ2MDU3fDA&ixlib=rb-4.1.0&q=85"
  };

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="relative">
        <img
          src={imagenesPorCategoria[producto.categoria] || imagenesPorCategoria.artisticos}
          alt={producto.nombre}
          className="w-full h-64 object-cover"
        />
        <div className="absolute top-4 right-4 bg-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
          €{producto.precio}
        </div>
        {producto.stock < 10 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            ¡Pocas unidades!
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{producto.nombre}</h3>
        <p className="text-gray-600 mb-4 text-sm">{producto.descripcion}</p>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <Star className="h-4 w-4 text-gray-300" />
            <span className="text-sm text-gray-500 ml-2">(4.0)</span>
          </div>
          <p className="text-sm text-gray-600">Stock: {producto.stock} unidades</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Talla:</label>
          <select
            value={tallaSeleccionada}
            onChange={(e) => setTallaSeleccionada(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {producto.tallas_disponibles.map((talla) => (
              <option key={talla} value={talla}>{talla}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Color:</label>
          <select
            value={colorSeleccionado}
            onChange={(e) => setColorSeleccionado(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {producto.colores_disponibles.map((color) => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => agregarAlCarrito(producto, tallaSeleccionada, colorSeleccionado)}
          disabled={producto.stock === 0}
          className="w-full bg-gradient-to-r from-pink-600 to-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-teal-600 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-5 w-5" />
          <span>{producto.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}</span>
        </button>
      </div>
    </div>
  );
};

// Componente del Carrito mejorado con pagos
const Carrito = ({ mostrarCarrito, setMostrarCarrito, carritoItems, setCarritoItems, usuario }) => {
  const [procesandoPago, setProcesandoPago] = useState(false);
  
  if (!mostrarCarrito) return null;

  const total = carritoItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarItem(index);
      return;
    }
    const nuevosItems = [...carritoItems];
    nuevosItems[index].cantidad = nuevaCantidad;
    setCarritoItems(nuevosItems);
  };

  const eliminarItem = (index) => {
    const nuevosItems = carritoItems.filter((_, i) => i !== index);
    setCarritoItems(nuevosItems);
  };

  const procesarPago = async () => {
    if (carritoItems.length === 0) return;
    
    setProcesandoPago(true);
    
    try {
      // Crear carrito usando los items actuales del estado
      const carritoData = {
        items: carritoItems.map(item => ({
          producto_id: item.id,
          cantidad: item.cantidad,
          talla: item.talla,
          color: item.color
        }))
      };

      const carritoResponse = await axios.post(`${API}/carrito`, carritoData);
      const carritoId = carritoResponse.data.id;

      // Crear sesión de pago
      const pagoData = {
        carrito_id: carritoId,
        metodo: "stripe"
      };

      const pagoResponse = await axios.post(`${API}/pagos/checkout`, pagoData);
      
      // Redirigir a Stripe
      window.location.href = pagoResponse.data.checkout_url;
      
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gradient-to-r from-pink-600 to-teal-500 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Tu Carrito</h2>
            <button
              onClick={() => setMostrarCarrito(false)}
              className="text-white hover:text-pink-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          {carritoItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {carritoItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{item.nombre}</h4>
                    <p className="text-sm text-gray-600">Talla: {item.talla} | Color: {item.color}</p>
                    <p className="text-pink-600 font-semibold">€{item.precio}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => actualizarCantidad(index, item.cantidad - 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="font-semibold w-8 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(index, item.cantidad + 1)}
                      className="bg-gray-200 hover:bg-gray-300 rounded-full p-1"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => eliminarItem(index)}
                    className="text-red-500 hover:text-red-700 font-semibold"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {carritoItems.length > 0 && (
          <div className="border-t p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold">Total: €{total.toFixed(2)}</span>
            </div>
            <button
              onClick={procesarPago}
              disabled={procesandoPago}
              className="w-full bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-teal-600 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <CreditCard className="h-5 w-5" />
              <span>{procesandoPago ? 'Procesando...' : 'Pagar con Stripe'}</span>
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Pago seguro procesado por Stripe
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Principal de la Tienda
const Home = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [carritoItems, setCarritoItems] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [mostrarLogin, setMostrarLogin] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay usuario logueado
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUsuario(JSON.parse(userData));
    }
    
    cargarProductos();
    cargarCategorias();
  }, [categoriaSeleccionada]);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const url = categoriaSeleccionada 
        ? `${API}/productos?categoria=${categoriaSeleccionada}`
        : `${API}/productos`;
      const response = await axios.get(url);
      setProductos(response.data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias`);
      setCategorias(response.data.categorias);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  };

  const agregarAlCarrito = (producto, talla, color) => {
    const itemExistente = carritoItems.findIndex(
      item => item.id === producto.id && item.talla === talla && item.color === color
    );

    if (itemExistente !== -1) {
      const nuevosItems = [...carritoItems];
      nuevosItems[itemExistente].cantidad += 1;
      setCarritoItems(nuevosItems);
    } else {
      setCarritoItems([...carritoItems, {
        ...producto,
        talla,
        color,
        cantidad: 1
      }]);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUsuario(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        carritoItems={carritoItems} 
        setMostrarCarrito={setMostrarCarrito} 
        usuario={usuario}
        logout={logout}
        setMostrarLogin={setMostrarLogin}
      />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Protege tus patines con estilo</h2>
          <p className="text-xl mb-8 text-pink-100">Las mejores fundas para todos los tipos de patines</p>
          <div className="flex justify-center space-x-8 text-center">
            <div>
              <div className="text-3xl font-bold">{productos.length}+</div>
              <div className="text-pink-200">Productos</div>
            </div>
            <div>
              <div className="text-3xl font-bold">5★</div>
              <div className="text-pink-200">Calificación</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24h</div>
              <div className="text-pink-200">Envío rápido</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <Filtros 
          categorias={categorias}
          categoriaSeleccionada={categoriaSeleccionada}
          setCategoriaSeleccionada={setCategoriaSeleccionada}
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productos.map((producto) => (
              <ProductoCard
                key={producto.id}
                producto={producto}
                agregarAlCarrito={agregarAlCarrito}
              />
            ))}
          </div>
        )}

        {productos.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No se encontraron productos en esta categoría.</p>
          </div>
        )}
      </div>

      <LoginModal 
        mostrarLogin={mostrarLogin}
        setMostrarLogin={setMostrarLogin}
        setUsuario={setUsuario}
      />

      <Carrito
        mostrarCarrito={mostrarCarrito}
        setMostrarCarrito={setMostrarCarrito}
        carritoItems={carritoItems}
        setCarritoItems={setCarritoItems}
        usuario={usuario}
      />
    </div>
  );
};

// Componente del Panel de Administración
const AdminPanel = () => {
  const [usuario, setUsuario] = useState(null);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: 'artisticos',
    tallas_disponibles: ['S', 'M', 'L'],
    colores_disponibles: ['Negro'],
    material: '',
    stock: '',
    caracteristicas: []
  });

  useEffect(() => {
    // Verificar autenticación de admin
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      window.location.href = '/';
      return;
    }
    
    const user = JSON.parse(userData);
    if (user.rol !== 'admin') {
      window.location.href = '/';
      return;
    }
    
    setUsuario(user);
    cargarDatosAdmin();
  }, []);

  const cargarDatosAdmin = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [productosRes, pedidosRes, estadisticasRes] = await Promise.all([
        axios.get(`${API}/productos`, { headers }),
        axios.get(`${API}/pedidos`, { headers }),
        axios.get(`${API}/admin/estadisticas`, { headers })
      ]);

      setProductos(productosRes.data);
      setPedidos(pedidosRes.data);
      setEstadisticas(estadisticasRes.data);
    } catch (error) {
      console.error('Error cargando datos de admin:', error);
    }
  };

  const crearProducto = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const productoData = {
        ...nuevoProducto,
        precio: parseFloat(nuevoProducto.precio),
        stock: parseInt(nuevoProducto.stock)
      };
      
      await axios.post(`${API}/productos`, productoData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Resetear formulario
      setNuevoProducto({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria: 'artisticos',
        tallas_disponibles: ['S', 'M', 'L'],
        colores_disponibles: ['Negro'],
        material: '',
        stock: '',
        caracteristicas: []
      });
      
      cargarDatosAdmin();
      alert('Producto creado exitosamente');
    } catch (error) {
      console.error('Error creando producto:', error);
      alert('Error al crear producto');
    }
  };

  if (!usuario) {
    return <div className="min-h-screen flex items-center justify-center">Verificando permisos...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Admin */}
      <header className="bg-gradient-to-r from-pink-600 to-teal-500 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Panel de Administración</h1>
              <p className="text-pink-100">fundasdepatin.com</p>
            </div>
            <div className="flex items-center space-x-4">
              <span>Admin: {usuario.nombre}</span>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg px-4 py-2"
              >
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg min-h-screen">
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setVistaActual('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                    vistaActual === 'dashboard' ? 'bg-pink-100 text-pink-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setVistaActual('productos')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                    vistaActual === 'productos' ? 'bg-pink-100 text-pink-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span>Productos</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setVistaActual('pedidos')}
                  className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg ${
                    vistaActual === 'pedidos' ? 'bg-pink-100 text-pink-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Pedidos</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-8">
          {vistaActual === 'dashboard' && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Package className="h-8 w-8 text-pink-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Productos</p>
                      <p className="text-2xl font-bold text-gray-900">{estadisticas.total_productos || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-teal-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Usuarios</p>
                      <p className="text-2xl font-bold text-gray-900">{estadisticas.total_usuarios || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <CreditCard className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pedidos</p>
                      <p className="text-2xl font-bold text-gray-900">{estadisticas.total_pedidos || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <BarChart3 className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Ventas (mes)</p>
                      <p className="text-2xl font-bold text-gray-900">€{estadisticas.ventas_mes || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {vistaActual === 'productos' && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Gestión de Productos</h2>
              
              {/* Formulario para crear producto */}
              <div className="bg-white p-6 rounded-lg shadow mb-8">
                <h3 className="text-xl font-bold mb-4">Crear Nuevo Producto</h3>
                <form onSubmit={crearProducto} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del producto"
                    value={nuevoProducto.nombre}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value={nuevoProducto.precio}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, precio: e.target.value})}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <select
                    value={nuevoProducto.categoria}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, categoria: e.target.value})}
                    className="border rounded-lg px-3 py-2"
                  >
                    <option value="artisticos">Patines Artísticos</option>
                    <option value="hockey">Patines de Hockey</option>
                    <option value="velocidad">Patines de Velocidad</option>
                    <option value="recreativos">Patines Recreativos</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={nuevoProducto.stock}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, stock: e.target.value})}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Material"
                    value={nuevoProducto.material}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, material: e.target.value})}
                    className="border rounded-lg px-3 py-2"
                    required
                  />
                  <textarea
                    placeholder="Descripción"
                    value={nuevoProducto.descripcion}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, descripcion: e.target.value})}
                    className="border rounded-lg px-3 py-2 md:col-span-2"
                    rows="3"
                    required
                  />
                  <button
                    type="submit"
                    className="md:col-span-2 bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg"
                  >
                    Crear Producto
                  </button>
                </form>
              </div>

              {/* Lista de productos */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold">Productos Existentes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productos.map((producto) => (
                        <tr key={producto.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{producto.nombre}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{producto.categoria}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">€{producto.precio}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{producto.stock}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {vistaActual === 'pedidos' && (
            <div>
              <h2 className="text-3xl font-bold mb-8">Gestión de Pedidos</h2>
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold">Pedidos Recientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pedidos.map((pedido) => (
                        <tr key={pedido.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{pedido.id.substring(0, 8)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {new Date(pedido.fecha_pedido).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">€{pedido.total}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              pedido.estado === 'completado' ? 'bg-green-100 text-green-800' : 
                              pedido.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pedido.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">{pedido.metodo_pago}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Páginas de éxito y cancelación de pago
const PagoExito = () => {
  const [estadoPago, setEstadoPago] = useState('verificando');
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    
    if (sessionId) {
      verificarPago(sessionId);
    }
  }, []);

  const verificarPago = async (sessionId) => {
    try {
      const response = await axios.get(`${API}/pagos/status/${sessionId}`);
      if (response.data.payment_status === 'paid') {
        setEstadoPago('exitoso');
      } else {
        setEstadoPago('pendiente');
      }
    } catch (error) {
      setEstadoPago('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {estadoPago === 'verificando' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Verificando pago...</h2>
          </>
        )}
        
        {estadoPago === 'exitoso' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Pago exitoso!</h2>
            <p className="text-gray-600 mb-6">Tu pedido ha sido procesado correctamente.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg"
            >
              Volver a la tienda
            </button>
          </>
        )}
        
        {estadoPago === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Error en el pago</h2>
            <p className="text-gray-600 mb-6">Hubo un problema procesando tu pago.</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg"
            >
              Volver a la tienda
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const PagoCancelado = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Pago cancelado</h2>
        <p className="text-gray-600 mb-6">Has cancelado el proceso de pago. Puedes intentarlo de nuevo cuando quieras.</p>
        <button
          onClick={() => window.location.href = '/'}
          className="bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
};

// Componente principal de la aplicación
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/checkout/success" element={<PagoExito />} />
          <Route path="/checkout/cancel" element={<PagoCancelado />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;