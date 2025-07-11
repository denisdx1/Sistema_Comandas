'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  ShoppingBag,
  ClipboardCheck,
  TrendingUp,
  DollarSign,
  Clock,
  Plus,
  Eye,
  RefreshCw,
  CalendarDays,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ListChecks,
  Activity as ActivityIcon,
  CheckCircle2,
  Clock4,
  AlertCircle,
  Loader2
} from "lucide-react";
// Importar componentes de gráficos
import { OrderStatusChart } from "@/components/dashboard/OrderStatusChart";
import { SalesBarChart } from "@/components/dashboard/SalesBarChart";
import { HourlySalesChart } from "@/components/dashboard/HourlySalesChart";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

// Función de debounce para limitar las llamadas rápidas sucesivas
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Definimos los colores de gradientes para categorías
const gradients = {
  sales: "from-green-500 to-emerald-400",
  orders: "from-blue-500 to-sky-400",
  products: "from-purple-500 to-indigo-400",
  users: "from-orange-500 to-amber-400",
};

const statusColors = {
  "PENDIENTE": {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-500",
    icon: <AlertCircle className="h-4 w-4" />
  },
  "EN_PREPARACION": {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-500",
    icon: <Clock4 className="h-4 w-4" />
  },
  "LISTO": {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-500",
    icon: <ListChecks className="h-4 w-4" />
  },
  "ENTREGADO": {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-500",
    icon: <CheckCircle2 className="h-4 w-4" />
  },
  "default": {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-500",
    icon: <Clock className="h-4 w-4" />
  }
};

// Tipos de datos
interface DashboardStats {
  ventasDelDia: string;
  ordenesActivas: number;
  totalProductos: number;
  totalUsuarios: number;
  ordenesPendientes: number;
  ordenesEnPreparacion: number;
  ordenesListas: number;
  ordenesEntregadas: number;
  ventasHoy: number;
}

interface RecentOrder {
  id: number;
  mozo: string;
  items: number;
  total: string;
  estado: string;
  createdAt: string;
}

interface Activity {
  tipo: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  estado: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Crear versión con debounce de fetchDashboardData
  const debouncedFetchDashboardData = useCallback(
    debounce(() => {
      fetchDashboardData();
    }, 1000),
    []
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.replace('/login');
      return;
    }

    // Inicialización solo en el primer render
    let socketInstance: any = null;
    let isMounted = true;
    
