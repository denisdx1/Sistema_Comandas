"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DollarSign,
  ArrowLeft,
  CreditCard,
  ArrowRightLeft,
  HelpCircle,
  Check,
  AlertCircle,
  Package,
  ShoppingCart,
  Utensils,
  Info as InfoIcon
} from "lucide-react";

interface OrdenItem {
  id: number;
  cantidad: number;
  esComplemento?: boolean;
  tipoComplemento?: 'NO_ES_COMPLEMENTO' | 'BEBIDA_PARA_LICOR' | 'OTRO_COMPLEMENTO';
  productoAsociadoId?: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    categoria: {
      nombre: string;
    };
  };
  combo?: {
    id: number;
    nombre: string;
    precio: number;
  };
}

interface Orden {
  id: number;
  estado: string;
  createdAt: string;
  items: OrdenItem[];
  mozo?: {
    id: number;
    nombre: string;
  };
}

export default function CobrarOrdenPage() {
  const params = useParams();
  const router = useRouter();
  const [orden, setOrden] = useState<Orden | null>(null);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Obtener ID de la orden desde los parámetros de la ruta
  const ordenId = params.id;
  
  // Verificar el rol del usuario al cargar la página
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Sesión no válida");
          router.push('/login');
          return;
        }

        // Usar el nuevo endpoint para verificar permisos
        const response = await axios.get("http://192.168.0.102:3001/auth/check-permissions", {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Si el usuario no tiene permisos para cobrar órdenes, redirigir
        if (!response.data.canCollectOrders) {
          toast.error('No tienes permisos para cobrar órdenes');
          router.push('/dashboard/ordenes/gestionar');
          return;
        }

        setUserRole(response.data.role);
      } catch (error) {
        console.error('Error al verificar permisos:', error);
        toast.error('Error al verificar permisos');
        router.push('/dashboard/ordenes/gestionar');
      }
    };

    checkPermissions();
  }, [router]);

  // Cargar datos de la orden
  useEffect(() => {
    const fetchOrden = async () => {
      setLoading(true);
      setErrorCarga(null);
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("No hay sesión activa");
          router.push("/login");
          return;
        }

        // Primero verificar si la orden ya fue cobrada
        const verificacionResponse = await axios.get(`http://192.168.0.102:3001/ordenes/${ordenId}/verificar-cobro`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (verificacionResponse.data.cobrada) {
          toast.info("Esta orden ya ha sido cobrada");
          router.push("/dashboard/ordenes/gestionar");
          return;
        }

        const response = await axios.get(`http://192.168.0.102:3001/ordenes/${ordenId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setOrden(response.data);
        
        // Si la orden ya fue entregada, redirigir
        if (response.data.estado === "ENTREGADO" || response.data.estado === "COBRADA") {
          toast.info("Esta orden ya ha sido cobrada");
          router.push("/dashboard/ordenes/gestionar");
        }
      } catch (error: any) {
        console.error("Error al cargar la orden:", error);
        setErrorCarga(error.response?.data?.message || "Error al cargar la orden");
        toast.error("No se pudo cargar la información de la orden");
      } finally {
        setLoading(false);
      }
    };

    if (ordenId) {
      fetchOrden();
    }
  }, [ordenId, router]);

  // Procesar el cobro de la orden
  const procesarCobro = async () => {
    setProcesando(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No hay sesión activa");
        router.push("/login");
        return;
      }

      // Verificar primero si la orden ya ha sido cobrada
      const verificacionResponse = await axios.get(`http://192.168.0.102:3001/ordenes/${ordenId}/verificar-cobro`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (verificacionResponse.data.cobrada) {
        toast.error("Esta orden ya ha sido cobrada anteriormente");
        setTimeout(() => {
          router.push("/dashboard/ordenes/gestionar");
        }, 1500);
        return;
      }

      // Obtener ID de la caja actualmente abierta
      const cajaResponse = await axios.get("http://192.168.0.102:3001/cajas/actual", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!cajaResponse.data || !cajaResponse.data.id) {
        toast.error("No hay una caja abierta para registrar el cobro");
        return;
      }

      const cajaId = cajaResponse.data.id;

      // Realizar el cobro de la orden
      const response = await axios.post(
        `http://192.168.0.102:3001/ordenes/${ordenId}/cobrar`,
        { cajaId, metodoPago },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Orden #${ordenId} cobrada exitosamente con ${metodoPago}`);
      
      // Redirigir a la página de gestión de órdenes después de un momento
      setTimeout(() => {
        router.push("/dashboard/ordenes/gestionar");
      }, 1500);
    } catch (error: any) {
      console.error("Error al cobrar la orden:", error);
      // Manejar específicamente el error cuando la orden ya ha sido cobrada
      if (error.response?.data?.message?.includes("ya ha sido cobrada")) {
        toast.error("Esta orden ya ha sido cobrada anteriormente");
      } else {
        toast.error(error.response?.data?.message || "Error al procesar el cobro");
      }
      
      setTimeout(() => {
        router.push("/dashboard/ordenes/gestionar");
      }, 2000);
    } finally {
      setProcesando(false);
    }
  };

  // Función para calcular el total de la orden
  const calcularTotal = () => {
    if (!orden || !orden.items) return 0;
    
    return orden.items.reduce(
      (sum, item) => {
        // Imprimir detalles completos del item para depuración
        console.log('Analizando item para cobro:', {
          id: item.id,
          nombre: item.producto?.nombre,
          precio: item.producto?.precio,
          categoria: item.producto?.categoria?.nombre,
          esComplemento: item.esComplemento
        });
        
        // VERIFICACIÓN COMPLETA DE COMPLEMENTOS:
        const esComplemento = 
          // 1. Verificar si el campo esComplemento está marcado como true (nueva implementación)
          (item.esComplemento === true) ||
          // 2. Verificar si tiene un tipo de complemento específico
          (item.tipoComplemento && item.tipoComplemento !== 'NO_ES_COMPLEMENTO') ||
          // 3. Verificar si el nombre del item contiene explícitamente "complemento" (compatibilidad con datos antiguos)
          (item.producto?.nombre?.toLowerCase()?.includes('complemento')) ||
          // 4. Verificar si el precio es explícitamente 0 y el nombre incluye complemento (compatibilidad con datos antiguos)
          (item.producto?.precio === 0 && item.producto?.nombre?.toLowerCase()?.includes('complemento'));
          
        // Si es un complemento, no sumamos nada al total
        if (esComplemento) {
          console.log('✅ COMPLEMENTO DETECTADO EN COBRO:', {
            nombre: item.producto?.nombre,
            categoria: item.producto?.categoria?.nombre
          });
          return sum; // No sumamos nada al total para complementos
        }
        
        // Solo calculamos el precio para items que no son complementos
        let itemPrecio = 0;
        
        // Verificar todas las posibles estructuras para productos y combos
        if (item.combo && item.combo.nombre) {
          itemPrecio = Number(item.combo.precio);
        } else if (item.producto && item.producto.nombre) {
          itemPrecio = Number(item.producto.precio);
        } else if (item.producto?.precio !== undefined && item.producto?.precio !== null) {
          // Si el item tiene un precio directo
          itemPrecio = Number(item.producto.precio);
        }
        
        return sum + (itemPrecio * item.cantidad);
      }, 
      0
    );
  };

  // Renderizar estados de carga y error
  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <Card className="border-2 border-slate-200">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <DollarSign className="h-6 w-6" />
              Cargando información de cobro...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="text-slate-500 mt-4">Obteniendo detalles de la orden...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <Card className="border-2 border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6" />
              No se pudo cargar la orden
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-slate-700 mb-6">{errorCarga}</p>
            <Button 
              variant="outline"
              onClick={() => router.push("/dashboard/ordenes/gestionar")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Órdenes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Renderizar la página principal
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      {/* Botón para volver */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.push("/dashboard/ordenes/gestionar")}
          className="border-slate-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver a Órdenes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Detalles de la orden */}
        <Card className="col-span-3 border-2 border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Orden #{orden?.id}</CardTitle>
                  <CardDescription>
                    {orden?.mozo?.nombre ? `Mozo: ${orden.mozo.nombre}` : ""}
                  </CardDescription>
                </div>
              </div>
              <Badge className={`px-2 py-1 font-medium ${
                orden?.estado === "PENDIENTE" ? "bg-amber-100 text-amber-800" :
                orden?.estado === "EN_PREPARACION" ? "bg-blue-100 text-blue-800" :
                orden?.estado === "LISTO" ? "bg-green-100 text-green-800" :
                "bg-slate-100 text-slate-800"
              }`}>
                {orden?.estado?.replace("_", " ")}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="py-6">
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Detalles de los productos</h3>
                <div className="bg-slate-50 rounded-lg border divide-y">
                  {orden?.items.map((item) => {
                    // Determinar el nombre y precio basado en la estructura del item
                    let itemNombre = "Producto sin nombre";
                    let itemPrecio = 0;
                    
                    // Verificar todas las posibles estructuras para productos y combos
                    if (item.combo && item.combo.nombre) {
                      itemNombre = `Combo: ${item.combo.nombre}`;
                      itemPrecio = Number(item.combo.precio);
                    } else if (item.producto && item.producto.nombre) {
                      itemNombre = item.producto.nombre;
                      itemPrecio = Number(item.producto.precio);
                    }
                    
                    // VERIFICACIÓN COMPLETA DE COMPLEMENTOS:
                    const esComplemento = 
                      // 1. Verificar si el campo esComplemento está marcado como true (nueva implementación)
                      (item.esComplemento === true) ||
                      // 2. Verificar si tiene un tipo de complemento específico
                      (item.tipoComplemento && item.tipoComplemento !== 'NO_ES_COMPLEMENTO') ||
                      // 3. Verificar si es explícitamente un complemento por nombre (compatibilidad con datos antiguos)
                      (itemNombre.toLowerCase().includes('complemento')) ||
                      (item.producto?.nombre?.toLowerCase()?.includes('complemento'));
                      
                    // Determinar el tipo específico de complemento
                    const tipoBebidaParaLicor = item.tipoComplemento === 'BEBIDA_PARA_LICOR';
                    
                    // Si es un complemento, forzar el precio a 0
                    if (esComplemento) {
                      console.log('✅ COMPLEMENTO DETECTADO AL RENDERIZAR COBRO:', {
                        nombre: itemNombre,
                        precioOriginal: itemPrecio
                      });
                      itemPrecio = 0;
                    }
                    
                    return (
                      <div key={item.id} className="flex justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">
                            {item.cantidad}x {itemNombre}
                          </span>
                          {esComplemento && (
                            <Badge variant="outline" className={`text-xs ml-1 ${tipoBebidaParaLicor ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {tipoBebidaParaLicor ? 'Bebida para Licor' : 'Complemento'}
                            </Badge>
                          )}
                        </div>
                        <div className="font-semibold">
                          {esComplemento ? "$0.00" : `$${(itemPrecio * item.cantidad).toFixed(2)}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-medium">Total</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Este total excluye los complementos, que siempre tienen precio $0.00</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-xl font-bold text-green-700">
                  ${calcularTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de cobro */}
        <Card className="col-span-2 border-2 border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-200 rounded-full">
                <DollarSign className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <CardTitle>Cobrar Orden</CardTitle>
                <CardDescription>
                  Selecciona el método de pago
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="py-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-600">Método de Pago</h3>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  type="button"
                  variant={metodoPago === 'EFECTIVO' ? 'default' : 'outline'}
                  className={`flex items-center gap-2 justify-center transition-all h-12 ${
                    metodoPago === 'EFECTIVO' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'hover:bg-green-50 border-green-200 text-green-700'
                  }`}
                  onClick={() => setMetodoPago('EFECTIVO')}
                >
                  <DollarSign className="h-4 w-4" />
                  Efectivo
                </Button>
                <Button 
                  type="button"
                  variant={metodoPago === 'TARJETA' ? 'default' : 'outline'}
                  className={`flex items-center gap-2 justify-center transition-all h-12 ${
                    metodoPago === 'TARJETA' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'hover:bg-blue-50 border-blue-200 text-blue-700'
                  }`}
                  onClick={() => setMetodoPago('TARJETA')}
                >
                  <CreditCard className="h-4 w-4" />
                  Tarjeta
                </Button>
                <Button 
                  type="button"
                  variant={metodoPago === 'TRANSFERENCIA' ? 'default' : 'outline'}
                  className={`flex items-center gap-2 justify-center transition-all h-12 ${
                    metodoPago === 'TRANSFERENCIA' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'hover:bg-purple-50 border-purple-200 text-purple-700'
                  }`}
                  onClick={() => setMetodoPago('TRANSFERENCIA')}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Transferencia
                </Button>
                <Button 
                  type="button"
                  variant={metodoPago === 'OTRO' ? 'default' : 'outline'}
                  className={`flex items-center gap-2 justify-center transition-all h-12 ${
                    metodoPago === 'OTRO' 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  onClick={() => setMetodoPago('OTRO')}
                >
                  <HelpCircle className="h-4 w-4" />
                  Otro
                </Button>
              </div>
              
              <div className="mt-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Esta acción descontará el stock de los productos y registrará la venta en caja. 
                    Una vez cobrada, podrás cambiar manualmente el estado de la orden a "Entregado" desde la pantalla de gestión.
                  </p>
                </div>
                
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 h-12 text-base font-medium"
                  disabled={procesando}
                  onClick={procesarCobro}
                >
                  {procesando ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Confirmar Cobro
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}