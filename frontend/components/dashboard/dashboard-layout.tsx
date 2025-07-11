"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Menu,
  ChefHat,
  LayoutDashboard,
  Package,
  FolderOpen,
  Users,
  ClipboardList,
  Plus,
  Settings,
  LogOut,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  HomeIcon,
  ClipboardCheckIcon,
  ClockIcon,
  TagIcon,
  UsersIcon,
  DollarSign,
  Building,
  BadgePlus,
  Wine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Definimos los colores de gradientes para las categorías
const gradients = {
  dashboard: "from-blue-500 to-sky-400",
  products: "from-purple-500 to-indigo-400",
  categories: "from-orange-500 to-amber-400",
  users: "from-teal-500 to-emerald-400",
  orders: "from-pink-500 to-rose-400",
};

interface MenuItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { href: string; label: string; icon: React.ReactNode }[];
}

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/categorias", label: "Categorías", icon: FolderOpen },
  { 
    label: "Productos", 
    icon: Package,
    submenu: [
      { href: "/dashboard/productos", label: "Productos", icon: Package },
      { href: "/dashboard/combos", label: "Combos", icon: TagIcon },
    ]
  },
  { 
    label: "Órdenes", 
    icon: ClipboardList,
    submenu: [
      { href: "/dashboard/ordenes/crear", label: "Crear Órden", icon: Plus },
      { href: "/dashboard/ordenes/gestionar", label: "Gestionar Órdenes", icon: Settings },
      { href: "/dashboard/ordenes/historial", label: "Historial de Órdenes", icon: ClockIcon },
    ]
  },
  { 
    label: "Caja", 
    icon: DollarSign,
    submenu: [
      { href: "/dashboard/cajas", label: "Cajas", icon: DollarSign },
      { href: "/dashboard/sucursales", label: "Sucursales", icon: Building },
      { href: "/dashboard/asignaciones", label: "Asignaciones", icon: UsersIcon },
    ]
  },
  { href: "/dashboard/movimientos", label: "Historial de Movimientos", icon: ClockIcon },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Obtener el rol y nombre del usuario del token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
        
        // Obtener el nombre del rol desde el backend
        const fetchRoleName = async () => {
          try {
            const response = await axios.get(`http://192.168.0.102:3001/auth/me`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUserRole(response.data.rol.nombre);
          } catch (error) {
            console.error('Error al obtener el nombre del rol:', error);
            setUserRole('ROL NO DEFINIDO');
          }
        };

        fetchRoleName();
        setUserName(payload.email);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }, []);

  const menuItems = useMemo(() => {
    if (userRole === 'BARTENDER') {
      return [
        {
          href: "/dashboard/ordenes/gestionar",
          label: "Gestión de Órdenes",
          icon: <ClipboardList className="h-5 w-5" />
        }
      ];
    } else if (userRole === 'MOZO') {
      return [
        {
          href: "/dashboard/ordenes/crear",
          label: "Crear Orden",
          icon: <Plus className="h-5 w-5" />
        },
        {
          href: "/dashboard/ordenes/gestionar",
          label: "Gestionar Órdenes",
          icon: <ClipboardList className="h-5 w-5" />
        },
        {
          label: "Productos",
          icon: <Package className="h-5 w-5" />,
          submenu: [
            {
              href: "/dashboard/productos",
              label: "Productos",
              icon: <Package className="h-4 w-4" />
            },
            {
              href: "/dashboard/combos",
              label: "Combos",
              icon: <TagIcon className="h-4 w-4" />
            },
          ]
        }
      ];
    } else if (userRole === 'CAJERO') {
      return [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          label: "Productos",
          icon: <Package className="h-5 w-5" />,
          submenu: [
            {
              href: "/dashboard/productos",
              label: "Productos",
              icon: <Package className="h-4 w-4" />
            },
            {
              href: "/dashboard/combos",
              label: "Combos",
              icon: <TagIcon className="h-4 w-4" />
            },
          ]
        },
        {
          label: "Órdenes",
          icon: <ClipboardList className="h-5 w-5" />,
          submenu: [
            {
              href: "/dashboard/ordenes/crear",
              label: "Crear Orden",
              icon: <Plus className="h-4 w-4" />
            },
            {
              href: "/dashboard/ordenes/gestionar",
              label: "Gestionar Órdenes",
              icon: <Settings className="h-4 w-4" />
            },
            {
              href: "/dashboard/ordenes/historial",
              label: "Historial de Órdenes",
              icon: <ClockIcon className="h-4 w-4" />
            }
          ]
        },
        {
          label: "Caja",
          icon: <DollarSign className="h-5 w-5" />,
          submenu: [
            {
              href: "/dashboard/cajas",
              label: "Cajas",
              icon: <DollarSign className="h-4 w-4" />
            }
          ]
        }
      ];
    } else if (userRole === 'ADMIN') {
      return adminLinks.map(link => ({
        href: link.href,
        label: link.label,
        icon: <link.icon className="h-5 w-5" />,
        submenu: link.submenu ? link.submenu.map(subItem => ({
          href: subItem.href,
          label: subItem.label,
          icon: <subItem.icon className="h-4 w-4" />
        })) : undefined
      }));
    } else {
      return [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <LayoutDashboard className="h-5 w-5" />
        },
        {
          href: "/dashboard/productos",
          label: "Productos",
          icon: <Package className="h-5 w-5" />
        },
        {
          href: "/dashboard/categorias",
          label: "Categorías",
          icon: <FolderOpen className="h-5 w-5" />
        },
        {
          label: "Órdenes",
          icon: <ClipboardList className="h-5 w-5" />,
          submenu: [
            {
              href: "/dashboard/ordenes/crear",
              label: "Crear Orden",
              icon: <Plus className="h-4 w-4" />
            },
            {
              href: "/dashboard/ordenes/gestionar",
              label: "Gestionar Órdenes",
              icon: <Settings className="h-4 w-4" />
            },
            {
              href: "/dashboard/ordenes/historial",
              label: "Historial de Órdenes",
              icon: <ClockIcon className="h-4 w-4" />
            }
          ]
        }
      ];
    }
  }, [userRole]); // Solo depende de userRole

  useEffect(() => {
    // Determinar qué submenú debe estar abierto basado en la ruta actual
    const updatedOpenSubmenus: Record<string, boolean> = {};
    
    menuItems.forEach(item => {
      if (item.submenu) {
        // Verificar si alguno de los items del submenú coincide con la ruta actual
        const isActive = item.submenu.some(subItem => 
          pathname === subItem.href || pathname.startsWith(`${subItem.href}/`)
        );
        
        if (isActive) {
          updatedOpenSubmenus[item.label] = true;
        }
      }
    });
    
    // Usar una función para evitar dependencia circular
    setOpenSubmenus(prev => {
      // Comparar objetos para evitar actualizaciones innecesarias
      if (JSON.stringify(prev) === JSON.stringify(updatedOpenSubmenus)) {
        return prev;
      }
      return updatedOpenSubmenus;
    });
  }, [pathname]); // Solo depender de pathname, no de menuItems

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  // Función para manejar la apertura/cierre de submenús en móvil
  const toggleSubmenuMobile = (label: string) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const NavContent = () => (
    <TooltipProvider delayDuration={0}>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("p-6 border-b", sidebarCollapsed && "px-3")}>
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className={cn("flex items-center space-x-3 group", sidebarCollapsed && "justify-center")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <ChefHat className="h-6 w-6 text-primary-foreground" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-xl font-bold">Sistema</h2>
                <p className="text-sm text-muted-foreground">de Comandas</p>
              </div>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-8 w-8"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {!sidebarCollapsed && (
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-slate-800 leading-none">
                {userName || 'Usuario'}
              </p>
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs px-1.5 py-0 border-slate-200 text-slate-600">
                  {userRole?.toLowerCase() || 'Sin rol'}
                </Badge>
                <div className="ml-2 h-1.5 w-1.5 rounded-full bg-green-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {sidebarCollapsed && (
        <div className="px-2 py-3 border-b border-slate-100 flex justify-center">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Navigation */}
      <div className={cn(
        "flex-1 px-3 overflow-y-auto hide-scrollbar py-4",
        sidebarCollapsed && "px-2"
      )}>
        <nav className="space-y-1">
          {menuItems.map((item, index) => {
            return (
              <div key={item.label} className="mb-1">
                {item.submenu ? (
                  sidebarCollapsed ? (
                    // Collapsed submenu items shown as individual buttons
                    <div className="space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link key={subItem.href} href={subItem.href || '#'}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "w-full h-9 relative rounded-md",
                                  pathname === subItem.href 
                                    ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                              >
                                {subItem.icon}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
                              <p>{subItem.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Collapsible 
                      open={openSubmenus[item.label] || false} 
                      onOpenChange={() => toggleSubmenu(item.label)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-between text-sm text-left font-medium relative h-9 my-0.5 rounded-md",
                            item.submenu && item.submenu.some(subItem => pathname === subItem.href)
                              ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <div className="flex items-center">
                            <span className="flex items-center justify-center w-5 h-5 mr-3">
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          {openSubmenus[item.label] ? (
                            <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-8 space-y-1 mt-1 mb-1">
                        {item.submenu.map((subItem) => (
                          <Link key={subItem.href} href={subItem.href || "#"}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-xs font-normal h-8 my-0.5 rounded-md",
                                pathname === subItem.href 
                                  ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary/70"
                                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                              )}
                            >
                              <span className="flex items-center justify-center w-4 h-4 mr-2 opacity-70">
                                {subItem.icon}
                              </span>
                              <span>{subItem.label}</span>
                            </Button>
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                ) : (
                  item.href ? (
                    <Link href={item.href}>
                      {sidebarCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full h-9 relative rounded-md",
                                pathname === item.href 
                                  ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              )}
                              size="icon"
                            >
                              {item.icon}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
                            <p>{item.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                            pathname === item.href 
                              ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <span className="flex items-center justify-center w-5 h-5 mr-3">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Button>
                      )}
                    </Link>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                        "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <span className="flex items-center justify-center w-5 h-5 mr-3">
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </Button>
                  )
                )}
                {index < menuItems.length - 1 && index % 2 === 1 && <Separator className="my-2 bg-slate-100" />}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className={cn("p-3 mt-auto border-t border-slate-100", sidebarCollapsed && "px-2")}>
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-9 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                size="icon"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
              <p>Cerrar Sesión</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            className="w-full h-9 justify-start text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
            onClick={handleLogout}
          >
            <span className="flex items-center justify-center w-5 h-5 mr-3">
              <LogOut className="h-4 w-4" />
            </span>
            <span>Cerrar Sesión</span>
          </Button>
        )}
      </div>
    </div>
    </TooltipProvider>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className={cn(
        "hidden md:block fixed left-0 top-0 h-screen z-40 transition-all duration-300",
        "bg-white shadow-sm border-r border-slate-200 overflow-hidden",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className={cn("flex items-center space-x-2", sidebarCollapsed && "justify-center")}>
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <span className="font-semibold text-lg">Sistema</span>
                )}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-7 w-7 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                {sidebarCollapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className={cn(
            "relative mt-4 mb-6 mx-4 p-4 rounded-xl",
            "bg-gradient-to-br from-slate-800/80 to-slate-700/50",
            "border border-slate-700/20 shadow-md",
            sidebarCollapsed && "mx-2 p-3"
          )}>
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground/60 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-white truncate">
                    {userName || 'Usuario'}
                  </p>
                  <div className="flex items-center mt-1">
                    <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600 text-slate-300 px-2">
                      {userRole?.toLowerCase() || 'Sin rol'}
                    </Badge>
                    <div className="ml-2 h-2 w-2 rounded-full bg-green-400" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Avatar className="h-10 w-10 border-2 border-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground/60 text-white">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className={cn(
            "flex-1 px-3 overflow-y-auto hide-scrollbar py-4",
            sidebarCollapsed && "px-2"
          )}>
            <nav className="space-y-1">
              {menuItems.map((item, index) => {
                return (
                  <div key={item.label} className="mb-1">
                    {item.submenu ? (
                      sidebarCollapsed ? (
                        // Collapsed submenu items shown as individual buttons
                        <div className="space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href || '#'}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn(
                                      "w-full h-9 relative rounded-md",
                                      pathname === subItem.href 
                                        ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                  >
                                    {subItem.icon}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
                                  <p>{subItem.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Collapsible 
                          open={openSubmenus[item.label] || false} 
                          onOpenChange={() => toggleSubmenu(item.label)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-between text-sm text-left font-medium relative h-9 my-0.5 rounded-md",
                                item.submenu && item.submenu.some(subItem => pathname === subItem.href)
                                  ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary" 
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              )}
                            >
                              <div className="flex items-center">
                                <span className="flex items-center justify-center w-5 h-5 mr-3">
                                  {item.icon}
                                </span>
                                <span>{item.label}</span>
                              </div>
                              {openSubmenus[item.label] ? (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pl-8 space-y-1 mt-1 mb-1">
                            {item.submenu.map((subItem) => (
                              <Link key={subItem.href} href={subItem.href || "#"}>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start text-xs font-normal h-8 my-0.5 rounded-md",
                                    pathname === subItem.href 
                                      ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary/70"
                                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                  )}
                                >
                                  <span className="flex items-center justify-center w-4 h-4 mr-2 opacity-70">
                                    {subItem.icon}
                                  </span>
                                  <span>{subItem.label}</span>
                                </Button>
                              </Link>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    ) : (
                      item.href ? (
                        <Link href={item.href}>
                          {sidebarCollapsed ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full h-9 relative rounded-md",
                                    pathname === item.href 
                                      ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                  )}
                                  size="icon"
                                >
                                  {item.icon}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
                                <p>{item.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                                pathname === item.href 
                                  ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                              )}
                            >
                              <span className="flex items-center justify-center w-5 h-5 mr-3">
                                {item.icon}
                              </span>
                              <span>{item.label}</span>
                            </Button>
                          )}
                        </Link>
                      ) : (
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                            "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          )}
                        >
                          <span className="flex items-center justify-center w-5 h-5 mr-3">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </Button>
                      )
                    )}
                    {index < menuItems.length - 1 && index % 2 === 1 && <Separator className="my-2 bg-slate-100" />}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Footer */}
          <div className={cn("p-3 mt-auto border-t border-slate-100", sidebarCollapsed && "px-2")}>
            {sidebarCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full h-9 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    size="icon"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={5} className="bg-white text-slate-800 border-slate-200 shadow-md">
                  <p>Cerrar Sesión</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className="w-full h-9 justify-start text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                onClick={handleLogout}
              >
                <span className="flex items-center justify-center w-5 h-5 mr-3">
                  <LogOut className="h-4 w-4" />
                </span>
                <span>Cerrar Sesión</span>
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "md:ml-20" : "md:ml-72"
      )}>
        {/* Top bar for mobile */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white">
              <div className="flex flex-col h-full">
                {/* Header para el panel móvil */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                      <ChefHat className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg">Sistema</span>
                  </div>
                </div>

                {/* Contenido del panel móvil */}
                <div className="flex-1 overflow-y-auto">
                  {/* User Info para móvil */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium text-slate-800 leading-none">
                          {userName || 'Usuario'}
                        </p>
                        <div className="flex items-center">
                          <Badge variant="outline" className="text-xs px-1.5 py-0 border-slate-200 text-slate-600">
                            {userRole?.toLowerCase() || 'Sin rol'}
                          </Badge>
                          <div className="ml-2 h-1.5 w-1.5 rounded-full bg-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Navegación para móvil - Usando el mismo código que el escritorio */}
                  <div className="px-3 py-4">
                    <nav className="space-y-1">
                      {menuItems.map((item, index) => {
                        return (
                          <div key={item.label} className="mb-1">
                            {item.submenu ? (
                              <Collapsible 
                                open={openSubmenus[item.label] || false} 
                                onOpenChange={() => toggleSubmenuMobile(item.label)}
                              >
                                <CollapsibleTrigger className="w-full">
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-between text-sm text-left font-medium relative h-9 my-0.5 rounded-md",
                                      item.submenu && item.submenu.some(subItem => pathname === subItem.href)
                                        ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary" 
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                  >
                                    <div className="flex items-center">
                                      <span className="flex items-center justify-center w-5 h-5 mr-3">
                                        {item.icon}
                                      </span>
                                      <span>{item.label}</span>
                                    </div>
                                    {openSubmenus[item.label] ? (
                                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-8 space-y-1 mt-1 mb-1">
                                  {item.submenu.map((subItem) => (
                                    <Link key={subItem.href} href={subItem.href || "#"} onClick={() => {
                                      const closeButton = document.querySelector('[data-sheet-close]');
                                      if (closeButton instanceof HTMLElement) {
                                        closeButton.click();
                                      }
                                    }}>
                                      <Button
                                        variant="ghost"
                                        className={cn(
                                          "w-full justify-start text-xs font-normal h-8 my-0.5 rounded-md",
                                          pathname === subItem.href 
                                            ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary/70"
                                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                                        )}
                                      >
                                        <span className="flex items-center justify-center w-4 h-4 mr-2 opacity-70">
                                          {subItem.icon}
                                        </span>
                                        <span>{subItem.label}</span>
                                      </Button>
                                    </Link>
                                  ))}
                                </CollapsibleContent>
                              </Collapsible>
                            ) : (
                              item.href ? (
                                <Link href={item.href} onClick={() => {
                                  const closeButton = document.querySelector('[data-sheet-close]');
                                  if (closeButton instanceof HTMLElement) {
                                    closeButton.click();
                                  }
                                }}>
                                  <Button
                                    variant="ghost"
                                    className={cn(
                                      "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                                      pathname === item.href 
                                        ? "bg-slate-100 text-slate-900 before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-primary"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                    )}
                                  >
                                    <span className="flex items-center justify-center w-5 h-5 mr-3">
                                      {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                  </Button>
                                </Link>
                              ) : (
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start text-sm font-medium relative h-9 my-0.5 rounded-md",
                                    "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                  )}
                                >
                                  <span className="flex items-center justify-center w-5 h-5 mr-3">
                                    {item.icon}
                                  </span>
                                  <span>{item.label}</span>
                                </Button>
                              )
                            )}
                            {index < menuItems.length - 1 && index % 2 === 1 && <Separator className="my-2 bg-slate-100" />}
                          </div>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Footer para móvil */}
                <div className="p-3 mt-auto border-t border-slate-100">
                  <Button
                    variant="ghost"
                    className="w-full h-9 justify-start text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                    onClick={() => {
                      handleLogout();
                      const closeButton = document.querySelector('[data-sheet-close]');
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }}
                  >
                    <span className="flex items-center justify-center w-5 h-5 mr-3">
                      <LogOut className="h-4 w-4" />
                    </span>
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link 
            href={userRole === 'BARTENDER' ? "/dashboard/ordenes/gestionar" : "/dashboard"} 
            className="flex items-center space-x-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ChefHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">Sistema de Comandas</span>
          </Link>

          {userRole !== 'BARTENDER' && (
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full border-2 border-background" />
            </Button>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Agregamos estilos globales para ocultar la barra de desplazamiento pero mantener la funcionalidad
const styles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

// Insertamos los estilos en el componente
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}