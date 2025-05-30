'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    // Obtener el rol del usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rolId === 4) {
          router.push('/dashboard/ordenes/gestionar');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }, [router]);

  // Example data - in a real app, this would come from your API
  const stats = [
    {
      title: "Ventas Totales",
      value: "$12,543",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      trend: "+12.5%"
    },
    {
      title: "Órdenes Activas",
      value: "23",
      icon: <ClipboardCheck className="h-4 w-4 text-muted-foreground" />,
      trend: "+4"
    },
    {
      title: "Productos",
      value: "154",
      icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" />,
      trend: ""
    },
    {
      title: "Usuarios",
      value: "12",
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      trend: ""
    },
  ];

  const recentOrders = [
    { id: "001", customer: "Mesa 4", items: 3, total: "$45.50", status: "En Proceso" },
    { id: "002", customer: "Mesa 7", items: 2, total: "$32.00", status: "Completada" },
    { id: "003", customer: "Mesa 2", items: 5, total: "$78.25", status: "En Proceso" },
    { id: "004", customer: "Mesa 1", items: 1, total: "$12.99", status: "Pendiente" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen general de la actividad del restaurante
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Actualizado hace 5 minutos</span>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              {stat.trend && (
                <p className="text-sm flex items-center text-success">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  {stat.trend} desde el mes pasado
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2 text-primary" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/ordenes/crear">
              <Button className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Orden
              </Button>
            </Link>
            <Link href="/dashboard/productos">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Gestionar Productos
              </Button>
            </Link>
            <Link href="/dashboard/usuarios">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Gestionar Usuarios
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Resumen del Día
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Órdenes completadas</span>
              <span className="font-semibold">18</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Órdenes pendientes</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Tiempo promedio</span>
              <span className="font-semibold">12 min</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardCheck className="h-5 w-5 mr-2 text-primary" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conexión</span>
              <span className="text-sm text-success font-medium">Activa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Base de datos</span>
              <span className="text-sm text-success font-medium">Operativa</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Última copia</span>
              <span className="text-sm text-muted-foreground">Hace 2h</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="ordenes" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ordenes">Órdenes Recientes</TabsTrigger>
            <TabsTrigger value="actividad">Actividad</TabsTrigger>
          </TabsList>
          <Link href="/dashboard/ordenes/gestionar">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Ver Todas
            </Button>
          </Link>
        </div>

        <TabsContent value="ordenes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Órdenes Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="text-center">Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono font-medium">#{order.id}</TableCell>
                        <TableCell className="font-medium">{order.customer}</TableCell>
                        <TableCell className="text-center">{order.items}</TableCell>
                        <TableCell className="text-right font-semibold">{order.total}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            order.status === "Completada"
                              ? "bg-success/10 text-success border border-success/20"
                              : order.status === "En Proceso"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-warning/10 text-warning border border-warning/20"
                          }`}>
                            {order.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="actividad">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="w-3 h-3 mt-1 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Nueva orden creada</p>
                      <p className="text-sm text-muted-foreground">Mesa 4 - Orden #001</p>
                      <p className="text-xs text-muted-foreground mt-1">Hace 5 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-success/5 border border-success/10">
                    <div className="w-3 h-3 mt-1 rounded-full bg-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Orden completada</p>
                      <p className="text-sm text-muted-foreground">Mesa 7 - Orden #002 ($32.00)</p>
                      <p className="text-xs text-muted-foreground mt-1">Hace 12 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-warning/5 border border-warning/10">
                    <div className="w-3 h-3 mt-1 rounded-full bg-warning flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Nuevo producto agregado</p>
                      <p className="text-sm text-muted-foreground">Hamburguesa Especial - $15.99</p>
                      <p className="text-xs text-muted-foreground mt-1">Hace 30 minutos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-info/5 border border-info/10">
                    <div className="w-3 h-3 mt-1 rounded-full bg-info flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Usuario conectado</p>
                      <p className="text-sm text-muted-foreground">Juan Pérez - Mesero</p>
                      <p className="text-xs text-muted-foreground mt-1">Hace 1 hora</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4 p-4 rounded-lg bg-muted/20 border border-muted">
                    <div className="w-3 h-3 mt-1 rounded-full bg-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Copia de seguridad realizada</p>
                      <p className="text-sm text-muted-foreground">Base de datos respaldada exitosamente</p>
                      <p className="text-xs text-muted-foreground mt-1">Hace 2 horas</p>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}