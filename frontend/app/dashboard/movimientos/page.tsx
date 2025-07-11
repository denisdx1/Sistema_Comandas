"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Loader2,
  Package,
  Search,
  ShoppingCart,
  Settings,
  Filter,
  RefreshCw,
  CreditCard,
  ArrowRightLeft,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  TimerReset,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Componente de paginación
interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({ totalPages, currentPage, onPageChange }: PaginationProps) => {
  // No mostrar si solo hay una página
  if (totalPages <= 1) return null;

  // Crear un array de números de página para mostrar
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    // Si hay menos de 5 páginas, mostrar todas
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Siempre incluir la primera página
    pageNumbers.push(1);

    // Calcular el rango central
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Ajustar el rango para mostrar 3 páginas en el medio
    if (startPage === 2) endPage = Math.min(totalPages - 1, startPage + 2);
    if (endPage === totalPages - 1) startPage = Math.max(2, endPage - 2);

    // Agregar elipsis después de la página 1 si es necesario
    if (startPage > 2) pageNumbers.push(-1); // -1 representa elipsis

    // Agregar páginas centrales
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Agregar elipsis antes de la última página si es necesario
    if (endPage < totalPages - 1) pageNumbers.push(-2); // -2 representa elipsis

    // Siempre incluir la última página
    pageNumbers.push(totalPages);

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* Botón para ir a la primera página */}
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 p-0"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>

      {/* Botón para página anterior */}
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 p-0"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Números de página */}
      {pageNumbers.map((page, index) => {
        if (page === -1 || page === -2) {
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              size="icon"
              className="w-8 h-8 p-0"
              disabled
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          );
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            className="w-8 h-8 p-0"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        );
      })}

      {/* Botón para página siguiente */}
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 p-0"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Botón para ir a la última página */}
      <Button
        variant="outline"
        size="icon"
        className="w-8 h-8 p-0"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface MovimientoInventario {
  id: number;
  tipo: string;
  cantidad: number;
  motivo: string;
  fechaHora: string;
  stockAnterior: number;
  stockNuevo: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    categoriaId: number;
  };
  usuario: {
    id: number;
    nombre: string;
  };
}

interface MovimientoCaja {
  id: number;
  tipo: string;
  monto: number;
  concepto: string;
  metodoPago?: string;
  fechaHora: string;
  usuario: {
    id: number;
    nombre: string;
  };
  orden?: {
    id: number;
    estado: string;
  };
  cajaId: number;
}

// Interface para productos en el formulario
interface Producto {
  id: number;
  nombre: string;
  stock: number;
  precio?: number;
  categoriaId?: number;
}

// Constante para definir el número de elementos por página
const ITEMS_PER_PAGE = 10;

