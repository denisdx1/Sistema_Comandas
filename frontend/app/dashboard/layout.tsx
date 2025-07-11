"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { BarChart3, Receipt, PlusCircle, ClipboardCheck, History, Wine, Package } from "lucide-react";

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Establecer el rol del usuario
        setUserRole(payload.rol);
        
        // Solo los mozos (rolId=4) serán redirigidos automáticamente a gestionar órdenes
        // y solo durante la carga inicial para evitar bucles
        if (isInitialLoad && payload.rolId === 4 && !pathname.includes('/dashboard/ordenes/gestionar')) {
          router.push('/dashboard/ordenes/gestionar');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
    
    // Establecer que ya no es la carga inicial después del primer render
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [pathname, router, isInitialLoad]);

  // Si el rol es BARTENDER, no mostrar el sidebar
  if (userRole === 'BARTENDER') {
    return <>{children}</>;
  }

  // Para otros roles, mostrar el layout completo
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}

// Arreglo con elementos de la barra lateral
const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <BarChart3 className="h-5 w-5 mr-3" />,
  },
  {
    title: "Órdenes",
    icon: <Receipt className="h-5 w-5 mr-3" />,
    subitems: [
      {
        title: "Crear Orden",
        href: "/dashboard/ordenes/crear",
        icon: <PlusCircle className="h-4 w-4 mr-3" />,
      },
      {
        title: "Gestionar Órdenes",
        href: "/dashboard/ordenes/gestionar",
        icon: <ClipboardCheck className="h-4 w-4 mr-3" />,
      },
      {
        title: "Historial",
        href: "/dashboard/ordenes/historial",
        icon: <History className="h-4 w-4 mr-3" />,
      },
    ],
  },
  {
    title: "Promociones",
    href: "/dashboard/promociones",
    icon: <Wine className="h-5 w-5 mr-3" />,
  },
  {
    title: "Combos",
    href: "/dashboard/combos",
    icon: <Package className="h-5 w-5 mr-3" />,
  },
]; 