"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import DashboardLayout from "@/components/dashboard/dashboard-layout";

export default function DashboardPageLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.rolId === 4 && !pathname.includes('/dashboard/ordenes/gestionar')) {
          router.push('/dashboard/ordenes/gestionar');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
    }
  }, [pathname, router]);

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
} 