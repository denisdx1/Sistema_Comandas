"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Receipt,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  Ban,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  User,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  DollarSign,
  ShoppingCart,
  Calendar as CalendarIcon,
  MoreHorizontal,
  ChevronDown,
  Info,
  Package,
} from "lucide-react";

// Definir interfaces
interface Producto {
  id: number;
  nombre: string;
  precio?: number;
  cantidad?: number;
}

interface DetalleOrden {
  id: number;
  productoId: number;
  ordenId: number;
  cantidad: number;
  precioUnitario?: number;
  subtotal?: number;
  producto: {
    id: number;
    nombre: string;
    precio?: number;
  };
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

interface Orden {
  id: number;
  mesa: string;
  estado: string;
  total: number;
  fechaCreacion: string;
  createdAt?: string; // Campo alternativo para la fecha de creación
  fechaCobro?: string;
  usuarioId?: number;
  mozoId?: number; // ID del mozo que creó la orden
  metodoPago?: string;
  usuario?: Usuario;
  mozo?: Usuario; // El usuario mozo que creó la orden
  detalles?: DetalleOrden[];
  items?: DetalleOrden[]; // Backend puede usar "items" en lugar de "detalles"
  movimientosCaja?: any[];
}

// Constantes
const ITEMS_PER_PAGE = 10;

// Función de utilidad para formatear fechas
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: es });
  } catch (error) {
    return "Fecha inválida";
  }
};

// Función para formatear el precio unitario
const formatPrecioUnitario = (detalle: any): string => {
  if (!detalle) return '0.00';
  try {
    console.log(`[Debug precioUnitario] Detalle ID: ${detalle.id}`, detalle);
    
    // Intentar obtener el precio unitario directamente
    if (detalle.precioUnitario !== undefined && detalle.precioUnitario !== null) {
      const num = parseFloat(String(detalle.precioUnitario));
      if (!isNaN(num)) {
        console.log(`[Debug precioUnitario] Usando precio unitario directo: ${num}`);
        return num.toFixed(2);
      }
    }
    
    // Si no existe directamente, intentar obtenerlo del producto relacionado
    if (detalle.producto) {
      console.log(`[Debug precioUnitario] Intentando obtener de producto:`, detalle.producto);
      const precio = detalle.producto.precio;
      if (precio !== undefined) {
        const num = parseFloat(String(precio));
        if (!isNaN(num)) {
          console.log(`[Debug precioUnitario] Usando precio del producto: ${num}`);
          return num.toFixed(2);
        }
      }
    }
    
    // Intentar derivarlo del subtotal y la cantidad
    if (detalle.subtotal !== undefined && detalle.cantidad && parseFloat(detalle.cantidad) > 0) {
      const subtotal = parseFloat(String(detalle.subtotal));
      const cantidad = parseFloat(String(detalle.cantidad));
      if (!isNaN(subtotal) && !isNaN(cantidad) && cantidad > 0) {
        const calculado = subtotal / cantidad;
        console.log(`[Debug precioUnitario] Calculado desde subtotal: ${calculado}`);
        return calculado.toFixed(2);
      }
    }
    
    console.log(`[Debug precioUnitario] No se pudo determinar precio unitario, devolviendo 0.00`);
    return '0.00';
  } catch (e) {
    console.error("Error formateando precio unitario:", e);
    return '0.00';
  }
};

