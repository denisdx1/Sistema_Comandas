"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building, Plus, Edit, Trash2, Check, X, MapPin, Phone, 
  Loader2, Search, RefreshCw, Store, Building2, CircleCheck, CircleOff,
  AlertCircle, DollarSign, ArrowRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Sucursal {
  id: number;
  nombre: string;
  direccion?: string;
  telefono?: string;
  activa: boolean;
  _count?: {
    cajas: number;
  }
}

export default function SucursalesPage() {
  const router = useRouter();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSucursal, setCurrentSucursal] = useState<Sucursal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    direccion: "",
    telefono: "",
    activa: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      const res = await axios.get("http://192.168.0.102:3001/sucursales", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSucursales(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error al cargar sucursales:", error);
      toast.error("Error al cargar las sucursales");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      activa: checked
    }));
  };

  const openDialog = (sucursal?: Sucursal) => {
    if (sucursal) {
      setCurrentSucursal(sucursal);
      setFormData({
        nombre: sucursal.nombre,
        direccion: sucursal.direccion || "",
        telefono: sucursal.telefono || "",
        activa: sucursal.activa
      });
    } else {
      setCurrentSucursal(null);
      setFormData({
        nombre: "",
        direccion: "",
        telefono: "",
        activa: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre de la sucursal es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      if (currentSucursal) {
        // Actualizar sucursal
        await axios.patch(
          `http://192.168.0.102:3001/sucursales/${currentSucursal.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Sucursal actualizada correctamente");
      } else {
        // Crear nueva sucursal
        await axios.post(
          "http://192.168.0.102:3001/sucursales",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Sucursal creada correctamente");
      }

      setIsDialogOpen(false);
      fetchSucursales();
    } catch (error) {
      console.error("Error al guardar sucursal:", error);
      toast.error("Error al guardar la sucursal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        return;
      }

      await axios.delete(`http://192.168.0.102:3001/sucursales/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Sucursal eliminada correctamente");
      fetchSucursales();
    } catch (error: any) {
      console.error("Error al eliminar sucursal:", error);
      
      const errorMessage = error.response?.data?.message || "Error al eliminar la sucursal";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setDeleteId(null);
    }
  };

  const filteredSucursales = sucursales.filter(sucursal => {
    return (
      sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sucursal.direccion && sucursal.direccion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sucursal.telefono && sucursal.telefono.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Animación para los elementos de la lista
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 py-6 px-4 md:px-8">
      {/* Header con gradiente */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-950 flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              Gestión de Sucursales
            </h1>
            <p className="text-blue-700 mt-2 max-w-2xl">
              Administre las sucursales de su negocio y configure las cajas registradoras asociadas a cada ubicación
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-500" />
              <Input
                placeholder="Buscar sucursal..."
                className="pl-9 w-full sm:w-64 bg-white border-blue-200 focus-visible:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => openDialog()} 
              className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              Nueva Sucursal
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={fetchSucursales} 
              className="h-10 w-10 border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50 hover:border-blue-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden border border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between mt-6">
                    <Skeleton className="h-9 w-24" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-9 rounded-md" />
                      <Skeleton className="h-9 w-9 rounded-md" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSucursales.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <Building2 className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No hay sucursales registradas</h2>
            <p className="text-gray-600 max-w-md mb-6">
              Para comenzar a gestionar su negocio, cree su primera sucursal haciendo clic en el botón de abajo.
            </p>
            <Button
              onClick={() => openDialog()}
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md"
            >
              <Plus className="h-4 w-4" />
              Crear Primera Sucursal
            </Button>
          </div>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredSucursales.map((sucursal) => (
            <motion.div key={sucursal.id} variants={item}>
              <Card 
                className={cn(
                  "overflow-hidden border shadow-sm hover:shadow-md transition-all duration-200",
                  sucursal.activa 
                    ? "border-blue-200 hover:border-blue-300" 
                    : "border-gray-200 bg-gray-50"
                )}
              >
                <CardHeader className={cn(
                  "pb-3",
                  sucursal.activa 
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100" 
                    : "bg-gray-100 border-b border-gray-200"
                )}>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        {sucursal.nombre}
                        <Badge 
                          variant={sucursal.activa ? "default" : "secondary"} 
                          className={sucursal.activa 
                            ? "bg-green-100 hover:bg-green-200 text-green-800 border-green-200" 
                            : "bg-gray-200 hover:bg-gray-300 text-gray-700"}
                        >
                          {sucursal.activa ? (
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                              Activa
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                              Inactiva
                            </div>
                          )}
                        </Badge>
                      </CardTitle>
                      <CardDescription className={
                        sucursal.activa ? "text-blue-700" : "text-gray-500"
                      }>
                        Sucursal #{sucursal.id}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(sucursal)}
                        className={cn(
                          "h-8 w-8 rounded-full",
                          sucursal.activa 
                            ? "text-blue-600 hover:text-blue-700 hover:bg-blue-100" 
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                        )}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog open={deleteId === sucursal.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(sucursal.id)}
                            className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar esta sucursal?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente la sucursal 
                              <span className="font-medium text-foreground"> {sucursales.find(s => s.id === deleteId)?.nombre}</span> y 
                              toda la información relacionada con ella.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(deleteId!)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      {sucursal.direccion && (
                        <div className={cn(
                          "flex items-start gap-2 text-sm",
                          sucursal.activa ? "text-gray-700" : "text-gray-500"
                        )}>
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{sucursal.direccion}</span>
                        </div>
                      )}
                      {sucursal.telefono && (
                        <div className={cn(
                          "flex items-center gap-2 text-sm",
                          sucursal.activa ? "text-gray-700" : "text-gray-500"
                        )}>
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span>{sucursal.telefono}</span>
                        </div>
                      )}
                      {(!sucursal.direccion && !sucursal.telefono) && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 italic">
                          <AlertCircle className="h-4 w-4" />
                          <span>No hay información adicional registrada</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex items-center gap-1 text-sm font-medium rounded-full px-2.5 py-1",
                          sucursal.activa
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>
                            {sucursal._count?.cajas || 0} {sucursal._count?.cajas === 1 ? "caja" : "cajas"}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/cajas?sucursalId=${sucursal.id}`)}
                        className={cn(
                          "gap-1 h-8",
                          sucursal.activa
                            ? "border-blue-200 text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-100"
                        )}
                      >
                        Ver Cajas
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal para crear/editar sucursal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5 text-blue-600" />
              {currentSucursal ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
            <DialogDescription>
              {currentSucursal 
                ? "Actualice la información de esta sucursal" 
                : "Complete el formulario para crear una nueva sucursal"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-sm font-medium">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  name="nombre"
                  placeholder="Nombre de la sucursal"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="border-gray-300 focus-visible:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Este nombre se usará para identificar la sucursal en todo el sistema
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="direccion" className="text-sm font-medium">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  placeholder="Dirección física de la sucursal"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="border-gray-300 focus-visible:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-sm font-medium">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  placeholder="Teléfono de contacto"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="border-gray-300 focus-visible:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="activa" className="text-sm font-medium">
                    Estado de la sucursal
                  </Label>
                  <p className="text-xs text-gray-500">
                    Las sucursales inactivas no pueden abrir cajas
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={formData.activa ? "default" : "secondary"} 
                    className={formData.activa 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-200 text-gray-700"}
                  >
                    {formData.activa ? (
                      <div className="flex items-center gap-1">
                        <CircleCheck className="h-3 w-3" />
                        Activa
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <CircleOff className="h-3 w-3" />
                        Inactiva
                      </div>
                    )}
                  </Badge>
                  <Switch
                    id="activa"
                    checked={formData.activa}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="gap-2 border-gray-300"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : currentSucursal ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {currentSucursal ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 