import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChefHat,
  ClipboardList,
  Users,
  BarChart3,
  Clock,
  Shield,
  Smartphone,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: <ClipboardList className="h-8 w-8 text-primary" />,
      title: "Gestión de Órdenes",
      description: "Administra las comandas de manera eficiente con seguimiento en tiempo real del estado de cada orden."
    },
    {
      icon: <ChefHat className="h-8 w-8 text-primary" />,
      title: "Catálogo de Productos",
      description: "Organiza tu menú con categorías, precios y disponibilidad. Actualiza productos de forma instantánea."
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Gestión de Personal",
      description: "Administra usuarios, roles y permisos para mantener el control total de tu equipo."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Reportes y Analytics",
      description: "Obtén insights valiosos sobre ventas, productos más populares y rendimiento del restaurante."
    },
    {
      icon: <Clock className="h-8 w-8 text-primary" />,
      title: "Tiempo Real",
      description: "Sincronización instantánea entre cocina, meseros y administración para un servicio fluido."
    },
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Responsive Design",
      description: "Accede desde cualquier dispositivo - computadora, tablet o móvil - sin perder funcionalidad."
    }
  ];

  const benefits = [
    "Reduce tiempos de espera",
    "Minimiza errores en órdenes",
    "Mejora la experiencia del cliente",
    "Optimiza la gestión de inventario",
    "Aumenta la eficiencia operativa",
    "Facilita el control de costos"
  ];

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Sistema de Comandas</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Características
            </Link>
            <Link href="#benefits" className="text-muted-foreground hover:text-foreground transition-colors">
              Beneficios
            </Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
          </nav>
          <div className="md:hidden">
            <Link href="/login">
              <Button size="sm">Acceder</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gestiona tu Restaurante con Eficiencia
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground mb-8 leading-relaxed">
              Sistema integral de comandas que optimiza la operación de tu restaurante.
              Desde la toma de órdenes hasta la gestión de inventario, todo en una plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-6">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">Características Principales</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para las necesidades de tu restaurante
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-hover border-0 shadow-md">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Transforma la Operación de tu Restaurante
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Nuestro sistema está diseñado para resolver los desafíos más comunes
                en la gestión de restaurantes, mejorando tanto la eficiencia operativa
                como la experiencia del cliente.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <TrendingUp className="h-8 w-8 text-success mb-2" />
                  <CardTitle className="text-2xl">+40%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Aumento en eficiencia operativa</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <Clock className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-2xl">-60%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Reducción en tiempos de espera</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <Shield className="h-8 w-8 text-info mb-2" />
                  <CardTitle className="text-2xl">99.9%</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Precisión en órdenes</p>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <Users className="h-8 w-8 text-warning mb-2" />
                  <CardTitle className="text-2xl">24/7</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Soporte disponible</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            ¿Listo para Optimizar tu Restaurante?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Únete a cientos de restaurantes que ya han transformado su operación
            con nuestro sistema de comandas.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Comenzar Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-background/95">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <ChefHat className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">Sistema de Comandas</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              © 2024 Sistema de Comandas. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
