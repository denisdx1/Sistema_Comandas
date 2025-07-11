"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Trash2,
  Package,
  User,
  CheckCircle,
  AlertCircle,
  Filter,
  X,
  Receipt,
  DollarSign,
  Tag,
  ChevronUp,
  ChevronDown,
  Loader2,
  Wine
} from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";


interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: {
    id: number;
    nombre: string;
  };
  stock: number;
  esComplemento?: boolean;
  tipoComplemento?: 'NO_ES_COMPLEMENTO' | 'BEBIDA_PARA_LICOR' | 'OTRO_COMPLEMENTO';
}

// Interfaz para complementos con cantidad
interface ComplementoSeleccionado {
  producto: Producto;
  cantidad: number;
}

interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
  complementos?: ComplementoSeleccionado[];
}

interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  productos: {
    productoId: number;
    cantidad: number;
    producto: Producto;
  }[];
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categorias, setCategorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [combos, setCombos] = useState<Combo[]>([]);
  const [combosLoading, setCombosLoading] = useState(false);
  const [lastAddedId, setLastAddedId] = useState<number | null>(null); // Para animaciones
  
  // Estados para el modal de complementos
  const [complementosModalOpen, setComplementosModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [complementosDisponibles, setComplementosDisponibles] = useState<Producto[]>([]);
  const [complementosSeleccionados, setComplementosSeleccionados] = useState<ComplementoSeleccionado[]>([]);

  const form = useForm({
    defaultValues: {
      notas: "",
    },
  });

  // Eliminado: StylesComponent ya no es necesario, los estilos se movieron a globales.

  // Fetch productos, categorías y combos
  useEffect(() => {
    fetchProductos();
    fetchCategorias();
    fetchCombos();
  }, []);

  const fetchProductos = async () => {
    try {
      setProductsLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://192.168.0.102:3001/productos", { headers });

      let prods = Array.isArray(res.data) ? res.data : [];
      setProductos(prods);
    } catch (err) {
      console.error("Error al obtener productos:", err);
      setError("Error al cargar los productos. Intenta recargar la página.");
      setProductos([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://192.168.0.102:3001/categorias", { headers });

      let cats = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setCategorias(cats);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setCategorias([]);
    }
  };

  const fetchCombos = async () => {
    setCombosLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://192.168.0.102:3001/combos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filtrar solo combos activos
      setCombos(response.data.filter((combo: Combo) => combo.activo));
    } catch (error) {
      console.error('Error al cargar combos:', error);
      toast.error('Error al cargar los combos disponibles');
    } finally {
      setCombosLoading(false);
    }
  };

  // Verificar si un producto es un licor (categoría "Licores")
  const esLicor = (producto: Producto) => {
    return producto.categoria.nombre.toLowerCase() === 'licores';
  };

  // Obtener complementos para licores (productos de categoría "bebidas")
  const obtenerComplementos = () => {
    return productos.filter(p => 
      p.categoria.nombre.toLowerCase() === 'bebidas' && 
      p.id !== productoSeleccionado?.id
    );
  };

  // Manejar la selección de un complemento
  const toggleComplemento = (complemento: Producto) => {
    setComplementosSeleccionados(prev => {
      const existente = prev.find(p => p.producto.id === complemento.id);
      
      if (existente) {
        // Si ya existe, lo quitamos
        return prev.filter(p => p.producto.id !== complemento.id);
      } else {
        // Si no existe, lo añadimos con cantidad 1 y marcamos como complemento
        const complementoModificado = {
          ...complemento,
          esComplemento: true, // Marcar explícitamente como complemento
          tipoComplemento: 'BEBIDA_PARA_LICOR' as const// Establecer el tipo de complemento
        };
        return [...prev, { producto: complementoModificado, cantidad: 1 }];
      }
    });
  };

  // Incrementar la cantidad de un complemento
  const incrementarCantidadComplemento = (id: number) => {
    setComplementosSeleccionados(prev => 
      prev.map(item => 
        item.producto.id === id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      )
    );
  };

  // Decrementar la cantidad de un complemento
  const decrementarCantidadComplemento = (id: number) => {
    setComplementosSeleccionados(prev => 
      prev.map(item => 
        item.producto.id === id && item.cantidad > 1
          ? { ...item, cantidad: item.cantidad - 1 }
          : item
      )
    );
  };

  // Agregar producto al carrito con verificación de licor para mostrar modal de complementos
  const addToCart = (producto: Producto) => {
    // Verificar si es un licor (categoría "Tragos")
    if (esLicor(producto)) {
      // Seleccionar el producto y abrir el modal de complementos
      setProductoSeleccionado(producto);
      setComplementosSeleccionados([]); // Reiniciar complementos seleccionados
      setComplementosDisponibles(obtenerComplementos());
      setComplementosModalOpen(true);
    } else {
      // Para productos que no son licores, comportamiento normal
      addProductToCart(producto);
    }
  };

  // Función para agregar producto al carrito (sin mostrar modal)
  const addProductToCart = (producto: Producto, complementos: ComplementoSeleccionado[] = []) => {
    // Guardar el ID del producto para animación
    setLastAddedId(producto.id);
    
    // Eliminar el ID después de 1.2s (duración de la animación)
    setTimeout(() => {
      setLastAddedId(null);
    }, 1200);
    
    // Agregar al carrito
    setCart(prevCart => {
      const existingItem = prevCart.find(item => 
        item.producto.id === producto.id && 
        // Si no hay complementos, buscar item sin complementos
        ((!complementos.length && !item.complementos?.length) ||
        // Si hay complementos, verificar que sean los mismos
        (complementos.length > 0 && JSON.stringify(item.complementos?.map(c => ({productoId: c.producto.id, cantidad: c.cantidad})).sort()) === 
          JSON.stringify(complementos.map(c => ({productoId: c.producto.id, cantidad: c.cantidad})).sort()))
        )
      );

      if (existingItem) {
        const newCantidad = existingItem.cantidad + 1;
        // Mostrar toast para notificar al usuario que se incrementó la cantidad
        toast.success(`Se aumentó la cantidad de ${producto.nombre} (${newCantidad})`, {
          position: "bottom-right",
          duration: 2000,
        });
        
        return prevCart.map(item =>
          item.producto.id === producto.id &&
          // Verificar mismos complementos
          ((!complementos.length && !item.complementos?.length) ||
          (complementos.length > 0 && JSON.stringify(item.complementos?.map(c => ({productoId: c.producto.id, cantidad: c.cantidad})).sort()) === 
            JSON.stringify(complementos.map(c => ({productoId: c.producto.id, cantidad: c.cantidad})).sort())))
            ? { 
                ...item, 
                cantidad: newCantidad, 
                subtotal: Number((newCantidad * Number(item.producto.precio)).toFixed(2))
              }
            : item
        );
      } else {
        // Mostrar toast para notificar la adición al carrito
        let mensaje = `${producto.nombre} añadido a la orden`;
        if (complementos.length > 0) {
          const totalComplementos = complementos.reduce((sum, comp) => sum + comp.cantidad, 0);
          mensaje += ` con ${totalComplementos} complemento(s)`;
        }
        
        toast.success(mensaje, {
          position: "bottom-right",
          duration: 2000,
        });
        
        return [...prevCart, {
          producto,
          cantidad: 1,
          subtotal: Number((Number(producto.precio)).toFixed(2)),
          complementos: complementos.length > 0 ? complementos : undefined
        }];
      }
    });
  };

  // Función para confirmar la selección de complementos
  const confirmarComplementos = () => {
    if (productoSeleccionado) {
      // Agregar el licor con sus complementos al carrito
      addProductToCart(productoSeleccionado, complementosSeleccionados);
      
      // Cerrar el modal
      setComplementosModalOpen(false);
      setProductoSeleccionado(null);
      setComplementosSeleccionados([]);
    }
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

  // Calcular totales
  const total = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  // Filtrar productos
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || producto.categoria.id.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
  };

  // Función para añadir un combo a la orden
  const handleAddCombo = (combo: Combo) => {
    // Guardar el ID del combo para animación (usando IDs negativos para combos)
    setLastAddedId(-combo.id);
    
    // Eliminar el ID después de 1.2s (duración de la animación)
    setTimeout(() => {
      setLastAddedId(null);
    }, 1200);
    
    // Verificar disponibilidad de stock para todos los productos del combo
    for (const comboProducto of combo.productos) {
      const stockRequerido = comboProducto.cantidad;
      
      if (comboProducto.producto.stock < stockRequerido) {
        toast.error(`Stock insuficiente para ${comboProducto.producto.nombre} en el combo ${combo.nombre}`, {
          position: "bottom-right",
        });
        return;
      }
    }
    
    // Crear un objeto especial para el combo
    const comboItem: CartItem = {
      producto: {
        id: -combo.id, // ID negativo para identificar que es un combo
        nombre: `Combo: ${combo.nombre}`,
        precio: combo.precio,
        categoria: { id: 0, nombre: 'Combo' },
        stock: 999 // Un valor alto ya que ya verificamos el stock individual
      },
      cantidad: 1,
      subtotal: Number(Number(combo.precio).toFixed(2))
    };
    
    setCart(prev => {
      // Verificar si el combo ya está en el carrito
      const existingIndex = prev.findIndex(item => item.producto.id === -combo.id);
      
      if (existingIndex >= 0) {
        // Si el combo ya existe, incrementar cantidad
        const newCart = [...prev];
        newCart[existingIndex].cantidad += 1;
        newCart[existingIndex].subtotal = Number((newCart[existingIndex].cantidad * combo.precio).toFixed(2));
        
        // Mostrar toast
        toast.success(`Se aumentó la cantidad del combo ${combo.nombre}`, {
          position: "bottom-right",
          duration: 2000,
        });
        
        return newCart;
      } else {
        // Si no existe, agregar como nuevo item
        // Mostrar toast
        toast.success(`Combo ${combo.nombre} añadido a la orden`, {
          position: "bottom-right",
          duration: 2000,
        });
        
        return [...prev, comboItem];
      }
    });
  };

  // Crear orden
  const onSubmit = async (data: any) => {
    if (cart.length === 0) {
      setError("Agrega al menos un producto al carrito");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Debes iniciar sesión para crear una orden");
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Separar productos regulares, combos y promociones
      const productosRegulares = cart.filter(item => item.producto.id > 0);
      const combosEnCarrito = cart.filter(item => item.producto.id < 0);

      // Crear el arreglo de ítems, incluyendo productos y combos
      const allItems = [
        // Productos regulares
        ...productosRegulares.map(item => {
          // Solo enviamos el producto principal sin los complementos
          return {
            productoId: item.producto.id,
            cantidad: item.cantidad
          };
        }),
        // Complementos como items independientes con precio 0
        ...productosRegulares.flatMap(item => {
          if (item.complementos && item.complementos.length > 0) {
            return item.complementos.map(complemento => ({
              productoId: complemento.producto.id,
              cantidad: complemento.cantidad,
              precio: 0, // Los complementos se envían con precio 0
              nombre: `Complemento para ${item.producto.nombre}`,
              // Usar la propiedad esComplemento del producto si está disponible, o establecerla a true
              esComplemento: complemento.producto.esComplemento !== undefined ? complemento.producto.esComplemento : true,
              // Usar el tipo de complemento si está disponible, o establecer el valor por defecto
              tipoComplemento: complemento.producto.tipoComplemento || 'BEBIDA_PARA_LICOR',
              // Asociar con el producto principal
              productoAsociadoId: item.producto.id
            }));
          }
          return [];
        }),
        // Combos (con identificador comboId en lugar de productoId)
        ...combosEnCarrito.map(item => ({
          comboId: Math.abs(item.producto.id), // Convertir ID negativo a positivo
          cantidad: item.cantidad
        }))
      ];

      const orderData = {
        items: allItems,
        notas: data.notas || undefined
      };

      console.log("Enviando orden:", orderData);
      const res = await axios.post("http://192.168.0.102:3001/ordenes", orderData, { headers });

      // Limpiar formulario y carrito
      form.reset();
      clearCart();

      // Mostrar éxito y redirigir
      toast.success("¡Orden creada exitosamente! Serás redirigido a la vista de órdenes.", {
        duration: 3000,
      });

      setTimeout(() => {
        router.push("/dashboard/ordenes/gestionar");
      }, 1500);
      
    } catch (err: any) {
      console.error("Error al crear orden:", err);
      
      if (err.response) {
        switch (err.response.status) {
          case 401:
            setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            setTimeout(() => router.push("/login"), 2000);
            break;
          case 403:
            setError("No tienes permiso para crear órdenes. Debes ser un mozo.");
            break;
          case 404:
            setError("Uno o más productos no fueron encontrados.");
            break;
          case 400:
            setError(`Error en la solicitud: ${err.response.data?.message || 'Datos inválidos'}`);
            break;
          default:
            setError(`Error al crear la orden: ${err.response.data?.message || 'Error desconocido'}`);
        }
      } else {
        setError("Error de conexión. Por favor, intenta nuevamente.");
      }
    }
    setLoading(false);
  };

  // Skeleton loader para productos
  const ProductSkeleton = () => (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-2 md:p-6 flex flex-col items-center">
      {/* Toast notifications */}
      <Toaster />
      {/* Modal para seleccionar complementos de licor */}
      <Dialog open={complementosModalOpen} onOpenChange={(open) => {
        if (!open) {
          setComplementosModalOpen(false);
          setProductoSeleccionado(null);
          setComplementosSeleccionados([]);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-purple-600" />
              Complementos para {productoSeleccionado?.nombre}
            </DialogTitle>
            <DialogDescription>
              Selecciona los complementos y sus cantidades para este licor
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {complementosDisponibles.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-600">No hay complementos disponibles</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {complementosDisponibles.map(complemento => {
                  const isSelected = complementosSeleccionados.some(p => p.producto.id === complemento.id);
                  const selectedItem = complementosSeleccionados.find(p => p.producto.id === complemento.id);
                  
                  return (
                    <div 
                      key={complemento.id} 
                      className="flex items-center space-x-3 bg-slate-50 p-3 rounded-lg border transition-all hover:bg-slate-100"
                    >
                      <Checkbox 
                        id={`complemento-${complemento.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleComplemento(complemento)}
                      />
                      <label 
                        htmlFor={`complemento-${complemento.id}`}
                        className="flex-1 text-sm font-medium cursor-pointer flex justify-between"
                      >
                        <span>{complemento.nombre}</span>
                        <Badge variant="outline" className="ml-2 text-xs font-normal">
                          Stock: {complemento.stock}
                        </Badge>
                      </label>
                      
                      {isSelected && (
                        <div className="flex items-center space-x-2 ml-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => decrementarCantidadComplemento(complemento.id)}
                            disabled={selectedItem?.cantidad === 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-sm w-5 text-center">
                            {selectedItem?.cantidad || 1}
                          </span>
                          <Button
                            variant="outline" 
                            size="icon"
                            className="h-6 w-6 rounded-full p-0"
                            onClick={() => incrementarCantidadComplemento(complemento.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setComplementosModalOpen(false);
              setProductoSeleccionado(null);
              setComplementosSeleccionados([]);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmarComplementos}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Agregar {complementosSeleccionados.length > 0 ? 
                `con ${complementosSeleccionados.reduce((sum, comp) => sum + comp.cantidad, 0)} complemento(s)` : 
                'sin complementos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header mejorado */}
        <div className="bg-white rounded-xl shadow-sm border p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Nueva Orden
              </h1>
              <p className="text-slate-600 mt-1 text-sm md:text-base">
                Selecciona los productos para la orden del cliente
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-xl border border-blue-200">
                <div className="p-2 bg-blue-100 rounded-lg hidden sm:flex">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4 text-blue-600 sm:hidden" />
                    <span className="font-semibold text-blue-900">{totalItems}</span>
                    <span className="text-sm text-blue-700">
                      {totalItems === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>
                  <div className="font-bold text-lg text-blue-900">
                    ${total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Products Section - Ocupa más espacio */}
          <div className="xl:col-span-3 space-y-4 md:space-y-6">
            {/* Search and Filters mejorados */}
            <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
              <CardHeader className="pb-3 mobile-compact">
                <CardTitle className="flex items-center text-slate-800">
                  <div className="p-2 bg-slate-100 rounded-lg mr-3">
                    <Package className="h-5 w-5 text-slate-600" />
                  </div>
                  <span className="truncate">Catálogo de Productos</span>
                  <Badge variant="secondary" className="ml-auto">
                    {filteredProductos.length} productos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 mobile-compact">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Buscar productos por nombre..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 py-5 border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                    />
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-slate-100 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                    
                  {/* Filtros activos */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 hide-scrollbar">
                    {searchTerm && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1.5 gap-1.5 rounded-full whitespace-nowrap">
                        Búsqueda: {searchTerm}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSearchTerm("")}
                          className="h-4 w-4 p-0 hover:bg-blue-100 rounded-full ml-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    
                    {selectedCategory !== "all" && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1.5 gap-1.5 rounded-full whitespace-nowrap">
                        {categorias.find(cat => cat.id.toString() === selectedCategory)?.nombre || "Categoría"}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCategory("all")}
                          className="h-4 w-4 p-0 hover:bg-purple-100 rounded-full ml-1"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )}
                    
                    {(searchTerm || selectedCategory !== "all") && (
                      <Button 
                        variant="ghost"
                        onClick={clearFilters}
                        className="text-slate-500 hover:text-slate-700 text-sm px-3 py-1.5 h-auto"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </div>

                {/* Chips de categorías */}
                <ScrollArea className="w-full whitespace-nowrap pb-2">
                  <div className="flex space-x-2 pb-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap
                        ${selectedCategory === "all"
                          ? "bg-slate-800 text-white font-medium shadow"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                      Todas
                    </button>
                    {categorias.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap
                          ${selectedCategory === cat.id.toString()
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                      >
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Products Grid mejorado */}
            <Tabs defaultValue="productos" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 p-1 bg-slate-100 rounded-lg w-full md:w-auto">
                <TabsTrigger value="productos" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Package className="h-4 w-4" />
                  Productos
                </TabsTrigger>
                <TabsTrigger value="combos" className="flex items-center gap-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Tag className="h-4 w-4" />
                  Combos
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="productos" className="mt-2">
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
                  <CardContent className="p-4 md:p-6">
                    {productsLoading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="border rounded-lg p-4 space-y-3 animate-pulse">
                            <div className="h-5 bg-slate-200 rounded-md w-3/4"></div>
                            <div className="h-4 bg-slate-100 rounded-md w-1/2"></div>
                            <div className="flex justify-between items-center pt-2">
                              <div className="h-6 bg-slate-200 rounded-md w-16"></div>
                              <div className="h-9 bg-slate-200 rounded-md w-9"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filteredProductos.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Package className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          No se encontraron productos
                        </h3>
                        <p className="text-slate-500 mb-4">
                          {searchTerm || selectedCategory !== "all" ? "Intenta ajustar los filtros de búsqueda" : "Aún no hay productos disponibles"}
                        </p>
                        {(searchTerm || selectedCategory !== "all") && (
                          <Button variant="outline" onClick={clearFilters} className="rounded-lg">
                            <X className="h-4 w-4 mr-2" />
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {filteredProductos.map((producto) => (
                          <div
                            key={producto.id}
                            className={`group card-transition border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:shadow-blue-100/50 hover:border-blue-300 transition-all duration-300 cursor-pointer bg-white relative overflow-hidden ${lastAddedId === producto.id ? 'pulse-animation' : ''}`}
                            onClick={() => addToCart(producto)}
                          >
                            <div className="absolute -right-10 -top-10 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-start justify-between mb-3 relative">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                                  {producto.nombre}
                                </h3>
                                <Badge variant="outline" className="mt-1.5 text-xs px-2 py-0 bg-slate-50">
                                  {producto.categoria.nombre}
                                </Badge>
                              </div>
                              <div className="flex items-center">
                                {producto.stock <= 5 && (
                                  <Badge variant={producto.stock > 0 ? "outline" : "destructive"} className="text-xs mr-2">
                                    {producto.stock > 0 ? `Stock: ${producto.stock}` : "Sin stock"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between relative">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-xl font-bold text-green-700">
                                  {Number(producto.precio).toFixed(2)}
                                </span>
                              </div>
                              <div className="transform transition-all duration-300 group-hover:scale-110">
                                <Button
                                  size="sm"
                                  className={`bg-blue-600 hover:bg-blue-700 shadow-sm rounded-full h-9 w-9 p-0 ${lastAddedId === producto.id ? 'ring-2 ring-blue-300 ring-opacity-80' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(producto);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="combos" className="mt-2">
                <Card className="shadow-sm border-0 bg-white/80 backdrop-blur">
                  <CardContent className="p-4 md:p-6">
                    {combosLoading ? (
                      <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                      </div>
                    ) : combos.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                          <Tag className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          No hay combos disponibles
                        </h3>
                        <p className="text-slate-500">
                          Contacta con el administrador para crear combos
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {combos.map(combo => (
                          <div
                            key={combo.id}
                            className={`group card-transition border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:shadow-purple-100 hover:border-purple-300 transition-all duration-300 bg-white relative overflow-hidden ${lastAddedId === -combo.id ? 'pulse-animation' : ''}`}
                          >
                            <div className="absolute -right-10 -top-10 w-20 h-20 bg-gradient-to-bl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-full"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-50/0 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex items-start justify-between mb-3 relative">
                              <div className="flex-1">
                                <h3 className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-1">
                                  {combo.nombre}
                                </h3>
                                {combo.descripcion && (
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {combo.descripcion}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="border-t border-b border-slate-100 py-2 my-2">
                              <h4 className="text-xs font-medium mb-1 text-slate-600">Incluye:</h4>
                              <ul className="text-xs space-y-1">
                                {combo.productos.slice(0, 3).map(item => (
                                  <li key={item.productoId} className="flex justify-between">
                                    <span>{item.cantidad}x {item.producto.nombre}</span>
                                  </li>
                                ))}
                                {combo.productos.length > 3 && (
                                  <li className="text-slate-400 text-xs">
                                    + {combo.productos.length - 3} más...
                                  </li>
                                )}
                              </ul>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 relative">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-purple-600" />
                                <span className="text-xl font-bold text-purple-700">
                                  {Number(combo.precio).toFixed(2)}
                                </span>
                              </div>
                              <div className="transform transition-all duration-300 group-hover:scale-110">
                                <Button
                                  size="sm"
                                  className={`bg-purple-600 hover:bg-purple-700 shadow-sm rounded-full ${lastAddedId === -combo.id ? 'ring-2 ring-purple-300 ring-opacity-80' : ''}`}
                                  onClick={() => handleAddCombo(combo)}
                                >
                                  <Plus className="h-4 w-4 mr-1" /> Añadir
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          

          {/* Cart and Order Form - Sidebar fijo */}
          <div className="xl:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Cart mejorado */}
              {/* Minimalismo: menos sombra, sin borde, más padding */}
<Card className="bg-white rounded-2xl p-4 md:p-6 shadow-sm">
  <CardHeader className="pb-2 bg-white">
    <CardTitle className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-6 w-6 text-blue-500" />
        <span className="text-xl font-semibold text-slate-800">Orden</span>
      </div>
      {cart.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearCart}
          className="text-red-400 hover:text-red-600 h-8 px-2"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      )}
    </CardTitle>
  </CardHeader>
  <CardContent className="p-0 bg-white">
                  {cart.length === 0 ? (
                    <div className="text-center py-10">
                      {/* Minimalismo: menos colores decorativos */}
                      <div className="bg-slate-100 rounded-xl w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                        <ShoppingCart className="h-7 w-7 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium mb-1 text-base">
                        No hay productos
                      </p>
                      <p className="text-xs text-slate-400">
                        Agrega productos o combos para crear una orden
                      </p>
                    </div>
                  ) : (
                    <div>
                      <ScrollArea className="max-h-[350px] md:max-h-[400px]">
                        <div className="divide-y divide-slate-100">
                          {cart.map((item) => (
                            <div key={item.producto.id} className="p-3 hover:bg-slate-50 transition-colors relative group">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 pr-8">
                                  <h4 className="font-medium text-slate-900 text-sm line-clamp-1">
                                    {item.producto.nombre}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    ${Number(item.producto.precio).toFixed(2)} c/u
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.producto.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-0.5">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateQuantity(item.producto.id, item.cantidad - 1)}
                                    className="h-6 w-6 p-0 border-slate-200 rounded-md"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-8 text-center font-medium text-sm">
                                    {item.cantidad}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => updateQuantity(item.producto.id, item.cantidad + 1)}
                                    className="h-6 w-6 p-0 border-slate-200 rounded-md"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-green-700">
                                    ${item.subtotal.toFixed(2)}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Mostrar complementos si existen */}
                              {item.complementos && item.complementos.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-dashed border-slate-100">
                                  <p className="text-xs font-medium text-slate-600 mb-1 flex items-center">
                                    <Wine className="h-3 w-3 mr-1 text-purple-500" />
                                    Complementos:
                                  </p>
                                  <ul className="pl-4 space-y-1">
                                    {item.complementos.map((complemento, idx) => (
                                      <li key={idx} className="text-xs text-slate-600 flex justify-between">
                                        <span className="flex-1">{complemento.cantidad}x {complemento.producto.nombre}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {cart.length > 0 && (
                        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100">
                          <div className="flex items-center justify-between text-lg font-bold">
                            <span className="text-slate-800">Total:</span>
                            <span className="text-blue-900 text-xl">${total.toFixed(2)}</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-0.5">
                            {totalItems} {totalItems === 1 ? 'artículo' : 'artículos'}
                          </p>
                        </div>
                      )}

                      <div className="p-4">
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="notas"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-slate-700">Notas especiales</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="Instrucciones especiales..."
                                      className="resize-none border-slate-200 focus:border-blue-500 h-24"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button 
                              type="submit" 
                              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-5 rounded-lg shadow-sm transition-all" 
                              disabled={loading || cart.length === 0}
                              size="lg"
                            >
                              {loading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                  Procesando...
                                </>
                              ) : cart.length === 0 ? (
                                "Agrega productos a la orden"
                              ) : (
                                <>
                                  <Receipt className="h-5 w-5 mr-2" />
                                  Crear Orden
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}