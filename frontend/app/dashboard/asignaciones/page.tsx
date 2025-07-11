"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  UserCheck,
  Building,
  DollarSign,
  Trash2,
  Edit,
  PlusCircle,
  RefreshCcw,
  X,
  Link,
  UserCog,
  ChevronsUp,
  CalendarDays,
  Search,
  Loader2,
  Wine,
  Coffee
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Checkbox } from "@/components/ui/checkbox";

interface Asignacion {
  id: number;
  bartenderId: number;
  mozoId?: number;
  cajaId: number;
  fechaAsignacion: string;
  activa: boolean;
  bartender: {
    id: number;
    nombre: string;
    email: string;
    rol: {
      id: number;
      nombre: string;
    };
  };
  mozo?: {
    id: number;
    nombre: string;
    email: string;
    rol: {
      id: number;
      nombre: string;
    };
  };
  caja: {
    id: number;
    estado: string;
    sucursal: {
      id: number;
      nombre: string;
    };
    usuarioApertura: {
      id: number;
      nombre: string;
    };
  };
}

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: {
    id: number;
    nombre: string;
  };
}

interface Caja {
  id: number;
  estado: string;
  saldoInicial: number;
  fechaApertura: string;
  usuarioApertura: {
    id: number;
    nombre: string;
  };
  sucursal: {
    id: number;
    nombre: string;
  };
}

