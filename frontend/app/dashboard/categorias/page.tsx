"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  FolderClosed,
  CalendarDays,
  FolderPlus,
  FilterX,
  Loader2
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  _count?: {
    productos: number;
  };
}

export default function CategoriesPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  const editForm = useForm({
    defaultValues: {
      nombre: "",
      descripcion: "",
    },
  });

  // Fetch categorías
  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://192.168.0.102:3001/categorias", { headers });

      let cats = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setCategorias(cats);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setCategorias([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Crear nueva categoría
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post("http://192.168.0.102:3001/categorias", {
        nombre: data.nombre
      }, { headers });

      setCategorias(prev => [...prev, res.data]);
      form.reset();
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error al guardar categoría:", err);
    }
    setLoading(false);
  };

  // Actualizar categoría
  const onEditSubmit = async (data: any) => {
    if (!editingCategory) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.put(`http://192.168.0.102:3001/categorias/${editingCategory.id}`, {
        nombre: data.nombre
      }, { headers });

      setCategorias(prev => prev.map(cat =>
        cat.id === editingCategory.id ? res.data : cat
      ));
      setIsEditModalOpen(false);
      setEditingCategory(null);
      editForm.reset();
    } catch (err) {
      console.error("Error al actualizar categoría:", err);
    }
    setLoading(false);
  };

  // Eliminar categoría
  const deleteCategory = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta categoría?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://192.168.0.102:3001/categorias/${id}`, { headers });
      setCategorias(prev => prev.filter(cat => cat.id !== id));
    } catch (err) {
      console.error("Error al eliminar categoría:", err);
    }
  };

  // Editar categoría
  const editCategory = (categoria: Categoria) => {
    setEditingCategory(categoria);
    editForm.setValue("nombre", categoria.nombre);
    editForm.setValue("descripcion", categoria.descripcion || "");
    setIsEditModalOpen(true);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    editForm.reset();
  };

  // Cancelar creación
  const cancelCreate = () => {
    setIsCreateModalOpen(false);
    form.reset();
  };

  // Filtrar categorías
  const filteredCategorias = categorias.filter(cat =>
    cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener totales para las estadísticas
  const totalCategorias = categorias.length;
  const totalProductos = categorias.reduce((total, cat) => total + (cat._count?.productos || 0), 0);
  const categoriasActivas = categorias.filter(cat => (cat._count?.productos || 0) > 0).length;

  return (
    <div className="space-y-8 p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Categorías</h1>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 border-slate-200 rounded-full"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 text-muted-foreground"
                onClick={() => setSearchTerm("")}
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full shadow-sm bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categorías
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 shadow-sm">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCategorias}</div>
            <p className="text-sm flex items-center text-muted-foreground">
              Categorías registradas en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-purple-500 to-indigo-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos Totales
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-500 shadow-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProductos}</div>
            <p className="text-sm flex items-center text-muted-foreground">
              Distribuidos en todas las categorías
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-green-500 to-emerald-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categorías con Productos
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categoriasActivas}</div>
            <p className="text-sm flex items-center text-muted-foreground">
              De un total de {totalCategorias} categorías
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Category Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden bg-white border shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 to-indigo-400"></div>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <FolderPlus className="h-6 w-6 text-purple-500" />
              Nueva Categoría
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Crea una nueva categoría para organizar tus productos
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  rules={{ required: "El nombre es requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Nombre de la Categoría
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Bebidas, Platos principales..." 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Descripción
                        <span className="text-muted-foreground ml-1">(Opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Describe el propósito de esta categoría..." 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6 gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelCreate}
                    className="rounded-lg"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FolderPlus className="h-4 w-4" />
                        <span>Crear Categoría</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden bg-white border shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Edit className="h-6 w-6 text-amber-500" />
              Editar Categoría
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modifica los detalles de la categoría seleccionada
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4">
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="nombre"
                  rules={{ required: "El nombre es requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre de la Categoría</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Bebidas, Platos principales..." 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Descripción
                        <span className="text-muted-foreground ml-1">(Opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Descripción de la categoría..." 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6 gap-2 sm:gap-0">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    className="rounded-lg"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span>Guardar Cambios</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <Card className="rounded-xl shadow-sm overflow-hidden border-none">
        <div className="h-1 w-full bg-gradient-to-r from-slate-400 to-slate-300"></div>
        <CardHeader className="pb-2 px-6">
          <CardTitle className="flex items-center text-lg">
            <FolderOpen className="h-5 w-5 mr-2 text-slate-500" />
            Lista de Categorías
            <Badge 
              variant="outline" 
              className="ml-3 py-0.5 px-2 rounded-md text-xs bg-slate-50 text-slate-500 border-slate-200"
            >
              {filteredCategorias.length} de {categorias.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4 opacity-70" />
              <p className="text-muted-foreground">Cargando categorías...</p>
            </div>
          ) : filteredCategorias.length === 0 ? (
            <div className="text-center py-16">
              <FolderClosed className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-500 mb-2">
                {searchTerm ? "No se encontraron categorías" : "No hay categorías registradas"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda o elimina los filtros"
                  : "Comienza creando tu primera categoría para organizar tus productos"
                }
              </p>
              {searchTerm ? (
                <Button 
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="rounded-lg"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Limpiar Búsqueda
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                >
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Crear Primera Categoría
                </Button>
              )}
            </div>
          ) : (
            <div className="px-3">
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[80px] font-medium text-slate-500 text-xs uppercase tracking-wider py-3">ID</TableHead>
                      <TableHead className="font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Nombre</TableHead>
                      <TableHead className="font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Descripción</TableHead>
                      <TableHead className="text-center font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Productos</TableHead>
                      <TableHead className="text-center font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Estado</TableHead>
                      <TableHead className="text-right font-medium text-slate-500 text-xs uppercase tracking-wider py-3 w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategorias.map((categoria) => (
                      <TableRow key={categoria.id} className="hover:bg-slate-50 border-t border-slate-100">
                        <TableCell className="font-mono text-sm text-slate-500 py-3">
                          #{categoria.id}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center">
                            <div className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center mr-3",
                              (categoria._count?.productos || 0) > 0 
                                ? "bg-green-50 text-green-500"
                                : "bg-amber-50 text-amber-500"
                            )}>
                              <FolderOpen className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-medium text-slate-700">{categoria.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-500 max-w-[300px] truncate text-sm py-3">
                          {categoria.descripcion || "Sin descripción"}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 text-xs">
                            <Package className="h-3 w-3 mr-1 text-slate-400" />
                            <span>{categoria._count?.productos || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          {(categoria._count?.productos || 0) > 0 ? (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs border border-green-100">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Activa
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs border border-amber-100">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Vacía
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-slate-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-lg bg-white/20 backdrop-blur-sm">
                              <DropdownMenuItem 
                                onClick={() => editCategory(categoria)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2 text-amber-500" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteCategory(categoria.id)}
                                disabled={(categoria._count?.productos || 0) > 0}
                                className={cn(
                                  "cursor-pointer",
                                  (categoria._count?.productos || 0) > 0 && "opacity-50 pointer-events-none"
                                )}
                              >
                                <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                <span className="text-red-500">Eliminar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 mb-3 px-2 flex justify-end">
                <div className="text-xs text-slate-500">
                  Mostrando {filteredCategorias.length} {filteredCategorias.length === 1 ? "categoría" : "categorías"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}