"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {Toaster} from "@/components/ui/sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import axios from "axios";

import Link from 'next/link';
import { ChefHat, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast, useSonner } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { toasts } = useSonner();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya está autenticado
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Verificar que el token sea válido antes de redireccionar
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Formato de token inválido');
        }
        
        const payload = JSON.parse(atob(tokenParts[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Verificar si el token ha expirado
        if (payload.exp && payload.exp < currentTime) {
          throw new Error('Token expirado');
        }
        
        console.log("rolId:", payload.rolId);
        // Redirigir según el rol
        if (payload.rolId === 4) {
          router.replace('/dashboard/ordenes/gestionar');
        } else {
          router.replace('/dashboard');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Si hay error al decodificar el token, lo eliminamos
        localStorage.removeItem('token');
      }
    }
  }, []); // Dependencia vacía para que solo se ejecute una vez al montar el componente

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://192.168.0.102:3001/auth/login", {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("token", token);

      // Decodificar el token para obtener el rol
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      toast.success("Inicio de sesión exitoso", {
        description: "Bienvenido al sistema"
      });
      
      // Usar setTimeout para asegurar que el toast se muestre antes de la redirección
      setTimeout(() => {
        // Redirigir según el rol
        if (payload.rolId === 4) {
          router.replace('/dashboard/ordenes/gestionar');
        } else {
          router.replace('/dashboard');
        }
      }, 300);
    } catch (error: any) {
      toast.error("Error de autenticación", {
        description: error.response?.data?.message || "Credenciales inválidas"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors">
            <ChefHat className="h-8 w-8" />
            <span className="text-2xl font-bold">Sistema de Comandas</span>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Bienvenido de vuelta</CardTitle>
            <CardDescription className="text-base">
              Ingresa tus credenciales para acceder al sistema de gestión
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="#" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Contacta al administrador
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}