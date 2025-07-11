"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusCircle,
  Search,
  RefreshCcw,
  DollarSign,
  Box,
  Calendar,
  ChevronRight,
  CircleOff,
  CircleCheck,
  Loader2,
  Clock,
  User,
  CalendarDays,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter,
  ListFilter,
  Banknote,
  ActivitySquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
}

interface Caja {
  id: number;
  estado: "ABIERTA" | "CERRADA";
  saldoInicial: number;
  saldoFinal?: number;
  fechaApertura: string;
  fechaCierre?: string;
  observaciones?: string;
  usuarioApertura: {
    id: number;
    nombre: string;
  };
  usuarioCierre?: {
    id: number;
    nombre: string;
  };
  saldoActual?: number;
  totalIngresos?: number;
  totalEgresos?: number;
  totalMovimientos?: number;
  sucursal?: {
    id: number;
    nombre: string;
  };
}

export default function CajasPage() {
  const router = useRouter();
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("all");
  const [cajaActual, setCajaActual] = useState<Caja | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cajeros, setCajeros] = useState<{id: number, nombre: string, rolId: number}[]>([]);

  const form = useForm({
    defaultValues: {
      saldoInicial: "",
      observaciones: "",
      sucursalId: "",
      cajeroId: ""
    },
  });

  // Cargar cajas al iniciar
  useEffect(() => {
    fetchCajas();
    checkCajaActual();
    fetchSucursales();
    fetchCajeros();
  }, []);

  // Obtener todas las cajas
  const fetchCajas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const res = await axios.get("http://192.168.0.102:3001/cajas", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCajas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar cajas:", error);
      toast.error("Error al cargar las cajas");
    } finally {
      setLoading(false);
    }
  };

  // Verificar si hay una caja abierta
  const checkCajaActual = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Obtener todas las cajas abiertas filtrando del listado general
      const res = await axios.get("http://192.168.0.102:3001/cajas?estado=ABIERTA", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Si hay cajas abiertas, guardamos la primera para mantener compatibilidad
      if (Array.isArray(res.data) && res.data.length > 0) {
        setCajaActual(res.data[0]);
      } else {
        setCajaActual(null);
      }
    } catch (error) {
      console.error("Error al verificar cajas actuales:", error);
      setCajaActual(null);
    }
  };

  // Verificar si hay una caja abierta en una sucursal específica
  const checkCajaEnSucursal = async (sucursalId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      const res = await axios.get(`http://192.168.0.102:3001/cajas/actual?sucursalId=${sucursalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return res.data;
    } catch (error) {
      // Si no hay caja abierta, la API devuelve 404, lo cual es normal
      return null;
    }
  };

  // Obtener todas las sucursales
  const fetchSucursales = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://192.168.0.102:3001/sucursales", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSucursales(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      toast.error("Error al cargar las sucursales");
    }
  };

  // Obtener todos los cajeros
  const fetchCajeros = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Primero verificamos el rol del usuario actual
      const userInfoResponse = await axios.get("http://192.168.0.102:3001/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const userRole = userInfoResponse.data?.rol?.nombre;
      
      // Si es CAJERO, solo usamos su propia información
      if (userRole === "CAJERO") {
        setCajeros([{
          id: userInfoResponse.data.id,
          nombre: userInfoResponse.data.nombre,
          rolId: userInfoResponse.data.rolId
        }]);
        return;
      }
      
      // Si es ADMIN, obtenemos todos los usuarios
      const res = await axios.get("http://192.168.0.102:3001/auth/usuarios", {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrar solo usuarios con rol CAJERO o ADMIN
      const usuariosFiltrados = Array.isArray(res.data) 
        ? res.data.filter(u => u.rol?.nombre === "CAJERO" || u.rol?.nombre === "ADMIN") 
        : [];
      
      setCajeros(usuariosFiltrados);
    } catch (error: any) {
      console.error("Error al cargar cajeros:", error);
      // No mostramos el toast de error para el 403 si es un usuario CAJERO
      if (error.response?.status !== 403) {
        toast.error("Error al cargar los cajeros");
      }
    }
  };

  // Comprobar si una sucursal ya tiene caja abierta - Ya no es necesario mostrar advertencias
  const handleSucursalChange = async (sucursalId: string) => {
    // Eliminamos la advertencia de caja ya abierta para permitir múltiples cajas por sucursal
  };

  // Abrir una nueva caja
  const onSubmitApertura = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const saldoInicial = parseFloat(data.saldoInicial);
      if (isNaN(saldoInicial) || saldoInicial <= 0) {
        form.setError("saldoInicial", { 
          type: "min", 
          message: "El saldo inicial debe ser mayor que 0" 
        });
        setLoading(false);
        return;
      }

      if (!data.sucursalId) {
        form.setError("sucursalId", {
          type: "required",
          message: "Debe seleccionar una sucursal"
        });
        setLoading(false);
        return;
      }

      const cajaData: {
        saldoInicial: number;
        observaciones: string;
        sucursalId: number;
        cajeroId?: number;
      } = {
        saldoInicial: saldoInicial,
        observaciones: data.observaciones || "",
        sucursalId: parseInt(data.sucursalId)
      };

      // Si se seleccionó un cajero, añadirlo al objeto
      if (data.cajeroId) {
        cajaData.cajeroId = parseInt(data.cajeroId);
      }

      const res = await axios.post(
        "http://192.168.0.102:3001/cajas/abrir",
        cajaData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Caja abierta correctamente");
      setIsAperturaModalOpen(false);
      form.reset();
      fetchCajas();
      checkCajaActual();
    } catch (error) {
      console.error("Error al abrir caja:", error);
      toast.error("Error al abrir la caja");
    } finally {
      setLoading(false);
    }
  };

  // Filtros para las cajas
  const filteredCajas = cajas.filter(caja => {
    const matchesSearch = 
      caja.id.toString().includes(searchTerm) || 
      (caja.observaciones && caja.observaciones.toLowerCase().includes(searchTerm.toLowerCase())) ||
      caja.usuarioApertura.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (caja.sucursal && caja.sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterEstado === "all") return matchesSearch;
    return matchesSearch && caja.estado === filterEstado;
  });

  // Ver detalles de una caja
  const verDetalleCaja = (id: number) => {
    router.push(`/dashboard/cajas/${id}`);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  // Formatear fecha corta
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM, HH:mm", { locale: es });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Cajas</h1>
            <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long', 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    fetchCajas();
                    checkCajaActual();
                  }}
                  className="h-9 w-9 rounded-full"
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualizar datos</TooltipContent>
            </Tooltip>
            <Button
              onClick={() => setIsAperturaModalOpen(true)}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Abrir Nueva Caja
            </Button>
          </div>
        </div>

        {/* Caja actual */}
        {cajaActual ? (
          <Card className="border border-green-100 shadow-sm">
            <CardHeader className="bg-green-50/60 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <ActivitySquare className="h-5 w-5 text-green-600" />
                    Caja Actualmente Abierta
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <span>Caja #{cajaActual.id}</span>
                    <span>•</span>
                    <span>Abierta el {formatDate(cajaActual.fechaApertura)}</span>
                    {cajaActual.sucursal && (
                      <>
                        <span>•</span>
                        <span className="font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full text-xs">
                          {cajaActual.sucursal.nombre}
                        </span>
                      </>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => verDetalleCaja(cajaActual.id)}
                    className="gap-1"
                  >
                    Ver Detalles
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-green-100 flex flex-col">
                  <div className="text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-green-600" />
                    Saldo Inicial
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{formatCurrency(cajaActual.saldoInicial)}</div>
                  <div className="text-xs text-gray-500 mt-1">Base registrada al abrir la caja</div>
                </div>
                <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-green-100 flex flex-col">
                  <div className="text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    Saldo Actual
                  </div>
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(cajaActual.saldoActual || 0)}</div>
                  <div className="text-xs flex items-center gap-1 mt-1">
                    <ArrowUpCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{formatCurrency(cajaActual.totalIngresos || 0)}</span>
                    <ArrowDownCircle className="h-3 w-3 text-red-500 ml-2" />
                    <span className="text-red-500">-{formatCurrency(cajaActual.totalEgresos || 0)}</span>
                  </div>
                </div>
                <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-green-100 flex flex-col">
                  <div className="text-sm font-medium text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <ActivitySquare className="h-4 w-4 text-green-600" />
                    Movimientos
                  </div>
                  <div className="text-3xl font-bold text-gray-800">{cajaActual.totalMovimientos || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Transacciones registradas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/60 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Box className="h-5 w-5 text-slate-500" />
                    Estado de Caja
                  </CardTitle>
                  <CardDescription className="mt-1">
                    No hay ninguna caja abierta actualmente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-8">
              <div className="flex flex-col items-center text-center bg-white/50 rounded-2xl p-8 shadow-sm border border-slate-100">
                <DollarSign className="h-12 w-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-medium text-slate-700">Sin Caja Activa</h3>
                <p className="text-slate-500 max-w-md mt-2 mb-6">
                  Para registrar movimientos de efectivo y gestionar las operaciones financieras, es necesario abrir una nueva caja.
                </p>
                <Button
                  onClick={() => setIsAperturaModalOpen(true)}
                  className="gap-2"
                >
                  <PlusCircle className="h-4 w-4" />
                  Abrir Nueva Caja
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <Tabs defaultValue="all" onValueChange={setFilterEstado} className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-0">
              <div className="flex-1">
                <TabsList className="bg-background h-11 p-1 rounded-xl">
                  <TabsTrigger 
                    value="all"
                    className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:shadow-none data-[state=active]:text-slate-900 h-9"
                  >
                    Todas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ABIERTA"
                    className="rounded-lg data-[state=active]:bg-green-100 data-[state=active]:shadow-none data-[state=active]:text-green-800 h-9"
                  >
                    <CircleCheck className="h-4 w-4 mr-1.5" />
                    Abiertas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="CERRADA"
                    className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:shadow-none data-[state=active]:text-slate-900 h-9"
                  >
                    <CircleOff className="h-4 w-4 mr-1.5" />
                    Cerradas
                  </TabsTrigger>
                </TabsList>
              </div>
              <div className="mt-4 sm:mt-0 flex-1 max-w-md relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, comentarios o usuario..."
                  className="pl-9 bg-slate-50 border-slate-200 h-10 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <TabsContent value="all" className="mt-6">
              <HistorialCajas cajas={filteredCajas} loading={loading} onVerDetalle={verDetalleCaja} formatDate={formatDate} formatShortDate={formatShortDate} />
            </TabsContent>
            <TabsContent value="ABIERTA" className="mt-6">
              <HistorialCajas cajas={filteredCajas} loading={loading} onVerDetalle={verDetalleCaja} formatDate={formatDate} formatShortDate={formatShortDate} />
            </TabsContent>
            <TabsContent value="CERRADA" className="mt-6">
              <HistorialCajas cajas={filteredCajas} loading={loading} onVerDetalle={verDetalleCaja} formatDate={formatDate} formatShortDate={formatShortDate} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal para abrir caja */}
        <Dialog open={isAperturaModalOpen} onOpenChange={setIsAperturaModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <span>Abrir Nueva Caja</span>
              </DialogTitle>
              
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitApertura)} className="space-y-5 py-4">
                 
                  
                  <FormField
                    control={form.control}
                    name="sucursalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Sucursal <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-300 focus:ring-blue-200 bg-white">
                              <SelectValue placeholder="Seleccione una sucursal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sucursales.filter(s => s.activa).map((sucursal) => (
                              <SelectItem 
                                key={sucursal.id} 
                                value={sucursal.id.toString()}
                                className="focus:bg-blue-50 bg-white"
                              >
                                {sucursal.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cajeroId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Asignar a Cajero
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-gray-300 focus:border-blue-300 focus:ring-blue-200 bg-white">
                              <SelectValue placeholder="Seleccione un cajero (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cajeros.map((cajero) => (
                              <SelectItem 
                                key={cajero.id} 
                                value={cajero.id.toString()}
                                className="focus:bg-blue-50 bg-white"
                              >
                                {cajero.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="saldoInicial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Saldo Inicial <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              placeholder="0.00"
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              className="pl-8 border-gray-300 focus:border-blue-300 focus:ring-blue-200 bg-white"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">Observaciones</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Observaciones (opcional)"
                            {...field}
                            className="border-gray-300 focus:border-blue-300 focus:ring-blue-200 bg-white"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500" />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="pt-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAperturaModalOpen(false)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Abrir Caja
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function HistorialCajas({ cajas, loading, onVerDetalle, formatDate, formatShortDate }: { 
  cajas: any[], 
  loading: boolean, 
  onVerDetalle: (id: number) => void,
  formatDate: (date: string) => string,
  formatShortDate: (date: string) => string
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-slate-300" />
      </div>
    );
  }

  if (cajas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Box className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-medium text-slate-700 mb-2">Sin registros</h3>
        <p className="text-slate-500 max-w-md">
          No se encontraron cajas que coincidan con los criterios de búsqueda seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cajas.map((caja) => (
        <Card 
          key={caja.id} 
          className={cn(
            "overflow-hidden border shadow-md hover:shadow-lg transition-all duration-200",
            caja.estado === "ABIERTA" ? "border-green-200 bg-green-50/30" : "border-slate-200"
          )}
          onClick={() => onVerDetalle(caja.id)}
        >
          <div 
            className={cn(
              "h-1 w-full",
              caja.estado === "ABIERTA" 
                ? "bg-gradient-to-r from-green-500 to-emerald-400" 
                : "bg-gradient-to-r from-slate-400 to-slate-300"
            )}
          />
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full mr-2",
                  caja.estado === "ABIERTA" ? "bg-green-100" : "bg-slate-100"
                )}>
                  <span className="font-mono text-xs font-medium">#{caja.id}</span>
                </div>
                <div>
                  <CardTitle className="text-base">
                    {caja.estado === "ABIERTA" ? "Caja Abierta" : "Caja Cerrada"}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center mt-0.5">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatShortDate(caja.fechaApertura)}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={caja.estado === "ABIERTA" ? "default" : "outline"}
                className={
                  caja.estado === "ABIERTA" 
                    ? "bg-green-100 hover:bg-green-200 text-green-700 border-green-200" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }
              >
                {caja.estado === "ABIERTA" ? (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Activa
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    Cerrada
                  </div>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-3 pt-2">
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="space-y-1">
                <div className="text-xs text-slate-500">Saldo Inicial</div>
                <div className="font-semibold text-sm">{formatCurrency(caja.saldoInicial)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-500">
                  {caja.estado === "ABIERTA" ? "Saldo Actual" : "Saldo Final"}
                </div>
                <div className={cn(
                  "font-semibold text-sm",
                  caja.estado === "ABIERTA" ? "text-green-600" : ""
                )}>
                  {caja.estado === "ABIERTA" 
                    ? formatCurrency(caja.saldoActual || 0) 
                    : formatCurrency(caja.saldoFinal || 0)}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center text-xs text-slate-500">
                <User className="h-3 w-3 mr-1" /> 
                {caja.usuarioApertura.nombre}
                {caja.usuarioCierre && (
                  <span className="ml-2 text-slate-400">
                    • Cierre: {caja.usuarioCierre.nombre}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button
              variant="ghost" 
              size="sm"
              className="w-full justify-center text-primary hover:text-primary hover:bg-primary/5"
            >
              Ver Detalle
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 