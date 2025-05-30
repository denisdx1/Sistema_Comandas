"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Package, DollarSign, Tag, Search, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import axios from "axios";

interface Categoria {
  id: number;
  nombre: string;
}

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria: { id: number; nombre: string };
}

export default function ProductsPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const form = useForm({
    defaultValues: {
      nombre: "",
      precio: "",
      categoriaId: "",
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get("http://localhost:3001/productos", { headers })
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error al obtener productos:", err));

    axios.get("http://localhost:3001/categorias", { headers })
      .then((res) => {
        let cats = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
          ? res.data.data
          : [];
        setCategorias(cats);
      })
      .catch((err) => console.error("Error al obtener categorías:", err));
  }, []);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        "http://localhost:3001/productos",
        {
          nombre: data.nombre,
          precio: parseFloat(data.precio),
          categoriaId: parseInt(data.categoriaId),
        },
        { headers }
      );

      if (res.data) {
        setProductos((prev) => [...prev, res.data]);
        form.reset();
      }
    } catch (err) {
      console.error("Error al crear producto:", err);
    }
    setLoading(false);
  };

  const filteredProductos = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función auxiliar para formatear precios
  const formatPrice = (price: any) => {
    if (price === undefined || price === null) return '0.00';
    const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
    return numPrice.toLocaleString('es-MX', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // Función para calcular el total de productos
  const calculateTotal = (productos: Producto[]) => {
    return productos.reduce((sum, producto) => {
      const precio = typeof producto.precio === 'number' ? producto.precio : parseFloat(producto.precio) || 0;
      return sum + precio;
    }, 0);
  };

  return (
    <div className="space-y-8 px-4 md:px-6 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground mt-1">
            Administra y organiza los productos de tu negocio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productos.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorías disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${formatPrice(calculateTotal(productos))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-t-4 border-t-black">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-black" />
            Añadir Nuevo Producto
          </CardTitle>
          <CardDescription>
            Complete el formulario para agregar un nuevo producto al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Nombre
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej. Coca Cola" 
                        {...field} 
                        className="h-10 focus:ring-2 focus:ring-black/20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Precio
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Ej. 10.50" 
                        {...field} 
                        className="h-10 focus:ring-2 focus:ring-black/20" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Categoría
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 focus:ring-2 focus:ring-black/20">
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="overflow-hidden rounded-md border border-muted bg-white shadow-md">
                        {categorias.map((cat) => (
                          <SelectItem 
                            key={cat.id} 
                            value={cat.id.toString()}
                            className="cursor-pointer focus:bg-accent focus:text-accent-foreground hover:bg-black/10"
                          >
                            {cat.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-10 bg-black text-white hover:bg-black/90 transition-colors"
                >
                  {loading ? "Agregando..." : "Añadir Producto"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5 text-black" />
            Lista de Productos
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredProductos.length} de {productos.length})
            </span>
          </CardTitle>
          <CardDescription>
            Visualiza y gestiona todos los productos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProductos.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? "No se encontraron productos" : "No hay productos registrados"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Comienza agregando tu primer producto al sistema"
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Nombre"]') as HTMLInputElement;
                    input?.focus();
                  }}
                  className="bg-black text-white hover:bg-black/90"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Nombre</TableHead>
                    <TableHead className="font-semibold">Precio</TableHead>
                    <TableHead className="font-semibold">Categoría</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProductos.map((prod) => (
                    <TableRow key={prod.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">#{prod.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-black" />
                          <span className="font-medium">{prod.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-black">
                        ${Number(prod.precio).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                          {prod.categoria?.nombre}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
