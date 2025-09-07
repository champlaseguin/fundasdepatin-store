import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { ShoppingCart, Plus, Minus, Star, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente del Header
const Header = ({ carritoItems, setMostrarCarrito }) => {
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
    </header>
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
          className="w-full bg-gradient-to-r from-pink-600 to-teal-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-teal-600 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar al Carrito</span>
        </button>
      </div>
    </div>
  );
};

// Componente del Carrito
const Carrito = ({ mostrarCarrito, setMostrarCarrito, carritoItems, setCarritoItems }) => {
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
            <button className="w-full bg-gradient-to-r from-pink-600 to-teal-500 text-white font-bold py-3 px-6 rounded-lg hover:from-pink-700 hover:to-teal-600 transition-all duration-200">
              Proceder al Pago
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente Principal
const Home = () => {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [carritoItems, setCarritoItems] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header carritoItems={carritoItems} setMostrarCarrito={setMostrarCarrito} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-pink-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">Protege tus patines con estilo</h2>
          <p className="text-xl mb-8 text-pink-100">Las mejores fundas para todos los tipos de patines</p>
          <div className="flex justify-center space-x-8 text-center">
            <div>
              <div className="text-3xl font-bold">100+</div>
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

      <Carrito
        mostrarCarrito={mostrarCarrito}
        setMostrarCarrito={setMostrarCarrito}
        carritoItems={carritoItems}
        setCarritoItems={setCarritoItems}
      />
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;