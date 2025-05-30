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
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Redirigir según el rol
        if (payload.rolId === 4) {
          router.push('/dashboard/ordenes/gestionar');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error al decodificar el token:', error);
        // Si hay error al decodificar el token, lo eliminamos
        localStorage.removeItem('token');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:3001/auth/login", {
        email,
        password,
      });

      const { token } = response.data;
      localStorage.setItem("token", token);

      // Decodificar el token para obtener el rol
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Redirigir según el rol
      if (payload.rolId === 4) {
        router.push('/dashboard/ordenes/gestionar');
      } else {
        router.push('/dashboard');
      }

      toast("Inicio de sesión exitoso",{
        
        description: "Bienvenido al sistema",
        action:{
          label:"Undo",
          onClick:()=> console.log("Undo")
        }
      });
    } catch (error: any) {
      toast("Error",{
        
        description: error.response?.data?.message || "Error al iniciar sesión",
        action:{
          label:"Undo",
          onClick:()=> console.log("Undo")
        }
        
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