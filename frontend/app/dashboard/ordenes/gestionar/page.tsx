"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ClipboardList,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle2,
  ChefHat,
  Store,
  TrendingUp,
  RefreshCw,
  Eye,
  ArrowRight,
  Timer,
  Utensils,
  LogOut,
  CreditCard,
  ArrowRightLeft,
  HelpCircle,
  Check,
  ChevronUp,
  ChevronDown,
  Info as InfoIcon
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrdenItem {
  id: number;
  cantidad: number;
  precio: number;
  esComplemento?: boolean;
  tipoComplemento?: 'NO_ES_COMPLEMENTO' | 'BEBIDA_PARA_LICOR' | 'OTRO_COMPLEMENTO';
  productoAsociadoId?: number;
  producto?: {
    id: number;
    nombre: string;
    precio: number;
    categoria?: {
      nombre?: string;
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
  clienteNombre: string;
  clienteTelefono?: string;
  clienteDireccion?: string;
  notas?: string;
  estado: string;
  total: number;
  createdAt: string;
  items: OrdenItem[];
}

const estadoColors = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  preparando: "bg-blue-100 text-blue-800 border-blue-200",
  listo: "bg-green-100 text-green-800 border-green-200",
  entregado: "bg-gray-100 text-gray-800 border-gray-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

const estadoIcons = {
  pendiente: Clock,
  preparando: AlertCircle,
  listo: CheckCircle,
  entregado: CheckCircle,
  cancelado: XCircle,
};

const OrderCard = ({ order, onStatusChange, userRole, socket }: { 
  order: any; 
  onStatusChange: (orderId: number, newStatus: string) => void; 
  userRole: string | null;
  socket: Socket | null;
}) => {
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userPermissions, setUserPermissions] = useState<{
    canCollectOrders: boolean;
    canManageCaja: boolean;
    permissions: {
      admin: boolean;
      cajero: boolean;
    }
  } | null>(null);
  const [ordenCobrada, setOrdenCobrada] = useState<boolean>(false);
  const router = useRouter();
  const [motivoCancelacion, setMotivoCancelacion] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Log para inspeccionar la estructura de la orden
  useEffect(() => {
    console.log('Estructura completa de la orden:', order);
    console.log('Items de la orden:', order.items);
    
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any, index: number) => {
        console.log(`Item ${index}:`, item);
        console.log(`  - esComplemento:`, item.esComplemento);
        if (item.combo) {
          console.log(`  - Combo encontrado:`, item.combo);
        } else if (item.comboId) {
          console.log(`  - ComboId encontrado:`, item.comboId);
        }
        if (item.producto) {
          console.log(`  - Producto encontrado:`, item.producto);
        } else if (item.productoId) {
          console.log(`  - ProductoId encontrado:`, item.productoId);
        }
      });
    }
  }, [order]);

  // Verificar permisos al montar el componente y si la orden ha sido cobrada
  useEffect(() => {
    const checkUserPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No hay token disponible');
          return;
        }

        const response = await axios.get('http://192.168.0.102:3001/auth/check-permissions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUserPermissions(response.data);
        console.log('Permisos del usuario:', response.data);
      } catch (error) {
        console.error('Error al verificar permisos:', error);
      }
    };

    // Función para verificar si la orden ha sido cobrada
    const checkOrdenCobrada = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Verificamos si la orden tiene un movimiento de caja asociado
        const response = await axios.get(`http://192.168.0.102:3001/ordenes/${order.id}/verificar-cobro`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrdenCobrada(response.data.cobrada);
        console.log(`Orden #${order.id} cobrada:`, response.data.cobrada);
      } catch (error) {
        console.error('Error al verificar si la orden está cobrada:', error);
        // Si hay error en la consulta, asumimos que no está cobrada
        setOrdenCobrada(false);
      }
    };

    checkUserPermissions();
    checkOrdenCobrada();
  }, [order.id]);
  
  // Efecto para escuchar eventos de WebSocket relacionados con cobro de órdenes
  useEffect(() => {
    // Si no hay socket, no hacer nada
    if (!socket) return;
    
    // Función que se ejecuta cuando se recibe un evento de orden cobrada
    const handleOrdenCobrada = (data: any) => {
      console.log('Evento orden_cobrada recibido:', data);
      
      // Si la orden cobrada es la misma que esta tarjeta, actualizar el estado
      if (data.ordenId === order.id) {
        console.log(`¡Orden #${order.id} cobrada! Actualizando estado...`);
        setOrdenCobrada(true);
        
        // Notificar visualmente al usuario
        toast.success(`¡Orden #${order.id} cobrada y lista para continuar!`, {
          duration: 5000,
          id: `orden-cobrada-${order.id}`,
        });
        
        // Actualizar visualmente la tarjeta
        setIsUpdating(true);
        setTimeout(() => setIsUpdating(false), 2000);
      }
    };
    
    // Registrar el evento
    socket.on('orden_cobrada', handleOrdenCobrada);
    
    // Limpiar el evento al desmontar
    return () => {
      socket.off('orden_cobrada', handleOrdenCobrada);
    };
  }, [socket, order.id]);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    setIsUpdating(true);
    try {
      await onStatusChange(order.id, newStatus);
      // No mostrar toast aquí, se maneja en la función principal
    } catch (error) {
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
      // Mantener el estado de actualización por un momento para mostrar el efecto visual
      setTimeout(() => setIsUpdating(false), 2000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "EN_PREPARACION":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "LISTO":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      case "ENTREGADO":
        return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
      case "COBRADA":
        return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
      case "CANCELADA":
        return "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDIENTE":
        return "EN_PREPARACION";
      case "EN_PREPARACION":
        return "LISTO";
      case "LISTO":
        return "ENTREGADO";
      case "COBRADA":
        return "EN_PREPARACION"; // Si está cobrada, iniciar el flujo normal desde EN_PREPARACION
      default:
        return null;
    }
  };

  // Función para obtener texto del botón según el estado
  const getActionButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case "PENDIENTE":
        return "Comenzar preparación";
      case "EN_PREPARACION":
        return "Marcar como listo";
      case "LISTO":
        return "Entregar orden";
      case "COBRADA":
        return "Comenzar preparación";
      default:
        return "Cambiar estado";
    }
  };

  const handleCobrarClick = () => {
    // Redirigir a la página de cobro en lugar de mostrar el diálogo
    router.push(`/dashboard/ordenes/cobrar/${order.id}`);
  };

  const handleCancelarClick = () => {
    setDialogOpen(true);
  };

  const procesarCancelacion = async () => {
    if (!motivoCancelacion.trim()) {
      toast.error('Debe ingresar un motivo para la cancelación');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Llamar al endpoint de cancelación
      const response = await axios.post(
        `http://192.168.0.102:3001/ordenes/cancelar/${order.id}`,
        {
          motivo: motivoCancelacion,
          revertirPago: true // Siempre revertir el pago para órdenes cobradas
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Orden cancelada correctamente');
      setDialogOpen(false);
      
      // Notificar cambio para actualizar la interfaz
      if (socket?.connected) {
        socket.emit('actualizar_estado_manual', {
          ordenId: order.id,
          nuevoEstado: 'CANCELADA',
          actualizadoPor: userRole,
          timestamp: new Date().toISOString()
        });
      }
      
      // Recargar datos
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error al cancelar orden:', error);
      toast.error(error.response?.data?.message || 'Error al cancelar la orden');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar los items según el rol del usuario y manejar tanto productos como combos
  const filteredItems = userRole === 'BARTENDER'
    ? (order._filtroBartender
       ? order.items
       : order.items.filter((item: any) => 
          item.producto?.categoria && 
          item.producto?.categoria.nombre && 
          item.producto?.categoria.nombre.toLowerCase() === 'tragos'
         ))
    : order.items;

  // Calcular el total basado en los items filtrados
  const totalItems = filteredItems.reduce(
    (sum: number, item: any) => {
      // Imprimir detalles completos del item para depuración
      console.log('Analizando item para calcular total:', {
        id: item.id,
        nombre: item.nombre,
        productoNombre: item.producto?.nombre,
        precio: item.precio,
        productoPrecio: item.producto?.precio,
        categoria: item.producto?.categoria?.nombre,
        complemento: item.nombre?.toLowerCase().includes('complemento') || item.producto?.nombre?.toLowerCase().includes('complemento')
      });
      
      let itemPrecio = 0;
      
      // VERIFICACIÓN COMPLETA DE COMPLEMENTOS:
      const esComplemento = 
        // 1. Verificar si el campo esComplemento está marcado como true (nueva implementación)
        (item.esComplemento === true) ||
        // 2. Verificar si tiene un tipo de complemento específico
        (item.tipoComplemento && item.tipoComplemento !== 'NO_ES_COMPLEMENTO') ||
        // 3. Verificar si es explícitamente un complemento por nombre (compatibilidad con datos antiguos)
        (item.nombre?.toLowerCase()?.includes('complemento')) ||
        (item.producto?.nombre?.toLowerCase()?.includes('complemento'));
      
      // Si es un complemento, no sumamos nada al total
      if (esComplemento) {
        console.log('✅ COMPLEMENTO DETECTADO:', {
          nombre: item.nombre || item.producto?.nombre,
          razon: 'Verificación completa de complementos',
          precioOriginal: itemPrecio
        });
        return sum; // No sumamos nada al total para complementos
      }
      
      // Solo calculamos el precio para items que no son complementos
      // Verificar todas las posibles estructuras para combos y productos
      if (item.combo && item.combo.nombre) {
        itemPrecio = Number(item.combo.precio);
      } else if (item.comboId && item.comboNombre) {
        itemPrecio = Number(item.precio || 0);
      } else if (item.producto && item.producto.nombre) {
        itemPrecio = Number(item.producto.precio);
      } else if (item.productoId && item.productoNombre) {
        itemPrecio = Number(item.precio || 0);
      } else if (item.nombre) {
        // Si el item mismo tiene un nombre directo
        itemPrecio = Number(item.precio || 0);
      }
      
      return sum + (itemPrecio * item.cantidad);
    }, 
    0
  );

  const nextStatus = getNextStatus(order.estado);

  // Verificar si el usuario es un mozo
  const isMozo = userRole === 'MOZO';

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-200">
      <div className={`h-2 w-full ${getStatusColor(order.estado)}`} />
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">Orden #{order.id}</h3>
            </div>
            {order.mozo && (
              <p className="text-sm text-gray-500">{order.mozo.nombre}</p>
            )}
          </div>
          <Badge className={`${getStatusColor(order.estado)}`}>
            {order.estado.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Lista de productos y combos */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
          {filteredItems.slice(0, 4).map((item: any, index: number) => {
            // Determinar el nombre y precio basado en la estructura del item
            let itemNombre = "Producto sin nombre";
            let itemPrecio = 0;
            
            // Verificar todas las posibles estructuras para combos y productos
            if (item.combo && item.combo.nombre) {
              itemNombre = `Combo: ${item.combo.nombre}`;
              itemPrecio = Number(item.combo.precio);
            } else if (item.comboId && item.comboNombre) {
              itemNombre = `Combo: ${item.comboNombre}`;
              itemPrecio = Number(item.precio || 0);
            } else if (item.producto && item.producto.nombre) {
              itemNombre = item.producto.nombre;
              itemPrecio = Number(item.producto.precio);
            } else if (item.productoId && item.productoNombre) {
              itemNombre = item.productoNombre;
              itemPrecio = Number(item.precio || 0);
            } else if (item.nombre) {
              // Si el item mismo tiene un nombre directo
              itemNombre = item.esCombo ? `Combo: ${item.nombre}` : item.nombre;
              itemPrecio = Number(item.precio || 0);
            }
            
            // VERIFICACIÓN COMPLETA DE COMPLEMENTOS:
            const esComplemento = 
              // 1. Verificar si el campo esComplemento está marcado como true (nueva implementación)
              (item.esComplemento === true) ||
              // 2. Verificar si tiene un tipo de complemento específico
              (item.tipoComplemento && item.tipoComplemento !== 'NO_ES_COMPLEMENTO') ||
              // 3. Verificar si es explícitamente un complemento por nombre (compatibilidad con datos antiguos)
              (itemNombre.toLowerCase().includes('complemento')) ||
              (item.nombre?.toLowerCase()?.includes('complemento')) ||
              (item.producto?.nombre?.toLowerCase()?.includes('complemento'));
              
            // Determinar el tipo específico de complemento
            const tipoBebidaParaLicor = item.tipoComplemento === 'BEBIDA_PARA_LICOR';
            
            // Ya no usamos la categoría "bebidas" o palabras clave para determinar si es complemento
            // porque ahora tenemos un campo específico para eso
            
            // Si es un complemento, SIEMPRE forzar el precio a 0
            if (esComplemento) {
              console.log('✅ COMPLEMENTO DETECTADO AL RENDERIZAR:', {
                nombre: itemNombre,
                precioOriginal: itemPrecio,
                esComplementoFlag: item.esComplemento,
                nombreContainsComplemento: itemNombre.toLowerCase().includes('complemento'),
                item: item
              });
              itemPrecio = 0;
            } else {
              console.log('❌ NO ES COMPLEMENTO:', {
                nombre: itemNombre,
                precio: itemPrecio,
                esComplementoFlag: item.esComplemento,
                item: item
              });
            }
            
            // Asegurar que el subtotal sea 0 para complementos
            const subtotal = esComplemento ? 0 : itemPrecio * item.cantidad;
            
            return (
              <div key={`${order.id}-item-${item.id || index}`} className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {item.cantidad}x {itemNombre}
                  </span>
                  {esComplemento && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 ml-1">
                      Complemento
                    </Badge>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {esComplemento ? "$0.00" : `$${subtotal.toFixed(2)}`}
                </span>
              </div>
            );
          })}
          {filteredItems.length > 4 && (
            <p className="text-sm text-gray-500 text-center pt-1">
              + {filteredItems.length - 4} productos más
            </p>
          )}
        </div>

        {/* Total y acciones */}
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-lg font-bold text-gray-900">
                Total: ${totalItems.toFixed(2)}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Este total excluye los complementos, que siempre tienen precio $0.00</p>
                </TooltipContent>
              </Tooltip>
            </div>
            {ordenCobrada && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Cobrada
              </Badge>
            )}
          </div>
          
          {/* Botones de acción */}
          {!isMozo && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {/* Botón para cobrar orden */}
              {userPermissions?.canCollectOrders && !ordenCobrada && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                  onClick={handleCobrarClick}
                  disabled={loading}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Cobrar
                </Button>
              )}

              {/* Botón para cancelar una orden cobrada */}
              {(userRole === 'ADMIN' || userRole === 'CAJERO') && order.estado === 'COBRADA' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={handleCancelarClick}
                >
                  <XCircle className="h-4 w-4 mr-1" /> Cancelar
                </Button>
              )}

              {/* Botón para cambiar al próximo estado */}
              {nextStatus && ordenCobrada && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange(nextStatus)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : nextStatus === "EN_PREPARACION" ? (
                    <ChefHat className="h-4 w-4 mr-1" />
                  ) : nextStatus === "LISTO" ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  {getActionButtonText(order.estado)}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Botón y panel de depuración */}
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-slate-200 text-slate-600 text-xs"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? "Ocultar detalles técnicos" : "Mostrar detalles técnicos"}
          </Button>
          
          {showDebug && (
            <div className="mt-2 bg-slate-50 p-2 rounded-md text-xs overflow-auto max-h-60">
              <h4 className="font-bold mb-1">Datos de items:</h4>
              {filteredItems.map((item: any, index: number) => (
                <div key={`debug-${item.id || index}`} className="mb-2 border-b pb-1">
                  <div><strong>ID:</strong> {item.id}</div>
                  <div><strong>Nombre:</strong> {item.nombre}</div>
                  <div><strong>Precio directo:</strong> {item.precio !== undefined ? item.precio : 'No definido'}</div>
                  <div><strong>Cantidad:</strong> {item.cantidad}</div>
                  {item.producto && (
                    <div className="pl-2 border-l-2 border-blue-300 mt-1">
                      <div><strong>Producto ID:</strong> {item.producto.id}</div>
                      <div><strong>Producto nombre:</strong> {item.producto.nombre}</div>
                      <div><strong>Producto precio:</strong> {item.producto.precio}</div>
                      <div><strong>Categoría:</strong> {item.producto?.categoria?.nombre || 'Sin categoría'}</div>
                    </div>
                  )}
                  {item.combo && (
                    <div className="pl-2 border-l-2 border-green-300 mt-1">
                      <div><strong>Combo ID:</strong> {item.combo.id}</div>
                      <div><strong>Combo nombre:</strong> {item.combo.nombre}</div>
                      <div><strong>Combo precio:</strong> {item.combo.precio}</div>
                    </div>
                  )}
                  <div className="text-right mt-1">
                    <span className={item.nombre?.toLowerCase().includes('complemento') ? 
                      'text-blue-500 font-bold' : 'text-gray-500'}>
                      {item.nombre?.toLowerCase().includes('complemento') ? 
                        '✓ Es complemento' : '✗ No es complemento'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Diálogo de Cancelación */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Orden #{order.id}</DialogTitle>
            <DialogDescription>
              Esta acción cancelará la orden, reingresará los productos al inventario y registrará los movimientos correspondientes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de la cancelación</Label>
              <Textarea
                id="motivo"
                placeholder="Ingrese el motivo de la cancelación"
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={procesarCancelacion}
              disabled={loading || !motivoCancelacion.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Cancelación'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// Añadir la función de debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

export default function ManageOrdersPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ordenesMap, setOrdenesMap] = useState<Record<number, Orden>>({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Añadir función fetchOrdenes con debounce
  const debouncedFetchOrdenes = useCallback(
    debounce((rol?: string) => {
      fetchOrdenes(rol);
    }, 1000),
    []
  );

  // Función para actualizar las órdenes sin duplicados
  const actualizarOrdenesUnicas = (nuevasOrdenes: Orden[]) => {
    const nuevoMapa: Record<number, Orden> = { ...ordenesMap };
    
    nuevasOrdenes.forEach((orden: Orden) => {
      // Solo incluir órdenes con ID válido
      if (orden.id) {
        nuevoMapa[orden.id] = orden;
      }
    });
    
    setOrdenesMap(nuevoMapa);
    // Convertir el mapa a array para el estado
    const ordenesArray = Object.values(nuevoMapa);
    setOrdenes(ordenesArray);
    
    console.log(`Actualizadas ${nuevasOrdenes.length} órdenes. Total único: ${ordenesArray.length}`);
    // Actualizar timestamp de última actualización
    setLastUpdate(new Date());
  };

  // Función para agregar una orden única
  const agregarOrdenUnica = (nuevaOrden: Orden) => {
    console.log(`Intentando agregar orden #${nuevaOrden.id}`, nuevaOrden);
    
    // Verificar si la orden ya existe
    if (ordenesMap[nuevaOrden.id]) {
      console.log(`Orden #${nuevaOrden.id} ya existe, actualizando`);
    }
    
    setOrdenesMap(prev => {
      const nuevoMapa = { ...prev };
      nuevoMapa[nuevaOrden.id] = nuevaOrden;
      return nuevoMapa;
    });
    
    // Actualizar el array de órdenes basado en el nuevo mapa
    setOrdenes(prev => {
      // Filtrar la orden existente si ya está en el array
      const filtrado = prev.filter(o => o.id !== nuevaOrden.id);
      return [nuevaOrden, ...filtrado];
    });
  };

  // Función para obtener órdenes - optimizada para ser más robusta
  const fetchOrdenes = async (rol?: string) => {
    console.log('=== INICIANDO FETCHORDENES ===');
    console.log('Rol recibido:', rol);
    console.log('UserRole del estado:', userRole);
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No hay token disponible");
        setOrdenes([]);
        setOrdenesMap({});
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      
      // Si el usuario es BARTENDER, forzar siempre ese rol independientemente del parámetro
      let rolToUse = userRole === 'BARTENDER' ? 'BARTENDER' : rol;
      
      // Si aún no tenemos rol, intentar obtenerlo del token
      if (!rolToUse) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          rolToUse = payload.rol;
          console.log('Rol obtenido del token:', rolToUse);
          
          // Si obtenemos BARTENDER del token, usarlo siempre
          if (rolToUse === 'BARTENDER') {
            rolToUse = 'BARTENDER';
            // Actualizar el estado
            if (!userRole) {
              setUserRole('BARTENDER');
            }
          }
        } catch (error) {
          console.error('Error al decodificar el token para obtener el rol:', error);
        }
      }

      console.log('Rol final a utilizar para consulta:', rolToUse);
      
      // Construir la URL con parámetros
      let url = "http://192.168.0.102:3001/ordenes";
      const params = new URLSearchParams();
      
      // IMPORTANTE: Para BARTENDER, siempre añadir estos parámetros
      if (rolToUse === 'BARTENDER' || userRole === 'BARTENDER') {
        console.log('⚠️ APLICANDO FILTRO ESPECÍFICO PARA BARTENDER');
        params.append('rol', 'BARTENDER');
        params.append('filtrar_por_rol', 'true');
      }
      
      // Añadir parámetro para mostrar órdenes entregadas
      if (showCompleted) {
        params.append('includeEntregado', 'true');
      }
      
      // Añadir los parámetros a la URL si hay alguno
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
        
      console.log('Consultando endpoint:', url);
      console.log('Headers:', headers);
      
      const res = await axios.get(url, { headers });
      console.log('Respuesta del servidor:', res.status);
      
      let orders = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      
      console.log(`Recibidas ${orders.length} órdenes del servidor`);
      
      if (orders.length === 0) {
        console.log('⚠️ NO SE RECIBIERON ÓRDENES');
      } else {
        console.log('Primera orden recibida:', orders[0]);
      }
      
      // Si el usuario es BARTENDER, verificar que las órdenes tengan items
      if (userRole === 'BARTENDER' || rolToUse === 'BARTENDER') {
        const ordenesFiltradas = orders.filter((orden: any) => 
          orden.items && orden.items.length > 0
        );
        
        console.log(`Filtradas ${orders.length - ordenesFiltradas.length} órdenes sin items para BARTENDER`);
        orders = ordenesFiltradas;
      }
      
      // Actualizar el estado de órdenes directamente
      setOrdenesMap(prev => {
        const nuevoMapa: Record<number, Orden> = {};
        
        // Agregar todas las órdenes nuevas al mapa
        orders.forEach((orden: Orden) => {
          if (orden.id) {
            nuevoMapa[orden.id] = orden;
          }
        });
        
        return nuevoMapa;
      });
      
      // Convertir las órdenes a array después de actualizar el mapa
      setOrdenes(orders);
      
      // Actualizar timestamp de última actualización
      setLastUpdate(new Date());
      
      console.log('Órdenes actualizadas exitosamente');
      console.log('=== FETCH ORDENES COMPLETADO ===');
    } catch (err) {
      console.error("Error al obtener órdenes:", err);
      if (axios.isAxiosError(err)) {
        console.error("Detalles del error:", err.response?.data);
        console.error("Estado HTTP:", err.response?.status);
      }
      toast.error("Error al actualizar órdenes");
    } finally {
      setLoading(false);
    }
  };

  // Obtener el rol del usuario y luego las órdenes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const rol = payload.rol;
        setUserRole(rol);
        console.log('Rol de usuario establecido:', rol);
        
        // Si el rol es BARTENDER, forzar ese rol en la llamada
        if (rol === 'BARTENDER') {
          console.log('Usuario es BARTENDER, forzando el rol en la consulta');
          fetchOrdenes('BARTENDER');
        } else {
          // Para otros roles, usar el rol del usuario
          fetchOrdenes(rol);
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Intentar cargar órdenes sin rol específico
        fetchOrdenes();
      }
    }
  }, []);

  // Modificar useEffect con la configuración de socket
  useEffect(() => {
    // Cargar órdenes iniciales
    fetchOrdenes(userRole || undefined);

    // Configuración del socket mejorada
    const token = localStorage.getItem("token") || '';
    const socketInstance = io('http://192.168.0.102:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: true,
      query: { 
        token: token,
        role: userRole || 'UNKNOWN',
        page: 'gestionar_ordenes' 
      },
      extraHeaders: {
        "X-User-Role": userRole || "UNKNOWN",
        "Authorization": `Bearer ${token}`
      }
    });

    // Eventos de conexión
    socketInstance.on('connect', () => {
      console.log('Conectado al servidor WebSocket - ID:', socketInstance.id);
      
      // Registrar rol inmediatamente después de conectar
      socketInstance.emit('registrarRol', { 
        rol: userRole || 'UNKNOWN', 
        token: token,
        info: { pagina: 'gestionar_ordenes' }
      });
      
      // Solicitar datos actualizados
      fetchOrdenes(userRole || undefined);
      
      // Notificar al usuario
      toast.success('Conectado al servidor en tiempo real');
    });

    // Eventos de actualización con mejores logs
    socketInstance.on('nueva_orden', (nuevaOrden) => {
      console.log('🔔 NUEVA ORDEN RECIBIDA:', nuevaOrden);
      
      
      
      toast.success(`Nueva orden #${nuevaOrden.id} recibida`, {
        duration: 5000,
        id: `nueva-orden-${nuevaOrden.id}`
      });
      
      // Actualizar datos inmediatamente
      fetchOrdenes(userRole || undefined);
    });

    // RESTAURADO: Evento específico para bartender (nueva_orden_tragos)
    socketInstance.on('nueva_orden_tragos', (nuevaOrdenTragos) => {
      console.log('🍹 NUEVA ORDEN DE TRAGOS RECIBIDA:', nuevaOrdenTragos);
      
      // Verificar si el usuario es bartender antes de procesar
      if (userRole === 'BARTENDER') {
        // Notificación sonora con múltiples intentos
        
        
        // Notificación visual persistente
        toast.success(`🍹 NUEVA ORDEN #${nuevaOrdenTragos.id} - ${nuevaOrdenTragos.items?.length || 0} TRAGOS`, {
          duration: 10000, // 10 segundos
          id: `nueva-orden-tragos-${nuevaOrdenTragos.id}`,
          style: { backgroundColor: '#6366F1', color: 'white', fontWeight: 'bold' }
        });
        
        // Notificación adicional para asegurar que se vea
        setTimeout(() => {
          toast.info(`Tienes una orden de tragos pendiente #${nuevaOrdenTragos.id}`, {
            duration: 5000,
            id: `recordatorio-orden-${nuevaOrdenTragos.id}`
          });
        }, 15000); // 15 segundos después
      }
      
      // Actualizar datos inmediatamente
      fetchOrdenes(userRole || undefined);
    });
    
    // NUEVO: Alerta adicional para bartender
    socketInstance.on('bartender_alerta', (data) => {
      console.log('⚠️ ALERTA BARTENDER:', data);
      
      if (userRole === 'BARTENDER') {
        // Reproducir sonido de alerta
        
        
        // Mostrar notificación destacada
        toast.error(`⚠️ ${data.mensaje}`, {
          duration: 10000,
          id: `bartender-alerta-${data.ordenId}`,
          style: { fontWeight: 'bold' }
        });
        
        // Actualizar datos
        fetchOrdenes('BARTENDER');
      }
    });

    socketInstance.on('orden_actualizada', (ordenActualizada) => {
      console.log('🔄 ORDEN ACTUALIZADA:', ordenActualizada);
      toast.info(`Orden #${ordenActualizada.id} actualizada a ${ordenActualizada.estado}`);
      
      // Actualizar datos inmediatamente
      fetchOrdenes(userRole || undefined);
    });
    
    socketInstance.on('orden_cobrada', (data) => {
      console.log('💰 ORDEN COBRADA:', data);
      toast.success(`Orden #${data.ordenId} cobrada con éxito`);
      
      // Actualizar datos inmediatamente
      fetchOrdenes(userRole || undefined);
    });

    // Eventos adicionales
    socketInstance.on('actualizacion_manual', (data) => {
      console.log('👋 ACTUALIZACIÓN MANUAL:', data);
      fetchOrdenes(userRole || undefined);
    });

    socketInstance.on('refresco_solicitado', (data) => {
      console.log('🔄 REFRESCO SOLICITADO:', data);
      fetchOrdenes(userRole || undefined);
    });

    // Sistema de reconexión mejorado
    socketInstance.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
      toast.error('Error de conexión con el servidor');
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Desconectado del servidor:', reason);
      toast.error('Desconectado del servidor en tiempo real');
      
      // Intentar reconectar inmediatamente
      setTimeout(() => {
        if (!socketInstance.connected) {
          console.log('Intentando reconexión manual...');
          socketInstance.connect();
        }
      }, 2000);
    });

    // Ping periódico con datos de usuario
    const pingInterval = setInterval(() => {
      if (socketInstance.connected) {
        socketInstance.emit('ping', { 
          rol: userRole,
          timestamp: new Date().toISOString(),
          pagina: 'gestionar_ordenes'
        });
      } else {
        console.log('Socket desconectado, intentando reconectar...');
        socketInstance.connect();
      }
    }, 15000); // Cada 15 segundos

    setSocket(socketInstance);

    return () => {
      clearInterval(pingInterval);
      
      if (socketInstance) {
        console.log('Limpiando conexión WebSocket...');
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('disconnect');
        socketInstance.off('nueva_orden');
        socketInstance.off('orden_actualizada');
        socketInstance.off('orden_cobrada');
        socketInstance.off('actualizacion_manual');
        socketInstance.off('refresco_solicitado');
        socketInstance.disconnect();
      }
    };
  }, [userRole]);

  // Filtrar y ordenar órdenes
  const filteredAndSortedOrdenes = ordenes
    .filter(orden => {
      // Siempre ocultar órdenes ENTREGADAS (sin importar showCompleted)
      if (orden.estado === "ENTREGADO") {
        return false;
      }
      
      const matchesSearch = orden.id.toString().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || orden.estado === filterStatus;

      // Si es BARTENDER, solo mostrar órdenes con productos de la categoría Tragos
      if (userRole === 'BARTENDER') {
        // Las órdenes ya vienen filtradas del backend, solo aplicamos filtros adicionales
        return matchesSearch && matchesStatus;
      }

      // Para otros roles, aplicar filtros de búsqueda y estado
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "total-high":
          return b.total - a.total;
        case "total-low":
          return a.total - b.total;
        default:
          return 0;
      }
    });

  // Estadísticas
  const stats = {
    total: ordenes.filter(o => (showCompleted || o.estado !== "ENTREGADO") && o.estado !== "CANCELADA").length,
    pendiente: ordenes.filter(o => o.estado === "PENDIENTE").length,
    preparando: ordenes.filter(o => o.estado === "EN_PREPARACION").length,
    listo: ordenes.filter(o => o.estado === "LISTO").length,
    entregado: ordenes.filter(o => o.estado === "ENTREGADO").length,
    cancelada: ordenes.filter(o => o.estado === "CANCELADA").length,
    totalVentas: ordenes.reduce((sum, orden) => {
      // Si es bartender, solo sumar los items de la categoría tragos
      if (userRole === 'BARTENDER') {
        const tragoItems = orden.items.filter(item => 
          item.producto?.categoria && 
          item.producto?.categoria.nombre && 
          item.producto?.categoria.nombre.toLowerCase() === 'tragos'
        );
        
        const tragoTotal = tragoItems.reduce((itemSum: number, item: any) => {
          let precio = 0;
          
          // Determinar el precio según la estructura del item
          if (item.producto && item.producto.precio) {
            precio = Number(item.producto.precio);
          } else if (item.precio) {
            precio = Number(item.precio);
          }
          
          const cantidad = Number(item.cantidad);
          return itemSum + (precio * cantidad);
        }, 0);
        
        return sum + tragoTotal;
      } else {
        // Para otros roles, sumar todos los items (productos y combos)
        const ordenTotal = orden.items.reduce((itemSum: number, item: any) => {
          let precio = 0;
          
          // Verificar todas las posibles estructuras para combos y productos
          if (item.combo && item.combo.precio) {
            precio = Number(item.combo.precio);
          } else if (item.comboId && item.precio) {
            precio = Number(item.precio);
          } else if (item.producto && item.producto.precio) {
            precio = Number(item.producto.precio);
          } else if (item.productoId && item.precio) {
            precio = Number(item.precio);
          } else if (item.precio) {
            // Si el item mismo tiene un precio directo
            precio = Number(item.precio);
          }
          
          const cantidad = Number(item.cantidad);
          return itemSum + (precio * cantidad);
        }, 0);
        
        return sum + ordenTotal;
      }
    }, 0),
  };

  // Función para calcular el total por item
  const calculateItemTotal = (item: OrdenItem) => {
    console.log('Item recibido:', item); // Log para depuración
    let precio = 0;
    if (item.combo) {
      precio = Number(item.combo.precio);
    } else if (item.producto) {
      precio = Number(item.producto.precio);
    } else {
      precio = Number(item.precio);
    }
    const cantidad = item.cantidad;
    console.log('Precio:', precio, 'Cantidad:', cantidad); // Log para depuración
    return precio * cantidad;
  };

  // Función auxiliar para formatear precios
  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return '0.00';
    // Asegurarnos de que el precio sea un número
    const numPrice = Number(price);
    if (isNaN(numPrice)) return '0.00';
    return numPrice.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getStatusIcon = (estado: string) => {
    const IconComponent = estadoIcons[estado as keyof typeof estadoIcons] || Clock;
    return <IconComponent className="h-4 w-4" />;
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
    toast.success('Sesión cerrada correctamente');
  };

  // Cambiar estado de orden
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setLoading(true);
    
    // Mostrar indicador visual de que se está procesando la actualización
    toast.loading(`Actualizando orden #${orderId} a ${newStatus}...`);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay sesión activa');
        router.push('/login');
        return;
      }

      console.log('Actualizando estado:', { orderId, newStatus, token, userRole });

      // Llamar al endpoint de actualización de estado
      console.log(`Llamando al endpoint /ordenes/${orderId}/estado con estado=${newStatus}`);
      const response = await axios.patch(
        `http://192.168.0.102:3001/ordenes/${orderId}/estado`,
        { estado: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-User-Role': userRole || 'UNKNOWN' // Incluir rol en los headers
          }
        }
      );

      console.log('Respuesta de actualización:', response.data);
      
      // Cerrar el toast de carga
      toast.dismiss();
      
      // Si llegamos aquí, la actualización fue exitosa
      toast.success(`Estado actualizado a ${newStatus}`);

      // Notificar manualmente el cambio vía WebSocket como respaldo adicional
      if (socket?.connected) {
        console.log('Emitiendo evento manual de actualización desde cliente');
        
        // Evento para notificar a todos sobre el cambio
        socket.emit('actualizar_estado_manual', {
          ordenId: orderId,
          nuevoEstado: newStatus,
          actualizadoPor: userRole,
          timestamp: new Date().toISOString()
        });
        
        // Solicitar explícitamente un refresco global para todos los clientes
        console.log('Solicitando refresco global');
        socket.emit('solicitar_refresco_global', {
          mensaje: `${userRole} actualizó orden #${orderId} a ${newStatus}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Actualizar datos localmente después de la actualización exitosa
      fetchOrdenes(userRole || undefined);
      
    } catch (error: any) {
      // Cerrar el toast de carga
      toast.dismiss();
      
      console.error('Error al actualizar estado:', error);
      
      // Si hay un error, intentamos revertir la actualización local
      fetchOrdenes(userRole || undefined);
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            router.push('/login');
            break;
          case 403:
            toast.error('No tienes permiso para actualizar el estado de la orden.');
            break;
          case 408:
            toast.error('La solicitud tardó demasiado tiempo. Verifica tu conexión.');
            break;
          case 500:
            toast.error('Error en el servidor. Intenta nuevamente más tarde.');
            break;
          default:
            toast.error(error.response.data?.message || 'Error al actualizar el estado');
        }
      } else if (error.code === 'ECONNABORTED') {
        toast.error('La solicitud tardó demasiado tiempo. Verifica tu conexión.');
      } else {
        toast.error('Error de conexión al actualizar el estado. Verifica tu red.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para renderizar la interfaz según el rol
  const renderInterfaz = () => {
    const titulo = userRole === 'BARTENDER' ? 'Panel de Bartender' : 'Órdenes Activas';
    
    // Filtrar y ordenar órdenes - excluir ENTREGADAS y CANCELADA
    const ordenesActivas = ordenes
      .filter(orden => orden.estado !== 'ENTREGADO' && orden.estado !== 'CANCELADA')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">{titulo}</h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => fetchOrdenes(userRole || undefined)} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Actualizar
            </Button>
            {userRole !== 'MOZO' && (
              <Button 
                onClick={handleLogout} 
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Salir
              </Button>
            )}
          </div>
        </div>

        {/* Orders Grid */}
        {ordenesActivas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-120px)]">
            <ClipboardList className="h-16 w-16 text-slate-300 mb-4" />
            <h3 className="text-xl font-medium text-slate-600">No hay órdenes pendientes</h3>
            <p className="text-slate-500 mt-2">Las nuevas órdenes aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {ordenesActivas.map((orden) => (
              <OrderCard
                key={orden.id}
                order={orden}
                onStatusChange={handleStatusChange}
                userRole={userRole}
                socket={socket}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar la interfaz común para todos los roles
  return renderInterfaz();
}