// Función para formatear el subtotal
const formatSubtotal = (detalle: any): string => {
  if (!detalle) return '0.00';
  try {
    console.log(`[Debug subtotal] Detalle ID: ${detalle.id}`, detalle);
    
    // Intentar obtener el subtotal directamente
    if (detalle.subtotal !== undefined && detalle.subtotal !== null) {
      const num = parseFloat(String(detalle.subtotal));
      if (!isNaN(num)) {
        console.log(`[Debug subtotal] Usando subtotal directo: ${num}`);
        return num.toFixed(2);
      }
    }
    
    // Si no está disponible, calcularlo como precio unitario * cantidad
    let precioUnitario = 0;
    
    // Intentar obtener precio unitario
    if (detalle.precioUnitario !== undefined && detalle.precioUnitario !== null) {
      precioUnitario = parseFloat(String(detalle.precioUnitario));
      console.log(`[Debug subtotal] Usando precio unitario desde detalle: ${precioUnitario}`);
    }
    // Si no está disponible, intentar del producto
    else if (detalle.producto) {
      console.log(`[Debug subtotal] Intentando obtener precio del producto:`, detalle.producto);
      const precio = detalle.producto.precio;
      if (precio !== undefined) {
        precioUnitario = parseFloat(String(precio));
        console.log(`[Debug subtotal] Usando precio del producto: ${precioUnitario}`);
      }
    }
    
    if (!isNaN(precioUnitario) && detalle.cantidad) {
      const cantidad = parseFloat(String(detalle.cantidad));
      if (!isNaN(cantidad)) {
        const calculado = precioUnitario * cantidad;
        console.log(`[Debug subtotal] Calculado como ${precioUnitario} * ${cantidad} = ${calculado}`);
        return calculado.toFixed(2);
      }
    }
    
    console.log(`[Debug subtotal] No se pudo calcular subtotal, devolviendo 0.00`);
    return '0.00';
  } catch (e) {
    console.error("Error formateando subtotal:", e);
    return '0.00';
  }
};

