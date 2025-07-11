"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Clock,
  ClipboardList,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightCircle,
  RotateCcw,
  Loader2,
  CheckCircle,
  BadgePercent,
  Receipt,
  Banknote,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  saldoActual: number;
  totalIngresos: number;
  totalEgresos: number;
  diferencia?: number;
  movimientos: Movimiento[];
}

interface Movimiento {
  id: number;
  tipo: "INGRESO" | "EGRESO" | "VENTA" | "DEVOLUCION";
  monto: number;
  concepto: string;
  fechaHora: string;
  usuario: {
    id: number;
    nombre: string;
  };
  orden?: {
    id: number;
    estado: string;
  };
}

export default function DetalleCajaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [caja, setCaja] = useState<Caja | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCerrarModalOpen, setIsCerrarModalOpen] = useState(false);
  const [isMovimientoModalOpen, setIsMovimientoModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("detalles");
  const [tipoMovimiento, setTipoMovimiento] = useState<"INGRESO" | "EGRESO">("INGRESO");

  const cerrarCajaForm = useForm({
    defaultValues: {
      saldoFinal: "",
      observaciones: "",
    },
  });

  const movimientoForm = useForm({
    defaultValues: {
      tipo: "INGRESO",
      monto: "",
      concepto: "",
    },
  });

  useEffect(() => {
    fetchCaja();
  }, [id]);

  const fetchCaja = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        router.push("/login");
        return;
      }

      const res = await axios.get(`http://192.168.0.102:3001/cajas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCaja(res.data);
    } catch (error) {
      console.error("Error al cargar la caja:", error);
      toast.error("Error al cargar los datos de la caja");
      router.push("/dashboard/cajas");
    } finally {
      setLoading(false);
    }
  };

  // Cerrar caja
  const onSubmitCerrarCaja = async (data: any) => {
    if (!caja) return;
    
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const saldoFinal = parseFloat(data.saldoFinal);
      if (isNaN(saldoFinal) || saldoFinal < 0) {
        cerrarCajaForm.setError("saldoFinal", { 
          type: "min", 
          message: "El saldo final no puede ser negativo" 
        });
        setSubmitLoading(false);
        return;
      }

      await axios.patch(
        `http://192.168.0.102:3001/cajas/${caja.id}/cerrar`,
        {
          saldoFinal: saldoFinal,
          observaciones: data.observaciones || ""
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Caja cerrada correctamente");
      setIsCerrarModalOpen(false);
      cerrarCajaForm.reset();
      fetchCaja();
    } catch (error) {
      console.error("Error al cerrar la caja:", error);
      toast.error("Error al cerrar la caja");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Registrar movimiento
  const onSubmitMovimiento = async (data: any) => {
    if (!caja) return;
    
    setSubmitLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const monto = parseFloat(data.monto);
      if (isNaN(monto) || monto <= 0) {
        movimientoForm.setError("monto", { 
          type: "min", 
          message: "El monto debe ser mayor que 0" 
        });
        setSubmitLoading(false);
        return;
      }

      if (!data.concepto.trim()) {
        movimientoForm.setError("concepto", {
          type: "required",
          message: "El concepto es obligatorio"
        });
        setSubmitLoading(false);
        return;
      }

      await axios.post(
        `http://192.168.0.102:3001/cajas/${caja.id}/movimientos`,
        {
          tipo: data.tipo,
          monto: monto,
          concepto: data.concepto
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Movimiento registrado correctamente");
      setIsMovimientoModalOpen(false);
      movimientoForm.reset();
      fetchCaja();
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      toast.error("Error al registrar el movimiento");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  // Obtener el color para el tipo de movimiento
  const getMovimientoColor = (tipo: string) => {
    switch (tipo) {
      case 'INGRESO': return 'text-green-600 bg-green-50';
      case 'EGRESO': return 'text-red-600 bg-red-50';
      case 'VENTA': return 'text-blue-600 bg-blue-50';
      case 'DEVOLUCION': return 'text-amber-600 bg-amber-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  // Obtener el icono para el tipo de movimiento
  const getMovimientoIcon = (tipo: string) => {
    switch (tipo) {
      case 'INGRESO': return <ArrowUpCircle className="h-4 w-4" />;
      case 'EGRESO': return <ArrowDownCircle className="h-4 w-4" />;
      case 'VENTA': return <ArrowRightCircle className="h-4 w-4" />;
      case 'DEVOLUCION': return <RotateCcw className="h-4 w-4" />;
      default: return null;
    }
  };

  // Formatear fecha corta
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM, HH:mm", { locale: es });
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-primary/70" />
          <p className="text-lg text-muted-foreground">Cargando información de caja...</p>
        </div>
      </div>
    );
  }

  if (!caja) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <DollarSign className="h-8 w-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Error al cargar la caja</h1>
        <p className="text-slate-500 mb-6">No se pudo obtener la información de esta caja</p>
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/cajas")}
          className="gap-2 px-5"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/cajas")}
              className="h-9 w-9 p-0 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Button>
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">Caja #{caja.id}</h1>
                <Badge 
                  variant={caja.estado === "ABIERTA" ? "default" : "outline"}
                  className={caja.estado === "ABIERTA" 
                    ? "bg-green-100 hover:bg-green-200 text-green-800 border-green-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200"}
                >
                  {caja.estado === "ABIERTA" ? (
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span>Abierta</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span>Cerrada</span>
                    </div>
                  )}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  {formatShortDate(caja.fechaApertura)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  {caja.usuarioApertura.nombre}
                </div>
              </div>
            </div>
          </div>
          
          {caja.estado === "ABIERTA" && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-0.5 rounded-lg shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline"
                      onClick={() => setIsMovimientoModalOpen(true)}
                      className="w-full sm:w-auto border-0 bg-white hover:bg-blue-50 shadow-inner h-10 px-4 font-medium"
                    >
                      <div className="mr-2 bg-blue-100 h-6 w-6 rounded-full flex items-center justify-center">
                        <DollarSign className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span>Registrar Movimiento</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-blue-900 text-white">
                    <p>Registrar nuevo movimiento de caja</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-0.5 rounded-lg shadow-sm">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        cerrarCajaForm.setValue("saldoFinal", String(caja.saldoActual));
                        setIsCerrarModalOpen(true);
                      }}
                      className="w-full sm:w-auto border-0 bg-white hover:bg-red-50 text-red-600 shadow-inner h-10 px-4 font-medium"
                    >
                      <div className="mr-2 bg-red-100 h-6 w-6 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3.5 w-3.5 text-red-600" />
                      </div>
                      <span>Cerrar Caja</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-red-900 text-white">
                    <p>Cerrar caja y finalizar operaciones</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}
        </div>

        {/* Tarjetas resumen */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-sky-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-blue-500" />
                Saldo Inicial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(caja.saldoInicial)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Base registrada al abrir
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-green-500 to-emerald-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-green-500" />
                {caja.estado === "ABIERTA" ? "Saldo Actual" : "Saldo Final"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {caja.estado === "ABIERTA" 
                  ? formatCurrency(caja.saldoActual) 
                  : formatCurrency(caja.saldoFinal || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {caja.estado === "ABIERTA" ? "Actualizado en tiempo real" : "Registrado al cierre"}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
                Ingresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(caja.totalIngresos)}
              </div>
              {caja.movimientos && (
                <p className="text-xs text-muted-foreground mt-1">
                  {caja.movimientos.filter(m => 
                    m.tipo === 'INGRESO' || m.tipo === 'VENTA'
                  ).length} movimientos
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-lg">
            <div className="h-1 w-full bg-gradient-to-r from-red-500 to-orange-400"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                Egresos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(caja.totalEgresos)}
              </div>
              {caja.movimientos && (
                <p className="text-xs text-muted-foreground mt-1">
                  {caja.movimientos.filter(m => 
                    m.tipo === 'EGRESO' || m.tipo === 'DEVOLUCION'
                  ).length} movimientos
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-6"
        >
          <TabsList className="bg-background h-11 p-1 rounded-xl border">
            <TabsTrigger 
              value="detalles"
              className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:shadow-none data-[state=active]:text-slate-900 h-9"
            >
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Detalles
            </TabsTrigger>
            <TabsTrigger 
              value="movimientos"
              className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:shadow-none data-[state=active]:text-slate-900 h-9"
            >
              <ArrowRightCircle className="h-4 w-4 mr-1.5" />
              Movimientos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="detalles" className="space-y-6 min-h-[300px]">
            {/* Información General y Observaciones */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="overflow-hidden border-0 shadow-md bg-white">
                <div className="h-1 w-full bg-gradient-to-r from-purple-500 to-indigo-400"></div>
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg flex items-center gap-1.5">
                    <Receipt className="h-4.5 w-4.5 text-purple-500" />
                    Información General
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-5">
                  <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Apertura</div>
                      <div className="text-sm text-muted-foreground">{formatShortDate(caja.fechaApertura)}</div>
                    </div>
                  </div>
                  
                  {caja.fechaCierre && (
                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-slate-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Cierre</div>
                        <div className="text-sm text-muted-foreground">{formatShortDate(caja.fechaCierre)}</div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Usuario Apertura</div>
                      <div className="text-sm text-muted-foreground">{caja.usuarioApertura.nombre}</div>
                    </div>
                  </div>
                  
                  {caja.usuarioCierre && (
                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Usuario Cierre</div>
                        <div className="text-sm text-muted-foreground">{caja.usuarioCierre.nombre}</div>
                      </div>
                    </div>
                  )}

                  {caja.estado === "CERRADA" && typeof caja.diferencia !== 'undefined' && (
                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 
                        ${caja.diferencia < 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        <BadgePercent className={`h-5 w-5 ${caja.diferencia < 0 ? 'text-red-600' : 'text-green-600'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Diferencia</div>
                        <div className={`text-sm font-medium ${caja.diferencia < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {formatCurrency(caja.diferencia)}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-0 shadow-md bg-white">
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg flex items-center gap-1.5">
                    <ClipboardList className="h-4.5 w-4.5 text-amber-500" />
                    Observaciones
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="bg-amber-50/50 p-5 rounded-lg min-h-[225px] border border-amber-100/50 shadow-inner">
                    {caja.observaciones ? (
                      <p className="text-gray-700">{caja.observaciones}</p>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <ClipboardList className="h-10 w-10 text-amber-200 mb-2" />
                        <p className="text-amber-400 font-medium">Sin observaciones</p>
                        <p className="text-amber-300 text-sm mt-1">No se registraron notas para esta caja</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="movimientos" className="space-y-6 min-h-[300px]">
            <Card className="overflow-hidden border-0 shadow-md">
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-400"></div>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <ArrowRightCircle className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Movimientos de Caja</CardTitle>
                      <CardDescription className="mt-0.5">
                        Historial de transacciones registradas
                      </CardDescription>
                    </div>
                  </div>
                  {caja.movimientos?.length > 0 && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                      {caja.movimientos.length} registros
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {caja.movimientos && caja.movimientos.length > 0 ? (
                  <div className="overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-100">
                          <TableHead className="font-medium">#</TableHead>
                          <TableHead className="font-medium">Tipo</TableHead>
                          <TableHead className="font-medium">Monto</TableHead>
                          <TableHead className="font-medium">Concepto</TableHead>
                          <TableHead className="font-medium">Fecha y Hora</TableHead>
                          <TableHead className="font-medium">Usuario</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {caja.movimientos.map((movimiento) => (
                          <TableRow key={movimiento.id} className="group transition-colors hover:bg-slate-50/80">
                            <TableCell className="font-mono text-xs font-medium">#{movimiento.id}</TableCell>
                            <TableCell>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMovimientoColor(movimiento.tipo)} transition-colors group-hover:scale-105`}>
                                {getMovimientoIcon(movimiento.tipo)}
                                <span className="ml-1">{movimiento.tipo}</span>
                              </div>
                            </TableCell>
                            <TableCell className={`font-medium ${movimiento.tipo === 'EGRESO' || movimiento.tipo === 'DEVOLUCION' ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(movimiento.monto)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="group-hover:text-primary transition-colors">{movimiento.concepto}</span>
                                {movimiento.orden && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Orden #{movimiento.orden.id} ({movimiento.orden.estado})
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatShortDate(movimiento.fechaHora)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center mr-2 text-xs font-medium">
                                  {movimiento.usuario.nombre.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm">{movimiento.usuario.nombre}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <ClipboardList className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-700 mb-1">Sin movimientos</h3>
                    <p className="text-slate-500 max-w-md">
                      No hay transacciones registradas para esta caja
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal para cerrar caja */}
        <Dialog open={isCerrarModalOpen} onOpenChange={setIsCerrarModalOpen}>
          <DialogContent className="sm:max-w-md bg-slate-100 border-0 shadow-xl p-0 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Cerrar Caja #{caja.id}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Confirme el saldo final para cerrar operaciones de caja.
                  </DialogDescription>
                </div>
              </div>
              
              <Form {...cerrarCajaForm}>
                <form onSubmit={cerrarCajaForm.handleSubmit(onSubmitCerrarCaja)} className="space-y-5">
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-start">
                      <div className="text-amber-600 mr-2 mt-0.5 font-medium">!</div>
                      <div>
                        <p className="text-amber-800 font-medium">Resumen de caja</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <div className="text-xs text-amber-700">Saldo inicial</div>
                            <div className="font-semibold text-amber-900">{formatCurrency(caja.saldoInicial)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-amber-700">Saldo actual (sistema)</div>
                            <div className="font-semibold text-amber-900">{formatCurrency(caja.saldoActual)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={cerrarCajaForm.control}
                    name="saldoFinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Saldo Final *</FormLabel>
                        <FormDescription className="text-sm text-gray-600 mt-0">
                          Ingrese el monto físico de dinero al cierre de caja
                        </FormDescription>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-10 border-r bg-gray-200 rounded-l-md">
                              <span className="text-gray-600">$</span>
                            </div>
                            <Input
                              placeholder="0.00"
                              className="pl-12 h-10 bg-white border-2 border-gray-300"
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cerrarCajaForm.control}
                    name="observaciones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Observaciones</FormLabel>
                        <FormDescription className="text-sm text-gray-600 mt-0">
                          Información adicional sobre el cierre de caja (opcional)
                        </FormDescription>
                        <FormControl>
                          <Textarea
                            placeholder="Observaciones sobre el cierre de caja..."
                            className="resize-none bg-white border-2 border-gray-300 min-h-[100px]"
                            {...field}
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsCerrarModalOpen(false)}
                      className="bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitLoading} 
                      variant="destructive"
                      className="bg-white border-gray-300 hover:bg-gray-100 text-gray-800 "
                    >
                      {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Cerrar Caja
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal para registrar movimiento */}
        <Dialog open={isMovimientoModalOpen} onOpenChange={setIsMovimientoModalOpen}>
          <DialogContent className="sm:max-w-md bg-slate-100 border-0 shadow-xl p-0 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Registrar Movimiento</DialogTitle>
                  <DialogDescription className="mt-1">
                    Ingrese los detalles del movimiento a registrar.
                  </DialogDescription>
                </div>
              </div>

              <Form {...movimientoForm}>
                <form onSubmit={movimientoForm.handleSubmit(onSubmitMovimiento)} className="space-y-5">
                  <FormField
                    control={movimientoForm.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Tipo de Movimiento *</FormLabel>
                        <FormDescription className="text-sm text-gray-600 mt-0">
                          Seleccione si es entrada o salida de dinero
                        </FormDescription>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              className={cn(
                                "flex items-center gap-2 justify-center py-6 border-2",
                                field.value === "INGRESO"
                                  ? "bg-green-100 border-green-200 text-green-700 hover:bg-green-200"
                                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              )}
                              onClick={() => {
                                field.onChange("INGRESO");
                                setTipoMovimiento("INGRESO");
                              }}
                            >
                              <ArrowUpCircle className={cn(
                                "h-5 w-5",
                                field.value === "INGRESO" ? "text-green-600" : "text-gray-400"
                              )} />
                              <span>Ingreso</span>
                            </Button>
                            <Button
                              type="button"
                              className={cn(
                                "flex items-center gap-2 justify-center py-6 border-2",
                                field.value === "EGRESO"
                                  ? "bg-red-100 border-red-200 text-red-700 hover:bg-red-200"
                                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                              )}
                              onClick={() => {
                                field.onChange("EGRESO");
                                setTipoMovimiento("EGRESO");
                              }}
                            >
                              <ArrowDownCircle className={cn(
                                "h-5 w-5",
                                field.value === "EGRESO" ? "text-red-600" : "text-gray-400"
                              )} />
                              <span>Egreso</span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movimientoForm.control}
                    name="monto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Monto *</FormLabel>
                        <FormDescription className="text-sm text-gray-600 mt-0">
                          Cantidad de dinero del {tipoMovimiento === "INGRESO" ? "ingreso" : "egreso"}
                        </FormDescription>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-10 border-r bg-gray-200 rounded-l-md">
                              <span className="text-gray-600">$</span>
                            </div>
                            <Input
                              placeholder="0.00"
                              className={cn(
                                "pl-12 h-10 bg-white border-2",
                                tipoMovimiento === "INGRESO" 
                                  ? "focus:border-green-300 focus:ring-green-200"
                                  : "focus:border-red-300 focus:ring-red-200",
                                "border-gray-300"
                              )}
                              {...field}
                              type="number"
                              step="0.01"
                              min="0.01"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={movimientoForm.control}
                    name="concepto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium">Concepto *</FormLabel>
                        <FormDescription className="text-sm text-gray-600 mt-0">
                          Detalle para que se registra este movimiento
                        </FormDescription>
                        <FormControl>
                          <Input
                            placeholder={tipoMovimiento === "INGRESO" ? "Ej: Ingreso por venta de tarjetas" : "Ej: Pago a proveedor"}
                            className="h-10 bg-white border-2 border-gray-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-3">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setIsMovimientoModalOpen(false)}
                      className="bg-white border-gray-300 hover:bg-gray-100 text-gray-800"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitLoading}
                      variant={tipoMovimiento === "INGRESO" ? "default" : "destructive"}
                      className="gap-2"
                    >
                      {submitLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Registrar {tipoMovimiento === "INGRESO" ? "Ingreso" : "Egreso"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
} 