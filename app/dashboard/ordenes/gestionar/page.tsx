"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

interface OrdenItem {
  id: number;
  cantidad: number;
  precio: number;
  producto: {
    id: number;
    nombre: string;
    precio: number;
    categoria?: {
      nombre?: string;
    };
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

const OrderCard = ({ order, onStatusChange }: { order: any; onStatusChange: (orderId: number, newStatus: string) => void }) => {
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      await axios.patch(`http://localhost:3001/ordenes/${order.id}`,
        { estado: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      onStatusChange(order.id, newStatus);
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (error) {
      toast.error("Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDIENTE":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "EN_PREPARACION":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LISTO":
        return "bg-green-100 text-green-800 border-green-200";
      case "ENTREGADO":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
      default:
        return null;
    }
  };

  const nextStatus = getNextStatus(order.estado);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Orden #{order.id}</h3>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.estado)}`}>
          {order.estado.replace("_", " ")}
        </span>
      </div>

      <div className="space-y-2 mb-4">
        {order.items.map((item: any) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="font-medium">{item.cantidad}x {item.producto.nombre}</span>
            <span className="text-gray-600">${item.producto.precio * item.cantidad}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-lg font-bold">
          Total: ${order.items.reduce((sum: number, item: any) => sum + (item.producto.precio * item.cantidad), 0)}
        </div>
        {nextStatus && (
          <Button
            onClick={() => handleStatusChange(nextStatus)}
            disabled={loading}
            className="ml-4"
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {nextStatus === "EN_PREPARACION" && <Clock className="h-4 w-4 mr-2" />}
                {nextStatus === "LISTO" && <CheckCircle2 className="h-4 w-4 mr-2" />}
                {nextStatus === "ENTREGADO" && <CheckCircle2 className="h-4 w-4 mr-2" />}
                {nextStatus.replace("_", " ")}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default function ManageOrdersPage() {
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Obtener el rol del usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.rol);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }, []);

  // Configuración del WebSocket
  useEffect(() => {
    // Crear conexión Socket.IO
    const socketInstance = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    // Manejar eventos de conexión
    socketInstance.on('connect', () => {
      console.log('Conectado al servidor WebSocket');
      toast.success('Conectado al servidor en tiempo real');

      // Verificar la conexión
      socketInstance.emit('checkConnection');
    });

    socketInstance.on('connectionStatus', (data) => {
      console.log('Estado de la conexión:', data);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Error de conexión:', error);
      toast.error('Error de conexión con el servidor');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Desconectado del servidor WebSocket:', reason);
      toast.error('Desconectado del servidor en tiempo real');

      // Intentar reconectar si no fue una desconexión intencional
      if (reason !== 'io client disconnect') {
        socketInstance.connect();
      }
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Reconectado después de', attemptNumber, 'intentos');
      toast.success('Reconectado al servidor en tiempo real');
    });

    socketInstance.on('reconnect_error', (error) => {
      console.error('Error al reconectar:', error);
      toast.error('Error al reconectar con el servidor');
    });

    // Escuchar eventos de actualización de estado
    socketInstance.on('actualizacionEstado', (ordenActualizada) => {
      console.log('Orden actualizada recibida:', ordenActualizada);

      // Si es bartender, ignorar este evento y usar el específico
      if (userRole !== 'BARTENDER') {
        setOrdenes(prevOrdenes =>
          prevOrdenes.map(orden =>
            orden.id === ordenActualizada.id ? ordenActualizada : orden
          )
        );
        toast.info(`Orden #${ordenActualizada.id} actualizada a ${ordenActualizada.estado}`);
      }
    });

    // Evento específico para bartenders con filtro aplicado
    socketInstance.on('actualizacionEstadoBartender', (ordenFiltrada) => {
      console.log('Orden filtrada para bartender recibida:', ordenFiltrada);

      if (userRole === 'BARTENDER') {
        setOrdenes(prevOrdenes =>
          prevOrdenes.map(orden =>
            orden.id === ordenFiltrada.id ? ordenFiltrada : orden
          )
        );
        toast.info(`Orden #${ordenFiltrada.id} actualizada a ${ordenFiltrada.estado}`);
      }
    });

    // Escuchar eventos de nuevas órdenes
    socketInstance.on('nuevaOrden', (nuevaOrden) => {
      console.log('Nueva orden recibida:', nuevaOrden);

      // Si es bartender, ignorar este evento y usar el específico
      if (userRole !== 'BARTENDER') {
        setOrdenes(prevOrdenes => [nuevaOrden, ...prevOrdenes]);
        toast.info('Nueva orden recibida');
      }
    });

    // Evento específico para nuevas órdenes de bartender con filtro aplicado
    socketInstance.on('nuevaOrdenBartender', (nuevaOrdenFiltrada) => {
      console.log('Nueva orden filtrada para bartender recibida:', nuevaOrdenFiltrada);

      if (userRole === 'BARTENDER') {
        setOrdenes(prevOrdenes => [nuevaOrdenFiltrada, ...prevOrdenes]);
        toast.info('Nueva orden de tragos recibida');
      }
    });

    // Guardar la instancia del socket
    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Fetch órdenes
  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/ordenes", { headers });

      let orders = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setOrdenes(orders);
    } catch (err) {
      console.error("Error al obtener órdenes:", err);
      setOrdenes([]);
    }
    setLoading(false);
  };

  // Cambiar estado de orden
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay sesión activa');
        router.push('/login');
        return;
      }

      console.log('Actualizando estado:', { orderId, newStatus, token });

      const response = await axios.patch(
        `http://localhost:3001/ordenes/${orderId}/estado`,
        { estado: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Respuesta de actualización:', response.data);

      // No actualizamos el estado local aquí, esperamos el evento WebSocket
      toast.success(`Estado actualizado a ${newStatus}`);
    } catch (error: any) {
      console.error('Error al actualizar estado:', error);
      if (error.response) {
        switch (error.response.status) {
          case 401:
            toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
            router.push('/login');
            break;
          case 403:
            toast.error('No tienes permiso para actualizar el estado de la orden.');
            break;
          default:
            toast.error(error.response.data?.message || 'Error al actualizar el estado');
        }
      } else {
        toast.error('Error de conexión al actualizar el estado');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filtrar y ordenar órdenes
  const filteredAndSortedOrdenes = ordenes
    .filter(orden => {
      const matchesSearch = orden.id.toString().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || orden.estado.toLowerCase() === filterStatus;

      // Si es BARTENDER, solo mostrar órdenes con productos de la categoría Tragos
      if (userRole === 'BARTENDER') {
        const tieneTragos = orden.items.some(item =>
          item.producto.categoria?.nombre?.toLowerCase() === 'tragos'
        );
        return matchesSearch && matchesStatus && tieneTragos;
      }

      // Para otros roles, mostrar todas excepto las entregadas
      return matchesSearch && matchesStatus && orden.estado !== 'ENTREGADO';
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
    total: ordenes.length,
    pendiente: ordenes.filter(o => o.estado === "PENDIENTE").length,
    preparando: ordenes.filter(o => o.estado === "EN_PREPARACION").length,
    listo: ordenes.filter(o => o.estado === "LISTO").length,
    entregado: ordenes.filter(o => o.estado === "ENTREGADO").length,
    totalVentas: ordenes.reduce((sum, orden) => {
      const ordenTotal = orden.items.reduce((itemSum: number, item) => {
        const precio = Number(item.producto.precio);
        const cantidad = Number(item.cantidad);
        return itemSum + (precio * cantidad);
      }, 0);
      return sum + ordenTotal;
    }, 0),
  };

  // Función para calcular el total por item
  const calculateItemTotal = (item: OrdenItem) => {
    console.log('Item recibido:', item); // Log para depuración
    const precio = item.precio;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userRole === 'BARTENDER' ? 'Gestión de Órdenes - Cocina' : 'Gestión de Órdenes'}
          </h1>
          <p className="text-muted-foreground">
            {userRole === 'BARTENDER'
              ? 'Visualiza y gestiona las órdenes pendientes y en preparación'
              : 'Administra todas las órdenes del sistema'}
          </p>
        </div>
        <Button onClick={fetchOrdenes} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {userRole !== 'BARTENDER' && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendiente}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Preparación</CardTitle>
                <AlertCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.preparando}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Listos</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.listo}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entregados</CardTitle>
                <CheckCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.entregado}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${formatPrice(stats.totalVentas)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {userRole === 'BARTENDER' ? (
                  <>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="preparando">Preparando</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="preparando">Preparando</SelectItem>
                    <SelectItem value="listo">Listo</SelectItem>
                    <SelectItem value="entregado">Entregado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Más recientes</SelectItem>
                <SelectItem value="oldest">Más antiguos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Órdenes ({filteredAndSortedOrdenes.length})
          </h2>
        </div>

        {filteredAndSortedOrdenes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || filterStatus !== "all"
                  ? "No se encontraron órdenes"
                  : "No hay órdenes registradas"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || filterStatus !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Las nuevas órdenes aparecerán aquí"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedOrdenes.map((orden) => (
              <OrderCard
                key={orden.id}
                order={orden}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}