export default function HistorialOrdenesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todas");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null);
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string | null>(null);
  const [filtroFecha, setFiltroFecha] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenModalOpen, setOrdenModalOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Función debounce para búsqueda
  function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    
    return function(...args: Parameters<T>) {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  // Función para cargar las órdenes
  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        router.push("/login");
        return;
      }

      // Decodificar el token para obtener información del usuario
      let userData: any = null;
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        userData = JSON.parse(window.atob(base64));
        console.log("Token decodificado:", userData);
      } catch (e) {
        console.error("Error decodificando token:", e);
      }

      console.log("Intentando obtener órdenes del servidor...");
      
      // Crear una lista de URLs para intentar, por si la dirección IP no funciona
      const urls = [
        "http://192.168.0.102:3001/ordenes", 
        "http://localhost:3001/ordenes"
      ];
      
      let lastError;
      let success = false;
      
      // Intentar con cada URL hasta que una funcione
      for (const url of urls) {
        try {
          console.log(`Intentando conectar a: ${url}`);
          
          // Asegurarse de solicitar explícitamente que incluya órdenes entregadas
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` },
            params: { includeEntregado: 'true' }
          });

          console.log(`Respuesta completa de ${url}:`, res);
          console.log("Tipo de datos recibidos:", typeof res.data);
          
          if (Array.isArray(res.data) && res.data.length > 0) {
            // Ordenar por fecha de creación (más recientes primero)
            const ordenadas = res.data.sort((a: Orden, b: Orden) => 
              new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
            );
            
            // Log para depuración - verificar qué órdenes se están recibiendo
            console.log("Órdenes recibidas:", ordenadas);
            console.log("Total órdenes recibidas:", ordenadas.length);
            console.log("Estados únicos:", [...new Set(ordenadas.map(orden => orden.estado))]);
            
            setOrdenes(ordenadas);
            applyFilters(ordenadas);
            success = true;
            break; // Salir del bucle si una URL funcionó
          } else {
            console.warn(`No se recibieron órdenes de ${url} o la respuesta no es un array`);
            console.log("Datos recibidos:", res.data);
          }
        } catch (err: any) {
          console.error(`Error al intentar con URL ${url}:`, err);
          lastError = err; // Guardar el último error
        }
      }
      
      // Si ninguna URL funcionó o no se encontraron órdenes
      if (!success) {
        setOrdenes([]);
        setFilteredOrdenes([]);
        toast.warning("No se encontraron órdenes en el sistema");
        
        if (lastError) {
          // Mostrar detalles del último error
          if (lastError.response) {
            console.error("Datos de respuesta de error:", lastError.response.data);
            console.error("Estado HTTP:", lastError.response.status);
            toast.error(`Error del servidor: ${lastError.response.status} - ${lastError.response.data?.message || "Error desconocido"}`);
          } else if (lastError.request) {
            console.error("Error de solicitud:", lastError.request);
            toast.error("No se pudo conectar con el servidor. Verifica tu conexión.");
          } else {
            console.error("Error de configuración:", lastError.message);
            toast.error(`Error al cargar: ${lastError.message}`);
          }
        }
      }
    } catch (error: any) {
      // Este bloque solo se ejecutaría si hay un error fuera del bucle de URLs
      console.error("Error inesperado al cargar órdenes:", error);
      toast.error(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros a las órdenes
  const applyFilters = useCallback((data: Orden[] = ordenes) => {
    let filtered = [...data];
    
    // Log para depuración - antes de filtrar
    console.log("Antes de filtrar, total órdenes:", filtered.length);
    console.log("Tab activo:", activeTab);

    // Filtrar por estado de cobro (tab activo)
    if (activeTab === "todas") {
      // No filtrar por estado, mostrar todas
    } else if (activeTab === "cobradas") {
      filtered = filtered.filter(orden => 
        ["COBRADA", "ENTREGADO", "ENTREGADA", "ENTREGANDO"].includes(orden.estado)
      );
    } else if (activeTab === "pendientes") {
      filtered = filtered.filter(orden => 
        !["COBRADA", "CANCELADA", "ENTREGADO", "ENTREGADA", "ENTREGANDO"].includes(orden.estado)
      );
    } else if (activeTab === "canceladas") {
      filtered = filtered.filter(orden => orden.estado === "CANCELADA");
    }
    
    // Log para depuración - después de filtrar por tab
    console.log("Después de filtrar por tab:", filtered.length);
    console.log("Estados después de filtro:", [...new Set(filtered.map(orden => orden.estado))]);

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(orden => 
        orden.id.toString().includes(term) || 
        orden.mesa.toLowerCase().includes(term) ||
        (orden.usuario?.nombre && orden.usuario.nombre.toLowerCase().includes(term))
      );
    }
    
    // Filtrar por método de pago
    if (filtroMetodoPago) {
      filtered = filtered.filter(orden => orden.metodoPago === filtroMetodoPago);
    }

    // Filtrar por fecha
    if (filtroFecha) {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      
      if (filtroFecha === "hoy") {
        filtered = filtered.filter(orden => new Date(orden.fechaCreacion) >= startOfDay);
      } else if (filtroFecha === "semana") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(orden => new Date(orden.fechaCreacion) >= weekAgo);
      } else if (filtroFecha === "mes") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(orden => new Date(orden.fechaCreacion) >= monthAgo);
      }
    }
    
    // Log final para depuración
    console.log("Órdenes filtradas final:", filtered.length);

    setFilteredOrdenes(filtered);
    setCurrentPage(1); // Resetear a la primera página al filtrar
  }, [activeTab, filtroMetodoPago, filtroFecha, searchTerm, ordenes]);

  // Función para ver detalles de una orden
  const verDetallesOrden = (orden: Orden) => {
    // Añadir logs detallados para debugging
    console.log("=== ESTRUCTURA DETALLADA DE LA ORDEN ===");
    console.log("Orden ID:", orden.id);
    console.log("Orden completa:", orden);
    
    // Examinar los items/detalles
    const detalles = orden.items || orden.detalles || [];
    if (detalles.length > 0) {
      console.log("Primer detalle:", detalles[0]);
      console.log("Propiedades del primer detalle:", Object.keys(detalles[0]));
      
      if (detalles[0].producto) {
        console.log("Producto del primer detalle:", detalles[0].producto);
        console.log("Propiedades del producto:", Object.keys(detalles[0].producto));
      }
    }
    
    // Examinar movimientos de caja
    if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
      console.log("Movimientos de caja:", orden.movimientosCaja);
      console.log("Primer movimiento:", orden.movimientosCaja[0]);
    }
    
    setSelectedOrden(orden);
    setOrdenModalOpen(true);
  };

  // Función para iniciar el proceso de cancelación
  const iniciarCancelacion = (orden: Orden) => {
    setSelectedOrden(orden);
    setCancelReason("");
    setConfirmationChecked(false);
    setCancelModalOpen(true);
  };

  // Función para cancelar una orden
  const cancelarOrden = async () => {
    if (!selectedOrden || !cancelReason) return;
    
    setCancelLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Sesión expirada");
        router.push("/login");
        return;
      }

      await axios.post(
        `http://192.168.0.102:3001/ordenes/cancelar/${selectedOrden.id}`,
        { 
          motivo: cancelReason,
          revertirPago: selectedOrden.estado === "COBRADA"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success(`Orden #${selectedOrden.id} cancelada correctamente`);
      fetchOrdenes(); // Recargar órdenes
      setCancelModalOpen(false);
    } catch (error: any) {
      console.error("Error al cancelar orden:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Error al cancelar la orden");
      }
    } finally {
      setCancelLoading(false);
    }
  };

  // Obtener el color del badge según el estado de la orden
  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PREPARANDO":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LISTA":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "ENTREGADA":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COBRADA":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELADA":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Obtener el color del badge según el método de pago
  const getMetodoPagoBadgeColor = (metodo: string = "EFECTIVO") => {
    switch (metodo) {
      case "EFECTIVO":
        return "bg-green-50 text-green-600 border-green-100";
      case "TARJETA":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "TRANSFERENCIA":
        return "bg-purple-50 text-purple-600 border-purple-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  // Función para calcular y formatear el total de manera segura
  const formatTotal = (orden: Orden | null): string => {
    if (!orden) return '0.00';
    
    try {
      console.log(`[Debug total] Orden #${orden.id} - Calculando total`);
      
      // Si ya existe un total definido y es válido, usarlo
      if (orden.total !== undefined && orden.total !== null && !isNaN(parseFloat(String(orden.total)))) {
        console.log(`[Debug total] Usando total existente: ${orden.total}`);
        return parseFloat(String(orden.total)).toFixed(2);
      }
      
      // Buscar en movimientos de caja si existe
      if (orden.movimientosCaja && orden.movimientosCaja.length > 0) {
        // Buscar un movimiento tipo VENTA
        const ventaMovimiento = orden.movimientosCaja.find(m => m.tipo === "VENTA");
        if (ventaMovimiento && ventaMovimiento.monto) {
          console.log(`[Debug total] Usando monto de movimiento: ${ventaMovimiento.monto}`);
          return parseFloat(String(ventaMovimiento.monto)).toFixed(2);
        }
      }
      
      // Calcular desde los items si no hay total definido
      let itemsArray = orden.items || orden.detalles || [];
      if (itemsArray.length > 0) {
        const calculatedTotal = itemsArray.reduce((sum, item) => {
          const cantidad = parseFloat(String(item.cantidad)) || 0;
          // Intentar obtener el subtotal directamente
          if (item.subtotal !== undefined && !isNaN(parseFloat(String(item.subtotal)))) {
            return sum + parseFloat(String(item.subtotal));
          } 
          // Si no hay subtotal, calcularlo desde el precio unitario y cantidad
          else if (item.precioUnitario !== undefined) {
            const precioUnitario = parseFloat(String(item.precioUnitario)) || 0;
            return sum + (cantidad * precioUnitario);
          }
          // Si no hay precio unitario, intentar desde el producto
          else if (item.producto) {
            // Verificar si el producto tiene un campo precio
            const precio = item.producto.precio;
            if (precio !== undefined) {
              const precioUnitario = parseFloat(String(precio)) || 0;
              return sum + (cantidad * precioUnitario);
            }
          }
          return sum;
        }, 0);
        
        console.log(`[Debug total] Calculado desde items: ${calculatedTotal}`);
        return calculatedTotal.toFixed(2);
      }
      
      console.log(`[Debug total] No se pudo calcular total, devolviendo 0.00`);
      return '0.00';
    } catch (e) {
      console.error("Error calculando total:", e);
      return '0.00';
    }
  };

  // Datos paginados
  const paginatedOrdenes = filteredOrdenes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const totalPages = Math.ceil(filteredOrdenes.length / ITEMS_PER_PAGE);

  // Cargar órdenes al montar el componente
  useEffect(() => {
    fetchOrdenes();
  }, []);

  // Aplicar filtros cuando cambian los criterios
  useEffect(() => {
    const debouncedFilter = debounce(() => applyFilters(), 300);
    debouncedFilter();
  }, [activeTab, filtroMetodoPago, filtroFecha, searchTerm, applyFilters]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              Historial de Órdenes
            </h1>
            <p className="text-slate-600">
              Gestiona todas las órdenes cobradas, pendientes y canceladas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={fetchOrdenes}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="bg-white/95 shadow-md border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Receipt className="h-6 w-6 text-blue-600" />
            Registro de órdenes
          </CardTitle>
          <CardDescription>
            Visualiza y gestiona todas las órdenes del sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por ID, mesa o usuario..."
                  className="pl-10 border-slate-200 focus:border-blue-300 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-1 gap-3 items-center justify-end">
                <Select
                  value={filtroMetodoPago || ''}
                  onValueChange={(value) => setFiltroMetodoPago(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Método de pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filtroFecha || ''}
                  onValueChange={(value) => setFiltroFecha(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Fecha" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las fechas</SelectItem>
                    <SelectItem value="hoy">Hoy</SelectItem>
                    <SelectItem value="semana">Última semana</SelectItem>
                    <SelectItem value="mes">Último mes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="todas" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Info className="h-4 w-4 mr-2 text-blue-600" />
                  Todas
                </TabsTrigger>
                <TabsTrigger 
                  value="cobradas" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Cobradas/Entregadas
                </TabsTrigger>
                <TabsTrigger 
                  value="pendientes"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                  Pendientes
                </TabsTrigger>
                <TabsTrigger value="canceladas" className="data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
                  Canceladas
                </TabsTrigger>
              </TabsList>

              {/* Contenido de todas las pestañas */}
              <div className="mt-4">
                {/* Tabla de órdenes */}
                <div className="rounded-xl border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>Mesa</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Total</TableHead>
                          {activeTab === "cobradas" && <TableHead>Método de Pago</TableHead>}
                          <TableHead>Usuario</TableHead>
                          <TableHead>Fecha {activeTab === "cobradas" ? "Cobro" : "Creación"}</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                <span className="text-sm text-slate-500">Cargando órdenes...</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : paginatedOrdenes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Info className="h-8 w-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">No hay órdenes {activeTab}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrdenes.map((orden) => (
                            <TableRow key={orden.id} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="font-medium">#{orden.id}</TableCell>
                              <TableCell>{orden.mesa}</TableCell>
                              <TableCell>
                                <Badge className={getEstadoBadgeColor(orden.estado)}>
                                  {orden.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                ${formatTotal(orden)}
                              </TableCell>
                              {activeTab === "cobradas" && (
                                <TableCell>
                                  <Badge className={getMetodoPagoBadgeColor(orden.metodoPago)}>
                                    {orden.metodoPago}
                                  </Badge>
                                </TableCell>
                              )}
                              <TableCell>
                                {orden.usuario?.nombre || orden.mozo?.nombre || "N/A"}
                              </TableCell>
                              <TableCell className="text-xs">
                                {formatDate(activeTab === "cobradas" ? (orden.fechaCobro || orden.fechaCreacion) : orden.fechaCreacion)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => verDetallesOrden(orden)}
                                  >
                                    <Info className="h-4 w-4" />
                                  </Button>
                                  
                                  {orden.estado !== "CANCELADA" && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50"
                                      onClick={() => iniciarCancelacion(orden)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-slate-500">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrdenes.length)} de{" "}
                      {filteredOrdenes.length} órdenes
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="icon"
                          className="h-8 w-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        </CardContent>
        
        <CardFooter className="bg-slate-50 border-t flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-center p-4">
          <div className="text-sm text-slate-600">
            <CalendarIcon className="h-4 w-4 inline mr-1 text-slate-400" />
            Última actualización: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSearchTerm("");
                setFiltroMetodoPago(null);
                setFiltroFecha(null);
                setCurrentPage(1);
                applyFilters();
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Modal de detalles de orden */}
      <Dialog open={ordenModalOpen} onOpenChange={setOrdenModalOpen}>
        <DialogContent className="max-w-3xl" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5 text-blue-600" />
              Detalles de la Orden #{selectedOrden?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedOrden?.fechaCreacion && (
                <span>Fecha: {formatDate(selectedOrden.fechaCreacion)}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrden && (
            <div className="space-y-4">
              {/* Información general de la orden */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Estado:</span>
                    <Badge className={getEstadoBadgeColor(selectedOrden.estado)}>
                      {selectedOrden.estado}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Mesa:</span>
                    <span>{selectedOrden.mesa}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Usuario:</span>
                    <span>{selectedOrden.usuario?.nombre || selectedOrden.mozo?.nombre || "N/A"}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-500">Total:</span>
                    <span className="font-mono font-semibold">${formatTotal(selectedOrden)}</span>
                  </div>
                  {selectedOrden.metodoPago && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Método de pago:</span>
                      <Badge className={getMetodoPagoBadgeColor(selectedOrden.metodoPago)}>
                        {selectedOrden.metodoPago}
                      </Badge>
                    </div>
                  )}
                  {selectedOrden.fechaCobro && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-500">Fecha de cobro:</span>
                      <span className="text-sm">{formatDate(selectedOrden.fechaCobro)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Productos</span>
                </div>
              </div>
              
              {/* Detalles de productos */}
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-4">
                  {/* Usar el array de items o detalles, según corresponda */}
                  {(() => {
                    const detalles = selectedOrden.items || selectedOrden.detalles || [];
                    return detalles.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detalles.map((detalle) => (
                            <TableRow key={detalle.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-slate-400" />
                                  {detalle.producto?.nombre || `Producto #${detalle.productoId}`}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{detalle.cantidad}</TableCell>
                              <TableCell className="text-right font-mono">
                                ${formatPrecioUnitario(detalle)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium">
                                ${formatSubtotal(detalle)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-4 text-slate-500">
                        No hay detalles disponibles
                      </div>
                    );
                  })()}
                </div>
              </ScrollArea>
              
              <div className="flex items-center justify-between pt-2">
                <span className="font-medium">Total</span>
                <span className="font-mono font-bold text-lg">${formatTotal(selectedOrden)}</span>
              </div>
              
              {selectedOrden.estado !== "CANCELADA" && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    onClick={() => {
                      setOrdenModalOpen(false);
                      setTimeout(() => iniciarCancelacion(selectedOrden), 100);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Cancelar orden
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOrdenModalOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de cancelación */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => {
          if (cancelLoading) e.preventDefault();
        }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Orden #{selectedOrden?.id}
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {selectedOrden?.estado === "COBRADA" && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                <h3 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Orden ya cobrada
                </h3>
                <p className="text-sm mt-1">
                  Esta orden ya ha sido cobrada. Al cancelarla:
                </p>
                <ul className="text-sm mt-2 list-disc list-inside space-y-1">
                  <li>Se devolverá el dinero al cliente</li>
                  <li>Se restaurarán los productos al inventario</li>
                  <li>Se registrará como cancelada en el historial</li>
                </ul>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="cancelReason" className="text-slate-700 font-medium">
                Motivo de cancelación
              </Label>
              <Input
                id="cancelReason"
                placeholder="Ingrese el motivo de la cancelación"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="border-slate-200"
              />
            </div>
            
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="confirmCancel"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
              />
              <label
                htmlFor="confirmCancel"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que deseo cancelar esta orden y entiendo las implicaciones
              </label>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              disabled={cancelLoading}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={cancelarOrden}
              disabled={!cancelReason || !confirmationChecked || cancelLoading}
              className="flex items-center gap-2"
            >
              {cancelLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4" />
                  Cancelar Orden
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 