export default function AsignacionesPage() {
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cajas, setCajas] = useState<Caja[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarSoloActivas, setMostrarSoloActivas] = useState(true);

  const form = useForm({
    defaultValues: {
      bartenderId: "",
      mozoIds: [] as string[],
      cajaId: "",
    },
  });

  // Cargar datos iniciales
  useEffect(() => {
    fetchAsignaciones();
    fetchUsuarios();
    fetchCajas();
  }, []);

  // Obtener asignaciones
  const fetchAsignaciones = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const res = await axios.get("http://192.168.0.102:3001/asignaciones", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAsignaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      toast.error("Error al cargar las asignaciones");
    } finally {
      setLoading(false);
    }
  };

  // Obtener usuarios
  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://192.168.0.102:3001/auth/usuarios", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsuarios(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      toast.error("Error al cargar los usuarios");
    }
  };

  // Obtener cajas abiertas
  const fetchCajas = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.get("http://192.168.0.102:3001/cajas?estado=ABIERTA", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCajas(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar cajas:", error);
      toast.error("Error al cargar las cajas");
    }
  };

  // Crear una nueva asignación
  const onSubmitCreate = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      // Crear los datos de asignación con el bartender y la caja
      const asignacionData = {
        bartenderId: parseInt(data.bartenderId),
        cajaId: parseInt(data.cajaId),
      };

      // Añadir mozos si se seleccionaron
      if (data.mozoIds && data.mozoIds.length > 0 && !data.mozoIds.includes("0")) {
        // Creamos una asignación por cada mozo seleccionado
        const asignaciones = data.mozoIds.map((mozoId: string) => ({
          ...asignacionData,
          mozoId: parseInt(mozoId)
        }));

        // Si no se seleccionaron mozos, enviamos una sola asignación sin mozoId
        const promises = asignaciones.length > 0 ? 
          asignaciones.map((asignacion: { bartenderId: number; cajaId: number; mozoId: number }) => 
            axios.post("http://192.168.0.102:3001/asignaciones", asignacion, 
            { headers: { Authorization: `Bearer ${token}` } })
          ) : 
          [axios.post("http://192.168.0.102:3001/asignaciones", asignacionData,
            { headers: { Authorization: `Bearer ${token}` } })];

        await Promise.all(promises);
      } else {
        // Si no se seleccionaron mozos o se seleccionó "Ninguno", enviamos una sola asignación sin mozoId
        await axios.post(
          "http://192.168.0.102:3001/asignaciones",
          asignacionData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      toast.success("Asignación creada correctamente");
      setIsCreating(false);
      form.reset();
      fetchAsignaciones();
    } catch (error) {
      console.error("Error al crear asignación:", error);
      toast.error("Error al crear la asignación");
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de una asignación
  const toggleEstadoAsignacion = async (id: number, activa: boolean) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      await axios.patch(
        `http://192.168.0.102:3001/asignaciones/${id}`,
        { activa: !activa },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Asignación ${activa ? "desactivada" : "activada"} correctamente`);
      fetchAsignaciones();
    } catch (error) {
      console.error("Error al cambiar estado de asignación:", error);
      toast.error("Error al cambiar estado de la asignación");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una asignación
  const eliminarAsignacion = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta asignación?")) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      await axios.delete(`http://192.168.0.102:3001/asignaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Asignación eliminada correctamente");
      fetchAsignaciones();
    } catch (error) {
      console.error("Error al eliminar asignación:", error);
      toast.error("Error al eliminar la asignación");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar asignaciones
  const asignacionesFiltradas = asignaciones.filter(asignacion => {
    // Filtrar por búsqueda
    const matchesSearch = 
      asignacion.bartender.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asignacion.mozo && asignacion.mozo.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asignacion.caja.sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por estado (activas/todas)
    const matchesEstado = mostrarSoloActivas ? asignacion.activa : true;

    return matchesSearch && matchesEstado;
  });

  // Obtener usuarios con rol específico
  const getUsuariosPorRol = (rolNombre: string) => {
    return usuarios.filter(u => u.rol?.nombre === rolNombre);
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy HH:mm", { locale: es });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col rounded-xl overflow-hidden shadow-sm border bg-white">
        {/* Header con degradado */}
        <div className="px-6 py-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Asignaciones de Trabajo</h1>
              <div className="flex items-center gap-2 mt-1.5 text-blue-100">
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
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchAsignaciones}
                className="h-9 bg-white/20 text-white hover:bg-white/30 border-none gap-2"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                Actualizar
              </Button>
              <Button
                onClick={() => setIsCreating(true)}
                className="gap-2 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm"
                size="sm"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Nueva Asignación
              </Button>
            </div>
          </div>
        </div>
        
        {/* Barra de búsqueda y filtros */}
        <div className="px-6 py-4 border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                placeholder="Buscar por nombre o sucursal..."
                className="pl-10 pr-4 py-2 border-slate-200 bg-white rounded-md w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
              <Button 
                variant={mostrarSoloActivas ? "default" : "ghost"}
                onClick={() => setMostrarSoloActivas(true)}
                className="gap-2 rounded-md h-8"
                size="sm"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Activas
              </Button>
              <Button 
                variant={!mostrarSoloActivas ? "default" : "ghost"}
                onClick={() => setMostrarSoloActivas(false)}
                className="gap-2 rounded-md h-8"
                size="sm"
              >
                <Users className="h-3.5 w-3.5" />
                Todas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center items-center py-20 rounded-lg border border-dashed border-slate-300 bg-slate-50">
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-3 w-3 text-blue-600" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 font-medium">Cargando asignaciones...</p>
          </div>
        </div>
      ) : asignacionesFiltradas.length === 0 ? (
        <div className="mt-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="px-6 py-10 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center">
                <UserCog className="h-10 w-10 text-slate-300" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-slate-200 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-slate-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-3">No hay asignaciones</h3>
            <p className="text-slate-500 max-w-md mb-6">
              {searchTerm || !mostrarSoloActivas
                ? "No se encontraron asignaciones con los filtros seleccionados. Intenta cambiar los criterios de búsqueda."
                : "No hay asignaciones de trabajo activas. Crea una nueva asignación para comenzar a organizar tu equipo."}
            </p>
            <Button
              onClick={() => setIsCreating(true)}
              className="gap-2 shadow-sm px-6"
              size="lg"
            >
              <PlusCircle className="h-5 w-5" />
              Crear Nueva Asignación
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {asignacionesFiltradas.map((asignacion) => (
            <Card 
              key={asignacion.id} 
              className={`overflow-hidden border ${asignacion.activa 
                ? 'border-green-200 shadow-md' 
                : 'border-slate-200 shadow-sm'} 
                hover:shadow-lg transition-all duration-200`}
            >
              <div className={`h-2 w-full ${asignacion.activa 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                : 'bg-gradient-to-r from-slate-300 to-slate-400'}`} 
              />
              <CardHeader className={`pb-3 ${asignacion.activa ? 'bg-green-50/60' : 'bg-slate-50/60'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full ${asignacion.activa 
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-600' 
                      : 'bg-gradient-to-br from-slate-500 to-slate-600'} 
                      shadow-md flex items-center justify-center text-white`}>
                      <Wine className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base mb-0.5">{asignacion.bartender.nombre}</CardTitle>
                      <CardDescription className="text-xs mt-0">
                        {asignacion.bartender.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={asignacion.activa ? "default" : "outline"}
                    className={asignacion.activa
                      ? "bg-green-100 text-green-800 hover:bg-green-200 shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  >
                    {asignacion.activa ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <DollarSign className="h-4.5 w-4.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Caja #{asignacion.caja.id}</p>
                      <p className="text-xs text-slate-500">Sucursal: {asignacion.caja.sucursal.nombre}</p>
                      <p className="text-xs text-slate-500">Cajero: {asignacion.caja.usuarioApertura.nombre}</p>
                    </div>
                  </div>

                  {asignacion.mozo && (
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Coffee className="h-4.5 w-4.5 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">Mozo: {asignacion.mozo.nombre}</p>
                        <p className="text-xs text-slate-500">{asignacion.mozo.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center text-xs text-slate-500 pt-1">
                    <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                    <span>{formatDate(asignacion.fechaAsignacion)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-3 bg-slate-50 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-md ${asignacion.activa 
                    ? 'text-slate-700 hover:text-red-700 hover:bg-red-50' 
                    : 'text-slate-700 hover:text-green-700 hover:bg-green-50'}`}
                  onClick={() => toggleEstadoAsignacion(asignacion.id, asignacion.activa)}
                >
                  {asignacion.activa ? "Desactivar" : "Activar"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-md text-slate-700 hover:text-red-700 hover:bg-red-50"
                  onClick={() => eliminarAsignacion(asignacion.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para crear asignación */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="w-[90%] max-w-sm p-0 overflow-hidden bg-white border-none shadow-xl max-h-[90vh]">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 mb-1">
              <div className="p-1 bg-white/20 rounded-md">
                <UserCog className="h-4 w-4" />
              </div>
              Nueva Asignación
            </DialogTitle>
            <DialogDescription className="text-blue-100 opacity-90 text-sm">
              Conecta bartenders, mozos y cajas para optimizar el servicio.
            </DialogDescription>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitCreate)} className="p-3">
              <div className="grid gap-3">
                <FormField
                  control={form.control}
                  name="bartenderId"
                  render={({ field }) => (
                    <FormItem className="mb-1">
                      <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                        <Wine className="h-3.5 w-3.5 text-purple-500" />
                        Bartender
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Seleccionar bartender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white shadow-md border-slate-200">
                          {getUsuariosPorRol("BARTENDER").map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()} className="focus:bg-slate-100">
                              {user.nombre} - {user.email}
                            </SelectItem>
                          ))}
                          {getUsuariosPorRol("ADMIN").map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()} className="focus:bg-slate-100">
                              {user.nombre} (Admin)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px] text-slate-500 mt-1">
                        Selecciona el bartender que se asignará a esta estación.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cajaId"
                  render={({ field }) => (
                    <FormItem className="mb-1">
                      <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                        <DollarSign className="h-3.5 w-3.5 text-blue-500" />
                        Caja
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-50 border-slate-200">
                            <SelectValue placeholder="Seleccionar caja" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white shadow-md border-slate-200">
                          {cajas.map((caja) => (
                            <SelectItem key={caja.id} value={caja.id.toString()} className="focus:bg-slate-100">
                              Caja #{caja.id} - {caja.sucursal.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-[10px] text-slate-500 mt-1">
                        Selecciona la caja a la que se asignará el bartender.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mozoIds"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-xs font-medium flex items-center gap-1.5">
                        <Coffee className="h-3.5 w-3.5 text-amber-500" />
                        Mozos (Opcional)
                      </FormLabel>
                      <div className="max-h-28 overflow-y-auto border rounded-md bg-slate-50 border-slate-200 shadow-inner">
                        <div className="p-2 border-b bg-slate-100">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="ninguno"
                              checked={!field.value || field.value.length === 0 || field.value.includes("0")} 
                              onCheckedChange={(checked: boolean | "indeterminate") => {
                                if (checked) {
                                  field.onChange(["0"]);
                                } else {
                                  field.onChange([]);
                                }
                              }}
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <label htmlFor="ninguno" className="text-xs font-medium leading-none cursor-pointer select-none">
                              Ninguno
                            </label>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-200">
                          {getUsuariosPorRol("MOZO").map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-slate-100">
                              <Checkbox 
                                id={`mozo-${user.id}`}
                                checked={field.value?.includes(user.id.toString())}
                                onCheckedChange={(checked: boolean | "indeterminate") => {
                                  // Si se selecciona "Ninguno", desmarcar todos los demás
                                  if (field.value?.includes("0")) {
                                    field.onChange(checked ? [user.id.toString()] : []);
                                  } else {
                                    // Actualizar la lista de mozos seleccionados
                                    const currentValue = field.value || [];
                                    const updatedValue = checked 
                                      ? [...currentValue, user.id.toString()]
                                      : currentValue.filter(id => id !== user.id.toString());
                                    
                                    field.onChange(updatedValue);
                                  }
                                }}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <label htmlFor={`mozo-${user.id}`} className="text-xs leading-none cursor-pointer select-none">
                                <span className="font-medium">{user.nombre}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{user.email}</span>
                              </label>
                            </div>
                          ))}
                          {getUsuariosPorRol("ADMIN").length > 0 && (
                            <div className="p-1.5 bg-slate-100 text-[10px] font-medium text-slate-500">Administradores</div>
                          )}
                          {getUsuariosPorRol("ADMIN").map((user) => (
                            <div key={user.id} className="flex items-center space-x-2 py-1.5 px-2 hover:bg-slate-100">
                              <Checkbox 
                                id={`admin-${user.id}`}
                                checked={field.value?.includes(user.id.toString())}
                                onCheckedChange={(checked: boolean | "indeterminate") => {
                                  // Si se selecciona "Ninguno", desmarcar todos los demás
                                  if (field.value?.includes("0")) {
                                    field.onChange(checked ? [user.id.toString()] : []);
                                  } else {
                                    // Actualizar la lista de mozos seleccionados
                                    const currentValue = field.value || [];
                                    const updatedValue = checked 
                                      ? [...currentValue, user.id.toString()]
                                      : currentValue.filter(id => id !== user.id.toString());
                                    
                                    field.onChange(updatedValue);
                                  }
                                }}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <label htmlFor={`admin-${user.id}`} className="text-xs leading-none cursor-pointer select-none">
                                <span className="font-medium">{user.nombre} <span className="text-blue-600">(Admin)</span></span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{user.email}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <FormDescription className="text-[10px] text-slate-500 mt-1">
                        Selecciona los mozos que trabajarán con este bartender.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="flex justify-end gap-2 mt-3 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                  className="border-slate-200"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear Asignación
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 