    // Verificar el rol del usuario - Solo una vez al inicio
    const checkUserRole = async () => {
      if (!isMounted) return; // Prevenir acciones si el componente ya no está montado
      
      try {
        const response = await axios.get('http://192.168.0.102:3001/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const role = response.data?.rol?.nombre || null;
        
        if (!isMounted) return; // Prevenir acciones si el componente ya no está montado
        
        setUserRole(role);
        
        // Redirigir según el rol
        if (role === 'MOZO') {
          // Los mozos van directo a crear órdenes
          router.replace('/dashboard/ordenes/crear');
        } else if (role === 'BARTENDER') {
          // Bartenders van a gestionar órdenes
          router.replace('/dashboard/ordenes/gestionar');
        }
        // Los administradores y cajeros se quedan en el dashboard principal
      } catch (error) {
        console.error('Error al verificar el rol:', error);
        if (isMounted) {
          // Solo redirigir si hay un error crítico y el componente sigue montado
          localStorage.removeItem('token');
          router.replace('/login');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUserRole();

    // Cargar datos del dashboard solo si el componente sigue montado
    const loadData = async () => {
      if (isMounted) {
        try {
          await fetchDashboardData();
        } catch (error) {
          console.error('Error inicial al cargar dashboard:', error);
          // No redireccionar aquí, manejar el error silenciosamente
        }
      }
    };
    
    loadData();

    // Crear una única instancia de socket para todo el ciclo de vida del componente
    let socketInitialized = false;
    
    // Configurar socket solo si no se ha inicializado antes
    if (!socketInitialized) {
      socketInitialized = true;
      socketInstance = io('http://192.168.0.102:3001', {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 3000,
        timeout: 20000,
        forceNew: true,
        extraHeaders: {
          "X-User-Role": userRole || "ADMIN",
          "Authorization": `Bearer ${token || ''}`
        }
      });

      // Conectar manualmente después de la configuración completa
      socketInstance.connect();

      // Control de errores para la conexión del socket
      socketInstance.on('connect_error', (error: Error) => {
        console.error('Error de conexión del socket:', error);
        // No intentar reconectar más de 3 veces
        if (socketInstance.io._reconnectionAttempts >= 3) {
          console.log('Máximo de intentos de reconexión alcanzado');
          socketInstance.disconnect();
        }
      });

      socketInstance.on('connect', () => {
        console.log('Dashboard conectado al servidor WebSocket - ID:', socketInstance.id);
        
        // Registrar rol en el servidor solo una vez
        socketInstance.emit('registrarRol', { 
          rol: userRole || 'ADMIN', 
          token: localStorage.getItem('token') 
        });
      });

      // Eventos para actualización en tiempo real con debounce
      socketInstance.on('orden_actualizada', (ordenActualizada: any) => {
        if (!isMounted) return;
        console.log('Orden actualizada recibida en dashboard:', ordenActualizada);
        debouncedFetchDashboardData();
        toast.info(`Orden #${ordenActualizada.id} actualizada a ${ordenActualizada.estado}`);
      });

      // Usar la misma lógica con los demás eventos...
      socketInstance.on('nueva_orden', (nuevaOrden: any) => {
        if (!isMounted) return;
        console.log('Nueva orden recibida en dashboard:', nuevaOrden);
        debouncedFetchDashboardData();
        toast.success('Nueva orden recibida');
      });

      // ... y así sucesivamente con todos los eventos

      setSocket(socketInstance);
    }

    return () => {
      isMounted = false;
      if (socketInstance) {
        console.log('Desconectando socket en cleanup');
        socketInstance.off('connect');
        socketInstance.off('connect_error');
        socketInstance.off('orden_actualizada');
        socketInstance.off('nueva_orden');
        socketInstance.off('actualizacion_manual');
        socketInstance.off('bartender_notificacion');
        socketInstance.off('refresco_solicitado');
        socketInstance.disconnect();
      }
    };
  }, []); // Solo se ejecuta en el montaje inicial, no en cada render
  
  // Efecto para actualizar la hora en el cliente solamente
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      if (lastUpdate) {
        setCurrentTime(lastUpdate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    }
  }, [lastUpdate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [statsResponse, ordersResponse, activityResponse] = await Promise.all([
        axios.get('http://192.168.0.102:3001/dashboard/stats', { headers }),
        axios.get('http://192.168.0.102:3001/dashboard/recent-orders', { headers }),
        axios.get('http://192.168.0.102:3001/dashboard/activity', { headers })
      ]);

      setStats(statsResponse.data);
      setRecentOrders(ordersResponse.data);
      setActivities(activityResponse.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData(); // Mantener sin debounce la actualización manual
  };

  // Calcular porcentajes para los gráficos de progreso
  const getOrderStatusPercentage = (status: 'pendientes' | 'enPreparacion' | 'listas' | 'entregadas') => {
    if (!stats) return 0;
    const totalOrders = stats.ordenesPendientes + stats.ordenesEnPreparacion + stats.ordenesListas + stats.ordenesEntregadas;
    if (totalOrders === 0) return 0;
    
    switch(status) {
      case 'pendientes': return (stats.ordenesPendientes / totalOrders) * 100;
      case 'enPreparacion': return (stats.ordenesEnPreparacion / totalOrders) * 100;
      case 'listas': return (stats.ordenesListas / totalOrders) * 100;
      case 'entregadas': return (stats.ordenesEntregadas / totalOrders) * 100;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8 p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
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
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {lastUpdate ? `Actualizado ${currentTime}` : 'Cargando...'}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={loading}
                className="rounded-full h-10 w-10 border-slate-200 shadow-sm hover:border-primary">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Actualizar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-xl overflow-hidden shadow-md animate-pulse">
              <div className="h-2 w-full bg-slate-200"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-slate-200 animate-pulse rounded" />
                <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-slate-200 animate-pulse rounded mb-1" />
                <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          [
            {
              title: "Ventas del Día",
              value: `$${stats?.ventasDelDia || 0}`,
              icon: <DollarSign className="h-5 w-5 text-white" />,
              trend: `${stats?.ventasHoy || 0} órdenes`,
              gradient: gradients.sales,
              iconBg: "bg-green-500"
            },
            {
              title: "Órdenes Activas",
              value: stats?.ordenesActivas?.toString() || "0",
              icon: <ClipboardCheck className="h-5 w-5 text-white" />,
              trend: `${stats?.ordenesPendientes || 0} pendientes`,
              gradient: gradients.orders,
              iconBg: "bg-blue-500"
            },
            {
              title: "Productos",
              value: stats?.totalProductos?.toString() || "0",
              icon: <ShoppingBag className="h-5 w-5 text-white" />,
              trend: "Inventario actual",
              gradient: gradients.products,
              iconBg: "bg-purple-500"
            },
            {
              title: "Usuarios",
              value: stats?.totalUsuarios?.toString() || "0",
              icon: <Users className="h-5 w-5 text-white" />,
              trend: "Personal activo",
              gradient: gradients.users,
              iconBg: "bg-orange-500"
            },
          ].map((stat, index) => (
            <Card key={index} className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
              <div className={`h-2 w-full bg-gradient-to-r ${stat.gradient}`}></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${stat.iconBg} shadow-sm`}>
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <p className="text-sm flex items-center text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Estado de Órdenes Card */}
        <Card className="rounded-xl shadow-md overflow-hidden col-span-1 lg:col-span-1">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ListChecks className="h-5 w-5 mr-2 text-blue-500" />
              Estado de Órdenes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-32 bg-slate-200 animate-pulse rounded" />
                    <div className="h-4 w-8 bg-slate-200 animate-pulse rounded" />
                  </div>
                  <div className="h-2 w-full bg-slate-200 animate-pulse rounded-full" />
                </div>
              ))
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1.5 text-amber-500" />
                      Pendientes
                    </span>
                    <span className="font-semibold text-amber-500">
                      {stats?.ordenesPendientes || 0}
                    </span>
                  </div>
                  <Progress 
                    value={getOrderStatusPercentage('pendientes')} 
                    className="h-2 bg-slate-100" 
                    //indicatorClassName="bg-amber-500" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock4 className="h-4 w-4 mr-1.5 text-blue-500" />
                      En preparación
                    </span>
                    <span className="font-semibold text-blue-500">
                      {stats?.ordenesEnPreparacion || 0}
                    </span>
                  </div>
                  <Progress 
                    value={getOrderStatusPercentage('enPreparacion')} 
                    className="h-2 bg-slate-100"
                    // Nota: Se eliminó indicatorClassName porque no es una prop válida para Progress
                  />
                </div>
                
                <div className="space-y-2">
                    {/* Para mantener el color azul en el indicador, puedes personalizar el componente Progress o usar una variante si está disponible */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <ListChecks className="h-4 w-4 mr-1.5 text-purple-500" />
                      Listas
                    </span>
                    <span className="font-semibold text-purple-500">
                      {stats?.ordenesListas || 0}
                    </span>
                  </div>
                  <Progress 
                    value={getOrderStatusPercentage('listas')} 
                    className="h-2 bg-slate-100" 
                    //indicatorClassName="bg-purple-500" 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1.5 text-green-500" />
                      Entregadas
                    </span>
                    <span className="font-semibold text-green-500">
                      {stats?.ordenesEntregadas || 0}
                    </span>
                  </div>
                  <Progress 
                    value={getOrderStatusPercentage('entregadas')} 
                    className="h-2 bg-slate-100" 
                    //indicatorClassName="bg-green-500" 
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Acciones Rápidas Card */}
        <Card className="rounded-xl shadow-md overflow-hidden col-span-1 lg:col-span-1">
          <div className="h-2 w-full bg-gradient-to-r from-purple-500 to-indigo-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Plus className="h-5 w-5 mr-2 text-purple-500" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/ordenes/crear">
              <Button className="w-full justify-between group bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 rounded-lg">
                <div className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Orden
                </div>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/productos">
              <Button variant="outline" className="w-full justify-between group hover:border-purple-500 hover:text-purple-500 rounded-lg">
                <div className="flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Gestionar Productos
                </div>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/usuarios">
              <Button variant="outline" className="w-full justify-between group hover:border-orange-500 hover:text-orange-500 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar Usuarios
                </div>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/categorias">
              <Button variant="outline" className="w-full justify-between group hover:border-amber-500 hover:text-amber-500 rounded-lg">
                <div className="flex items-center">
                  <ListChecks className="h-4 w-4 mr-2" />
                  Gestionar Categorías
                </div>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/dashboard/cajas">
              <Button variant="outline" className="w-full justify-between group hover:border-green-500 hover:text-green-500 rounded-lg">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Gestionar Cajas
                </div>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Estado del Sistema Card */}
        <Card className="rounded-xl shadow-md overflow-hidden col-span-1 lg:col-span-1">
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-400"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <ActivityIcon className="h-5 w-5 mr-2 text-emerald-500" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conexión</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-500 font-medium">Activa</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base de datos</span>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-500 font-medium">Operativa</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Última copia</span>
              <span className="text-sm text-muted-foreground">Hace 2h</span>
            </div>

            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Resumen del día</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Órdenes entregadas</span>
                  <span className="font-semibold">{stats?.ordenesEntregadas || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Órdenes activas</span>
                  <span className="font-semibold">{stats?.ordenesActivas || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ventas totales</span>
                  <span className="font-semibold">${stats?.ventasDelDia || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <div className="space-y-6">
        <Tabs defaultValue="ordenes" className="w-full">
          <div className="flex items-center justify-between border-b pb-2">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="ordenes" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:rounded-none px-4 py-2 rounded-none h-auto"
              >
                Órdenes Recientes
              </TabsTrigger>
              <TabsTrigger 
                value="actividad" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:rounded-none px-4 py-2 rounded-none h-auto"
              >
                Actividad
              </TabsTrigger>
            </TabsList>
            <Link href="/dashboard/ordenes/gestionar">
              <Button variant="ghost" size="sm" className="gap-1 hover:text-primary">
                <span>Ver Todas</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <TabsContent value="ordenes" className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gráfico de estado de órdenes */}
              <OrderStatusChart 
                loading={loading}
                pendientes={stats?.ordenesPendientes || 0}
                enPreparacion={stats?.ordenesEnPreparacion || 0}
                listas={stats?.ordenesListas || 0}
                entregadas={stats?.ordenesEntregadas || 0}
              />
              
              {/* Gráfico de ventas por día */}
              <SalesBarChart 
                loading={loading}
                // Aquí pasaríamos datos reales si estuvieran disponibles
              />
            </div>
            
            {/* Gráfico de ventas por hora (ocupa todo el ancho) */}
            <div className="mt-6">
              <HourlySalesChart 
                loading={loading}
                // Aquí pasaríamos datos reales si estuvieran disponibles
              />
            </div>
            
            {/* Tabla de órdenes recientes (opcional, se puede mantener) */}
            <Card className="rounded-xl shadow-md overflow-hidden mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Órdenes Recientes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[80px] font-semibold">ID</TableHead>
                        <TableHead className="font-semibold">Cliente</TableHead>
                        <TableHead className="text-center font-semibold">Items</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                        <TableHead className="text-center font-semibold">Estado</TableHead>
                        <TableHead className="text-right font-semibold w-[100px]">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        // Skeleton loading para órdenes
                        Array.from({ length: 3 }).map((_, index) => (
                          <TableRow key={index}>
                            <TableCell><div className="h-4 w-12 bg-slate-200 animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-20 bg-slate-200 animate-pulse rounded" /></TableCell>
                            <TableCell><div className="h-4 w-8 bg-slate-200 animate-pulse rounded mx-auto" /></TableCell>
                            <TableCell><div className="h-4 w-16 bg-slate-200 animate-pulse rounded ml-auto" /></TableCell>
                            <TableCell><div className="h-6 w-20 bg-slate-200 animate-pulse rounded mx-auto" /></TableCell>
                            <TableCell><div className="h-8 w-8 bg-slate-200 animate-pulse rounded-full ml-auto" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        recentOrders.map((order) => {
                          const status = statusColors[order.estado as keyof typeof statusColors] || statusColors.default;
                          return (
                            <TableRow key={order.id} className="hover:bg-muted/50">
                              <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                              <TableCell className="font-medium">{order.mozo}</TableCell>
                              <TableCell className="text-center">{order.items}</TableCell>
                              <TableCell className="text-right font-semibold">${order.total}</TableCell>
                              <TableCell className="text-center">
                                <div className={cn(
                                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                                  status.bg,
                                  status.border,
                                  status.text
                                )}>
                                  {status.icon}
                                  {order.estado.replace('_', ' ')}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/dashboard/ordenes/gestionar/${order.id}`}>
                                  <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-primary/10 hover:text-primary">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                      {!loading && recentOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                            No hay órdenes recientes para mostrar
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actividad" className="space-y-4 pt-2">
            <Card className="rounded-xl shadow-md overflow-hidden">
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-6 space-y-6">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-start space-x-4 p-4 rounded-lg bg-muted/10 border border-muted/20 animate-pulse">
                          <div className="w-3 h-3 mt-1 rounded-full bg-slate-200 flex-shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-48 bg-slate-200 rounded" />
                            <div className="h-3 w-20 bg-slate-200 rounded" />
                          </div>
                        </div>
                      ))
                    ) : (
                      activities.length > 0 ? activities.map((activity, index) => {
                        // Determinar colores según tipo y estado
                        let dotColor = "bg-slate-400";
                        let bgColor = "bg-slate-50";
                        let borderColor = "border-slate-200";
                        
                        if (activity.tipo === 'orden') {
                          if (activity.estado === 'ENTREGADO') {
                            dotColor = "bg-green-500";
                            bgColor = "bg-green-50";
                            borderColor = "border-green-100";
                          } else if (activity.estado === 'EN_PREPARACION') {
                            dotColor = "bg-blue-500";
                            bgColor = "bg-blue-50";
                            borderColor = "border-blue-100";
                          } else if (activity.estado === 'LISTO') {
                            dotColor = "bg-purple-500";
                            bgColor = "bg-purple-50";
                            borderColor = "border-purple-100";
                          } else {
                            dotColor = "bg-amber-500";
                            bgColor = "bg-amber-50";
                            borderColor = "border-amber-100";
                          }
                        } else {
                          dotColor = "bg-indigo-500";
                          bgColor = "bg-indigo-50";
                          borderColor = "border-indigo-100";
                        }
                        
                        const timeAgo = (fecha: string) => {
                          const now = new Date();
                          const activityDate = new Date(fecha);
                          const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));
                          
                          if (diffInMinutes < 1) return 'Hace un momento';
                          if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
                          const diffInHours = Math.floor(diffInMinutes / 60);
                          if (diffInHours < 24) return `Hace ${diffInHours} horas`;
                          const diffInDays = Math.floor(diffInHours / 24);
                          return `Hace ${diffInDays} días`;
                        };
                        
                        return (
                          <div key={index} className={cn(
                            "flex items-start space-x-4 p-4 rounded-xl border transition-all duration-200",
                            "hover:shadow-md",
                            bgColor,
                            borderColor
                          )}>
                            <div className={cn(
                              "w-3 h-3 mt-1.5 rounded-full flex-shrink-0",
                              dotColor
                            )} />
                            <div className="flex-1">
                              <p className="font-medium">{activity.titulo}</p>
                              <p className="text-sm text-muted-foreground mt-1">{activity.descripcion}</p>
                              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeAgo(activity.fecha)}
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No hay actividades recientes para mostrar
                        </div>
                      )
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </TooltipProvider>
  );
}