export default function MovimientosPage() {
  const router = useRouter();
  const [movimientosInventario, setMovimientosInventario] = useState<MovimientoInventario[]>([]);
  const [movimientosCaja, setMovimientosCaja] = useState<MovimientoCaja[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroTipoInventario, setFiltroTipoInventario] = useState<string | null>(null);
  const [filtroTipoCaja, setFiltroTipoCaja] = useState<string | null>(null);
  const [filtroMetodoPago, setFiltroMetodoPago] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("inventario");
  
  // Nuevos estados para la paginación
  const [currentPageInventario, setCurrentPageInventario] = useState(1);
  const [currentPageCaja, setCurrentPageCaja] = useState(1);

  // Estados para el modal y formulario
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [showProductResults, setShowProductResults] = useState(false);

  // Form para nuevo movimiento
  const form = useForm({
    defaultValues: {
      tipo: "",
      productoId: "",
      cantidad: "",
      motivo: "",
    },
  });

  useEffect(() => {
    fetchMovimientos();
  }, []);

  // Función para cargar productos cuando se abre el modal
  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        router.push("/login");
        return;
      }

      const res = await axios.get("http://192.168.0.102:3001/productos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProductos(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      toast.error("Error al cargar la lista de productos");
    }
  };

  // Función para manejar el click fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#productSearch') && !target.closest('.product-dropdown')) {
        setShowProductResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Función para manejar el cambio de producto
  const handleProductoChange = (productoId: string) => {
    const producto = productos.find(p => p.id.toString() === productoId);
    setSelectedProduct(producto || null);
    form.setValue("productoId", productoId);
  };

  // Función para abrir el modal y resetear el formulario
  const handleOpenModal = () => {
    // Resetear formulario
    form.reset({
      tipo: "",
      productoId: "",
      cantidad: "",
      motivo: "",
    });
    setSelectedProduct(null);
    
    // Cargar productos
    fetchProductos();
    
    // Abrir modal
    setModalOpen(true);
  };
  
  // Función para registrar un nuevo movimiento
  const handleSubmitMovimiento = async (data: any) => {
    setFormLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Sesión expirada");
        router.push("/login");
        return;
      }

      // Validar datos
      const cantidad = parseInt(data.cantidad);
      if (isNaN(cantidad) || cantidad <= 0) {
        toast.error("La cantidad debe ser un número mayor a 0");
        setFormLoading(false);
        return;
      }

      // Para las salidas y ventas, verificamos que haya suficiente stock
      if ((data.tipo === "SALIDA" || data.tipo === "VENTA") && selectedProduct && cantidad > selectedProduct.stock) {
        toast.error(`Stock insuficiente. Disponible: ${selectedProduct.stock}`);
        setFormLoading(false);
        return;
      }

      // Asegurarse de que productoId sea un número
      if (!data.productoId) {
        toast.error("Debe seleccionar un producto");
        setFormLoading(false);
        return;
      }

      const movimientoData = {
        tipo: data.tipo,
        productoId: parseInt(data.productoId),
        cantidad: cantidad,
        motivo: data.motivo || "",
      };

      console.log("Enviando datos:", movimientoData);

      await axios.post(
        "http://192.168.0.102:3001/movimientos-inventario",
        movimientoData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Movimiento registrado correctamente");
      setModalOpen(false);
      
      // Recargar datos de movimientos
      fetchMovimientos();
    } catch (error: any) {
      console.error("Error al registrar movimiento:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(`Error: ${error.response.data.message}`);
      } else {
        toast.error("Error al registrar el movimiento");
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Funciones auxiliares para estilizar según el tipo de movimiento
  function getTipoMovimientoStyles(tipo: string) {
    switch (tipo) {
      case "ENTRADA":
        return "bg-green-50 border border-green-200 text-green-800";
      case "SALIDA":
        return "bg-orange-50 border border-orange-200 text-orange-800";
      case "VENTA":
        return "bg-purple-50 border border-purple-200 text-purple-800";
      case "AJUSTE":
        return "bg-blue-50 border border-blue-200 text-blue-800";
      default:
        return "bg-slate-50 border border-slate-200 text-slate-800";
    }
  }

  function getTipoMovimientoIcon(tipo: string) {
    switch (tipo) {
      case "ENTRADA":
        return <ArrowDownCircle className="h-5 w-5 text-green-600" />;
      case "SALIDA":
        return <ArrowUpCircle className="h-5 w-5 text-orange-600" />;
      case "VENTA":
        return <DollarSign className="h-5 w-5 text-purple-600" />;
      case "AJUSTE":
        return <TimerReset className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  }

  function getTipoMovimientoText(tipo: string) {
    switch (tipo) {
      case "ENTRADA":
        return "Entrada de Inventario";
      case "SALIDA":
        return "Salida de Inventario";
      case "VENTA":
        return "Venta de Productos";
      case "AJUSTE":
        return "Ajuste de Inventario";
      default:
        return "Movimiento de Inventario";
    }
  }

  function getTipoMovimientoDescription(tipo: string) {
    switch (tipo) {
      case "ENTRADA":
        return "Se incrementará el stock del producto con la cantidad especificada.";
      case "SALIDA":
        return "Se reducirá el stock del producto según la cantidad indicada.";
      case "VENTA":
        return "Se reducirá el stock del producto por venta al cliente.";
      case "AJUSTE":
        return "Se establecerá el stock del producto al valor exacto que indique.";
      default:
        return "Este movimiento modificará el inventario actual.";
    }
  }

  const fetchMovimientos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        router.push("/login");
        return;
      }

      // Obtener movimientos de inventario
      const resInventario = await axios.get("http://192.168.0.102:3001/movimientos-inventario", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Obtener cajas para poder mostrar todos los movimientos de caja
      const resCajas = await axios.get("http://192.168.0.102:3001/cajas", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Extraer todos los movimientos de todas las cajas
      const todosMovimientosCaja = resCajas.data.flatMap((caja: any) => 
        caja.movimientos ? caja.movimientos.map((mov: any) => ({...mov, cajaId: caja.id})) : []
      );

      setMovimientosInventario(resInventario.data);
      setMovimientosCaja(todosMovimientosCaja);

    } catch (error) {
      console.error("Error al cargar los movimientos:", error);
      toast.error("Error al cargar los datos de movimientos");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar los movimientos basados en los criterios actuales
  const filteredMovimientosInventario = movimientosInventario
    .filter(mov => 
      (filtroTipoInventario ? mov.tipo === filtroTipoInventario : true) &&
      (searchTerm ? 
        mov.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      )
    )
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  const filteredMovimientosCaja = movimientosCaja
    .filter(mov => 
      (filtroTipoCaja ? mov.tipo === filtroTipoCaja : true) &&
      (filtroMetodoPago ? mov.metodoPago === filtroMetodoPago : true) &&
      (searchTerm ? 
        mov.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        : true
      )
    )
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  // Calcular el número total de páginas para cada tipo de movimiento
  const totalPagesInventario = Math.ceil(filteredMovimientosInventario.length / ITEMS_PER_PAGE);
  const totalPagesCaja = Math.ceil(filteredMovimientosCaja.length / ITEMS_PER_PAGE);

  // Obtener elementos paginados para cada tabla
  const paginatedMovimientosInventario = filteredMovimientosInventario.slice(
    (currentPageInventario - 1) * ITEMS_PER_PAGE,
    currentPageInventario * ITEMS_PER_PAGE
  );

  const paginatedMovimientosCaja = filteredMovimientosCaja.slice(
    (currentPageCaja - 1) * ITEMS_PER_PAGE,
    currentPageCaja * ITEMS_PER_PAGE
  );

  // Función para cambiar de página
  const handlePageChangeInventario = (page: number) => {
    setCurrentPageInventario(page);
  };

  const handlePageChangeCaja = (page: number) => {
    setCurrentPageCaja(page);
  };

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPageInventario(1);
  }, [searchTerm, filtroTipoInventario]);

  useEffect(() => {
    setCurrentPageCaja(1);
  }, [searchTerm, filtroTipoCaja, filtroMetodoPago]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const getMovimientoInventarioColor = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
        return "bg-green-100 text-green-800 border-green-200";
      case "SALIDA":
        return "bg-red-100 text-red-800 border-red-200";
      case "AJUSTE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "VENTA":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMovimientoCajaColor = (tipo: string) => {
    switch (tipo) {
      case "INGRESO":
        return "bg-green-100 text-green-800 border-green-200";
      case "EGRESO":
        return "bg-red-100 text-red-800 border-red-200";
      case "VENTA":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "DEVOLUCION":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case "ENTRADA":
      case "INGRESO":
        return <ArrowUpCircle className="h-4 w-4" />;
      case "SALIDA":
      case "EGRESO":
        return <ArrowDownCircle className="h-4 w-4" />;
      case "AJUSTE":
        return <Settings className="h-4 w-4" />;
      case "VENTA":
        return <DollarSign className="h-4 w-4" />;
      case "DEVOLUCION":
        return <RefreshCw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getMetodoPagoColor = (metodoPago: string = 'EFECTIVO') => {
    switch (metodoPago) {
      case "EFECTIVO":
        return "bg-green-50 text-green-600 border-green-100";
      case "TARJETA":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "TRANSFERENCIA":
        return "bg-purple-50 text-purple-600 border-purple-100";
      case "OTRO":
        return "bg-gray-50 text-gray-600 border-gray-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getMetodoPagoIcon = (metodoPago: string = 'EFECTIVO') => {
    switch (metodoPago) {
      case "EFECTIVO":
        return <DollarSign className="h-3 w-3" />;
      case "TARJETA":
        return <CreditCard className="h-3 w-3" />;
      case "TRANSFERENCIA":
        return <ArrowRightLeft className="h-3 w-3" />;
      case "OTRO":
        return <HelpCircle className="h-3 w-3" />;
      default:
        return <DollarSign className="h-3 w-3" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              Movimientos
            </h1>
            <p className="text-slate-600">
              Consulta y analiza los movimientos de inventario y caja
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={fetchMovimientos}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
            <Button
              variant="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleOpenModal}
            >
              <Plus className="h-4 w-4" />
              Nuevo Movimiento
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main Content Card */}
      <Card className="bg-white/95 shadow-md border-slate-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Filter className="h-5 w-5 text-blue-600" />
            Registros de movimientos
          </CardTitle>
          <CardDescription>
            Visualiza y filtra todos los movimientos del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and filter bar */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar movimientos..."
                  className="pl-10 border-slate-200 focus:border-blue-300 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="default"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                onClick={fetchMovimientos}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>

            {/* Tabs for inventory/cash movements */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="inventario" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Movimientos de Inventario
                </TabsTrigger>
                <TabsTrigger 
                  value="caja"
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Movimientos de Caja
                </TabsTrigger>
              </TabsList>

              {/* Contenido de la pestaña de Movimientos de Inventario */}
              <TabsContent value="inventario" className="mt-4">
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-slate-700">Filtrar por tipo:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      className={`cursor-pointer transition-all ${filtroTipoInventario === null 
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      onClick={() => setFiltroTipoInventario(null)}
                    >
                      Todos
                    </Badge>
                    <Badge 
                      className={`cursor-pointer transition-all ${filtroTipoInventario === "ENTRADA" 
                        ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      onClick={() => setFiltroTipoInventario("ENTRADA")}
                    >
                      <ArrowUpCircle className="h-3 w-3 mr-1" /> Entradas
                    </Badge>
                    <Badge 
                      className={`cursor-pointer transition-all ${filtroTipoInventario === "SALIDA" 
                        ? "bg-red-100 text-red-800 hover:bg-red-200 shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      onClick={() => setFiltroTipoInventario("SALIDA")}
                    >
                      <ArrowDownCircle className="h-3 w-3 mr-1" /> Salidas
                    </Badge>
                    <Badge 
                      className={`cursor-pointer transition-all ${filtroTipoInventario === "VENTA" 
                        ? "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      onClick={() => setFiltroTipoInventario("VENTA")}
                    >
                      <DollarSign className="h-3 w-3 mr-1" /> Ventas
                    </Badge>
                    <Badge 
                      className={`cursor-pointer transition-all ${filtroTipoInventario === "AJUSTE" 
                        ? "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 shadow-sm" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                      onClick={() => setFiltroTipoInventario("AJUSTE")}
                    >
                      <Settings className="h-3 w-3 mr-1" /> Ajustes
                    </Badge>
                  </div>

                  {filtroTipoInventario && (
                    <div className="mt-3 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => setFiltroTipoInventario(null)}
                      >
                        Limpiar filtro
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Stock Anterior</TableHead>
                          <TableHead>Stock Nuevo</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMovimientosInventario.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                              {loading ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                                  <span>Cargando movimientos...</span>
                                </div>
                              ) : searchTerm || filtroTipoInventario ? (
                                <div className="flex flex-col items-center">
                                  <Filter className="h-6 w-6 text-slate-400 mb-2" />
                                  <span>No hay movimientos que coincidan con los filtros</span>
                                  <Button
                                    variant="link"
                                    className="mt-1 text-blue-600"
                                    onClick={() => {
                                      setSearchTerm("");
                                      setFiltroTipoInventario(null);
                                    }}
                                  >
                                    Limpiar filtros
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Package className="h-6 w-6 text-slate-400 mb-2" />
                                  <span>No hay movimientos de inventario registrados</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedMovimientosInventario.map((mov) => (
                            <TableRow key={mov.id} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="font-medium">{mov.id}</TableCell>
                              <TableCell>
                                <Badge className={getMovimientoInventarioColor(mov.tipo)}>
                                  <div className="flex items-center gap-1">
                                    {getMovimientoIcon(mov.tipo)}
                                    {mov.tipo}
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell>{mov.producto.nombre}</TableCell>
                              <TableCell>{mov.cantidad}</TableCell>
                              <TableCell>{mov.stockAnterior}</TableCell>
                              <TableCell>{mov.stockNuevo}</TableCell>
                              <TableCell className="max-w-xs truncate" title={mov.motivo}>{mov.motivo}</TableCell>
                              <TableCell>{mov.usuario.nombre}</TableCell>
                              <TableCell className="text-xs">
                                {formatDate(mov.fechaHora)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-4 flex justify-center">
                  <Pagination
                    totalPages={totalPagesInventario}
                    currentPage={currentPageInventario}
                    onPageChange={handlePageChangeInventario}
                  />

                  {totalPagesInventario > 0 && (
                    <div className="ml-4 text-xs text-slate-500 flex items-center">
                      Mostrando {(currentPageInventario - 1) * ITEMS_PER_PAGE + 1}
                      -
                      {Math.min(currentPageInventario * ITEMS_PER_PAGE, filteredMovimientosInventario.length)}
                      {" "}de{" "}
                      {filteredMovimientosInventario.length} registros
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Contenido de la pestaña de Movimientos de Caja */}
              <TabsContent value="caja" className="mt-4">
                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Filtros por tipo */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-slate-700">Filtrar por tipo:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={`cursor-pointer transition-all ${
                            filtroTipoCaja === null
                              ? "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          onClick={() => setFiltroTipoCaja(null)}
                        >
                          Todos
                        </Badge>
                        <Badge
                          className={`cursor-pointer transition-all ${
                            filtroTipoCaja === "INGRESO"
                              ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          onClick={() => setFiltroTipoCaja("INGRESO")}
                        >
                          <ArrowUpCircle className="h-3 w-3 mr-1" /> Ingreso
                        </Badge>
                        <Badge
                          className={`cursor-pointer transition-all ${
                            filtroTipoCaja === "EGRESO"
                              ? "bg-red-100 text-red-800 hover:bg-red-200 shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          onClick={() => setFiltroTipoCaja("EGRESO")}
                        >
                          <ArrowDownCircle className="h-3 w-3 mr-1" /> Egreso
                        </Badge>
                        <Badge
                          className={`cursor-pointer transition-all ${
                            filtroTipoCaja === "VENTA"
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          onClick={() => setFiltroTipoCaja("VENTA")}
                        >
                          <DollarSign className="h-3 w-3 mr-1" /> Venta
                        </Badge>
                        <Badge
                          className={`cursor-pointer transition-all ${
                            filtroTipoCaja === "DEVOLUCION"
                              ? "bg-purple-100 text-purple-800 hover:bg-purple-200 shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                          onClick={() => setFiltroTipoCaja("DEVOLUCION")}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Devolución
                        </Badge>
                      </div>
                    </div>

                    {/* Filtrar por método de pago */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-slate-700">Método de pago:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          className={`cursor-pointer transition-all ${filtroMetodoPago === null 
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          onClick={() => setFiltroMetodoPago(null)}
                        >
                          Todos
                        </Badge>
                        <Badge 
                          className={`cursor-pointer transition-all ${filtroMetodoPago === "EFECTIVO" 
                            ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          onClick={() => setFiltroMetodoPago("EFECTIVO")}
                        >
                          <DollarSign className="h-3 w-3 mr-1" /> Efectivo
                        </Badge>
                        <Badge 
                          className={`cursor-pointer transition-all ${filtroMetodoPago === "TARJETA" 
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200 shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          onClick={() => setFiltroMetodoPago("TARJETA")}
                        >
                          <CreditCard className="h-3 w-3 mr-1" /> Tarjeta
                        </Badge>
                        <Badge 
                          className={`cursor-pointer transition-all ${filtroMetodoPago === "TRANSFERENCIA" 
                            ? "bg-purple-100 text-purple-800 hover:bg-purple-200 shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          onClick={() => setFiltroMetodoPago("TRANSFERENCIA")}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" /> Transferencia
                        </Badge>
                        <Badge 
                          className={`cursor-pointer transition-all ${filtroMetodoPago === "OTRO" 
                            ? "bg-slate-300 text-slate-800 hover:bg-slate-400 shadow-sm" 
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                          onClick={() => setFiltroMetodoPago("OTRO")}
                        >
                          <HelpCircle className="h-3 w-3 mr-1" /> Otro
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {(filtroTipoCaja || filtroMetodoPago) && (
                    <div className="mt-3 flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => {
                          setFiltroTipoCaja(null);
                          setFiltroMetodoPago(null);
                        }}
                      >
                        Limpiar todos los filtros
                      </Button>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[100px]">ID</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Método de Pago</TableHead>
                          <TableHead>Caja ID</TableHead>
                          <TableHead>Orden ID</TableHead>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMovimientosCaja.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-10 text-slate-500">
                              {loading ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
                                  <span>Cargando movimientos de caja...</span>
                                </div>
                              ) : searchTerm || filtroTipoCaja || filtroMetodoPago ? (
                                <div className="flex flex-col items-center">
                                  <Filter className="h-6 w-6 text-slate-400 mb-2" />
                                  <span>No hay movimientos que coincidan con los filtros</span>
                                  <Button
                                    variant="link"
                                    className="mt-1 text-blue-600"
                                    onClick={() => {
                                      setSearchTerm("");
                                      setFiltroTipoCaja(null);
                                      setFiltroMetodoPago(null);
                                    }}
                                  >
                                    Limpiar filtros
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <DollarSign className="h-6 w-6 text-slate-400 mb-2" />
                                  <span>No hay movimientos de caja registrados</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedMovimientosCaja.map((mov) => (
                            <TableRow key={mov.id} className="hover:bg-slate-50 transition-colors">
                              <TableCell className="font-medium">{mov.id}</TableCell>
                              <TableCell>
                                <Badge className={getMovimientoCajaColor(mov.tipo)}>
                                  <div className="flex items-center gap-1">
                                    {getMovimientoIcon(mov.tipo)}
                                    {mov.tipo}
                                  </div>
                                </Badge>
                              </TableCell>
                              <TableCell className="font-mono font-medium">
                                <span className={mov.tipo === 'INGRESO' || mov.tipo === 'VENTA' ? 'text-green-600' : 'text-red-600'}>
                                  ${Number(mov.monto).toFixed(2)}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate" title={mov.concepto}>
                                {mov.concepto}
                              </TableCell>
                              <TableCell>
                                {mov.metodoPago && (
                                  <Badge className={getMetodoPagoColor(mov.metodoPago)}>
                                    <div className="flex items-center gap-1">
                                      {getMetodoPagoIcon(mov.metodoPago)}
                                      {mov.metodoPago}
                                    </div>
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-slate-50">
                                  {mov.cajaId}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {mov.orden ? (
                                  <Button 
                                    variant="link" 
                                    size="sm"
                                    className="p-1 h-auto text-blue-600 hover:text-blue-800 hover:underline"
                                    onClick={() => router.push(`/dashboard/ordenes/gestionar?orden=${mov.orden?.id}`)}
                                  >
                                    #{mov.orden.id}
                                  </Button>
                                ) : "-"}
                              </TableCell>
                              <TableCell>{mov.usuario?.nombre || "Usuario desconocido"}</TableCell>
                              <TableCell className="text-xs">
                                {formatDate(mov.fechaHora)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {totalPagesCaja > 0 && (
                      <span>
                        Mostrando {(currentPageCaja - 1) * ITEMS_PER_PAGE + 1}
                        -
                        {Math.min(currentPageCaja * ITEMS_PER_PAGE, filteredMovimientosCaja.length)}
                        {" "}de{" "}
                        {filteredMovimientosCaja.length} registros
                      </span>
                    )}
                  </div>
                  <div>
                    <Pagination
                      totalPages={totalPagesCaja}
                      currentPage={currentPageCaja}
                      onPageChange={handlePageChangeCaja}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-center p-4">
          <div className="text-sm text-slate-600">
            <Calendar className="h-4 w-4 inline mr-1 text-slate-400" />
            Última actualización: {new Date().toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                setSearchTerm("");
                setFiltroTipoInventario(null);
                setFiltroTipoCaja(null);
                setFiltroMetodoPago(null);
                setCurrentPageInventario(1);
                setCurrentPageCaja(1);
              }}
            >
              Limpiar todos los filtros
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              onClick={fetchMovimientos}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Actualizar datos
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Información de ayuda */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <Filter className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">Consejo</h3>
            <p>Puedes usar múltiples filtros al mismo tiempo para encontrar exactamente lo que buscas. La tabla actualizará automáticamente los resultados.</p>
          </div>
        </div>
      </div>

      {/* Modal para nuevo movimiento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" 
          onInteractOutside={(e) => {
            // Evitar cerrar el modal al hacer clic fuera si se está enviando el formulario
            if (formLoading) e.preventDefault();
          }}>
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Nuevo Movimiento
            </DialogTitle>
            <DialogDescription className="text-sm">
              Complete el formulario para registrar un nuevo movimiento
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {/* Tipo de movimiento */}
            <div className="space-y-2">
              <Label htmlFor="tipo" className="text-slate-700 text-sm font-medium">
                Tipo de Movimiento
              </Label>
              <Select
                onValueChange={(value: string) => form.setValue("tipo", value)}
                value={form.watch("tipo")}
              >
                <SelectTrigger className="w-full border-slate-200 h-9">
                  <SelectValue placeholder="Seleccione el tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 rounded-md shadow-md">
                  <SelectItem value="ENTRADA" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="h-4 w-4 text-green-600" />
                      <span>Entrada</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="SALIDA" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="h-4 w-4 text-orange-600" />
                      <span>Salida</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VENTA" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-purple-600" />
                      <span>Venta</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="AJUSTE" className="flex items-center">
                    <div className="flex items-center gap-2">
                      <TimerReset className="h-4 w-4 text-blue-600" />
                      <span>Ajuste</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!form.watch("tipo") && (
                <p className="text-xs text-red-500">Seleccione un tipo de movimiento</p>
              )}
            </div>
            
            {/* Producto */}
            <div className="space-y-2">
              <Label htmlFor="productoId" className="text-slate-700 text-sm font-medium">
                Producto
              </Label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    id="productSearch"
                    placeholder="Buscar producto..."
                    value={productSearchTerm}
                    onChange={(e) => {
                      setProductSearchTerm(e.target.value);
                      setShowProductResults(true);
                    }}
                    className="border-slate-200 pl-10 h-9"
                    onFocus={() => setShowProductResults(true)}
                  />
                </div>
                
                {showProductResults && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto product-dropdown">
                    {productos.length > 0 ? (
                      <>
                        <div className="p-2 border-b border-slate-100">
                          <p className="text-xs text-slate-500">
                            {productSearchTerm ? "Resultados de búsqueda" : "Seleccione un producto"}
                          </p>
                        </div>
                        <ul className="py-1">
                          {productos
                            .filter(producto => 
                              producto.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())
                            )
                            .map((producto) => (
                              <li 
                                key={producto.id} 
                                onClick={() => {
                                  setSelectedProduct(producto);
                                  form.setValue("productoId", producto.id.toString());
                                  setShowProductResults(false);
                                  setProductSearchTerm(""); // Limpiar búsqueda después de seleccionar
                                }}
                                className={`px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-between ${
                                  selectedProduct?.id === producto.id ? "bg-blue-50" : ""
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-slate-500" />
                                  <span className="font-medium text-slate-700">{producto.nombre}</span>
                                </span>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                  Stock: {producto.stock}
                                </span>
                              </li>
                            ))
                          }
                          
                          {productos.filter(producto => 
                            producto.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())
                          ).length === 0 && (
                            <li className="px-3 py-4 text-center text-slate-500">
                              No se encontraron productos
                            </li>
                          )}
                        </ul>
                      </>
                    ) : (
                      <div className="p-4 text-center text-slate-500">
                        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                        Cargando productos...
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedProduct ? (
                <div 
                  className="mt-1 bg-blue-50 text-blue-800 p-2 rounded-md flex items-center justify-between border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors text-xs"
                  onClick={() => {
                    setShowProductResults(true);
                    setProductSearchTerm("");
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-blue-600" />
                    <div>
                      <span className="font-medium">{selectedProduct.nombre}</span>
                      <p className="text-blue-600 text-[10px]">Click para cambiar</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-[10px] border-blue-200">
                    Stock: {selectedProduct.stock}
                  </Badge>
                </div>
              ) : (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Seleccione un producto
                </p>
              )}
            </div>

            {/* Cantidad y motivo en una fila */}
            <div className="grid grid-cols-2 gap-4">
              {/* Cantidad */}
              <div className="space-y-1">
                <Label htmlFor="cantidad" className="text-slate-700 text-sm font-medium">
                  Cantidad
                </Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Cantidad"
                  {...form.register("cantidad")}
                  className="border-slate-200 h-9"
                />
                {form.watch("tipo") === "SALIDA" &&
                  selectedProduct &&
                  parseInt(form.watch("cantidad") || "0") > selectedProduct.stock && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Stock insuficiente
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-1">
                <Label htmlFor="motivo" className="text-slate-700 text-sm font-medium">
                  Motivo
                </Label>
                <Input
                  id="motivo"
                  placeholder="Motivo breve"
                  {...form.register("motivo")}
                  className="border-slate-200 h-9"
                />
              </div>
            </div>

            {/* Notificación según tipo de movimiento */}
            {form.watch("tipo") && (
              <div className={`p-2 rounded-lg text-xs ${getTipoMovimientoStyles(form.watch("tipo"))}`}>
                <h3 className="font-medium flex items-center gap-1">
                  {getTipoMovimientoIcon(form.watch("tipo"))}
                  {getTipoMovimientoText(form.watch("tipo"))}
                </h3>
              </div>
            )}

            <DialogFooter className="mt-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={formLoading}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmitMovimiento)}
                disabled={formLoading || !form.watch("tipo") || !form.watch("productoId") || !form.watch("cantidad")}
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Registrar
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 