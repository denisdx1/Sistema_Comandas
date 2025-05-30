"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import axios from "axios";

interface MenuItem {
  href?: string;
  label: string;
  icon: React.ReactNode;
  submenu?: { href: string; label: string; icon: React.ReactNode }[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

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
            const response = await axios.get(`http://localhost:3001/auth/me`, {
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

  const menuItems: MenuItem[] = userRole === 'BARTENDER' ? [
    {
      href: "/dashboard/ordenes/gestionar",
      label: "Gestión de Órdenes",
      icon: <ClipboardList className="h-5 w-5" />
    }
  ] : [
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
      href: "/dashboard/usuarios",
      label: "Usuarios",
      icon: <Users className="h-5 w-5" />
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
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ChefHat className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Sistema</h2>
            <p className="text-sm text-muted-foreground">de Comandas</p>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{userName || 'Usuario'}</p>
            <p className="text-sm text-muted-foreground capitalize">{userRole?.toLowerCase() || 'Rol no definido'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4 py-6">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              {item.submenu ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground">
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.submenu.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}>
                        <div className={cn(
                          "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                          pathname === subItem.href
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}>
                          {subItem.icon}
                          <span className="ml-3">{subItem.label}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link href={item.href!}>
                  <div className={cn(
                    "flex items-center px-3 py-2 text-sm rounded-lg transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}>
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </div>
                </Link>
              )}
              {index < menuItems.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for desktop */}
      <aside className="hidden md:block w-72 border-r bg-card">
        <NavContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar for mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>

          <Link href={userRole === 'BARTENDER' ? "/dashboard/ordenes/gestionar" : "/dashboard"} className="flex items-center space-x-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <span className="font-semibold">Sistema de Comandas</span>
          </Link>

          {userRole !== 'BARTENDER' && (
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          )}
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}