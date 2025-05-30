"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Trash2,
  Package,
  User
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: {
    id: number;
    nombre: string;
  };
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      notas: "",
    },
  });

  // Fetch productos y categorías
  useEffect(() => {
    fetchProductos();
    fetchCategorias();
  }, []);

  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/productos", { headers });

      let prods = Array.isArray(res.data) ? res.data : [];
      setProductos(prods);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setProductos([]);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/categorias", { headers });

      let cats = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setCategorias(cats);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setCategorias([]);
    }
  };

  // Agregar producto al carrito
  const addToCart = (producto: Producto) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.producto.id === producto.id);

      if (existingItem) {
        const newCantidad = existingItem.cantidad + 1;
        return prevCart.map(item =>
          item.producto.id === producto.id
            ? { 
                ...item, 
                cantidad: newCantidad, 
                subtotal: Number((newCantidad * Number(item.producto.precio)).toFixed(2))
              }
            : item
        );
      } else {
        return [...prevCart, {
          producto,
          cantidad: 1,
          subtotal: Number((Number(producto.precio)).toFixed(2))
        }];
      }
    });
  };

  // Actualizar cantidad en el carrito
  const updateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.producto.id === productId
          ? { 
              ...item, 
              cantidad: newQuantity, 
              subtotal: Number((newQuantity * Number(item.producto.precio)).toFixed(2))
            }
          : item
      )
    );
  };

  // Remover del carrito
  const removeFromCart = (productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.producto.id !== productId));
  };

  // Limpiar carrito
  const clearCart = () => {
    setCart([]);
  };

  // Calcular total
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Filtrar productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || producto.categoria.id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Crear orden
  const onSubmit = async (data: any) => {
    if (cart.length === 0) {
      alert("Agrega al menos un producto al carrito");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesión para crear una orden");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const orderData = {
        items: cart.map(item => ({
          productoId: item.producto.id,
          cantidad: item.cantidad
        }))
      };

      const res = await axios.post("http://localhost:3001/ordenes", orderData, { headers });

      // Limpiar formulario y carrito
      form.reset();
      clearCart();

      alert("Orden creada exitosamente");
      router.push("/dashboard/ordenes/gestionar");
    } catch (err: any) {
      console.error("Error al crear orden:", err);
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            router.push("/login");
            break;
          case 403:
            alert("No tienes permiso para crear órdenes. Debes ser un mozo.");
            break;
          case 404:
            alert("Uno o más productos no fueron encontrados.");
            break;
          default:
            alert(`Error al crear la orden: ${err.response.data?.message || 'Error desconocido'}`);
        }
      } else {
        alert("Error de conexión. Por favor, intenta nuevamente.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Nueva Orden</h1>
          <p className="text-muted-foreground">
            Selecciona los productos para la orden
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-lg">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <span className="font-medium text-primary">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Catálogo de Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <Card>
            <CardContent className="p-6">
              {filteredProductos.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No se encontraron productos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Intenta ajustar los filtros de búsqueda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProductos.map((producto) => (
                    <div
                      key={producto.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => addToCart(producto)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium">{producto.nombre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {producto.categoria.nombre}
                          </p>
                          <p className="text-lg font-bold text-primary mt-2">
                            ${Number(producto.precio).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(producto);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart and Order Form */}
        <div className="space-y-6">
          {/* Cart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Carrito
                </div>
                {cart.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearCart}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    El carrito está vacío
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Agrega productos para crear una orden
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.producto.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.producto.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          ${Number(item.producto.precio).toFixed(2)} c/u
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.cantidad}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.producto.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="font-medium">${item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="notas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notas (Opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Instrucciones especiales..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Creando Orden..." : "Crear Orden"}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}