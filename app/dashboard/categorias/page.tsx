"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FolderOpen,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import axios from "axios";

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
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/categorias", { headers });

      let cats = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setCategorias(cats);
    } catch (err) {
      console.error("Error al obtener categorías:", err);
      setCategorias([]);
    }
  };

  // Crear nueva categoría
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post("http://localhost:3001/categorias", {
        nombre: data.nombre,
        descripcion: data.descripcion,
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

      const res = await axios.put(`http://localhost:3001/categorias/${editingCategory.id}`, {
        nombre: data.nombre,
        descripcion: data.descripcion,
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
      await axios.delete(`http://localhost:3001/categorias/${id}`, { headers });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Categorías</h1>
          <p className="text-muted-foreground">
            Organiza tus productos en categorías para una mejor gestión
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categorías</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorías registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categorias.reduce((total, cat) => total + (cat._count?.productos || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las categorías
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categorias.filter(cat => (cat._count?.productos || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Con productos asignados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create Category Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nueva Categoría
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Completa el formulario para crear una nueva categoría
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
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
                          className="h-10"
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
                          className="h-10"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelCreate}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Guardando...
                    </div>
                  ) : (
                    "Crear Categoría"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Categoría
            </DialogTitle>
            <DialogDescription>
              Modifica los detalles de la categoría seleccionada
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="nombre"
                rules={{ required: "El nombre es requerido" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Bebidas, Platos principales..." {...field} />
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
                    <FormLabel>Descripción (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción de la categoría..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="h-5 w-5 mr-2" />
            Lista de Categorías
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredCategorias.length} de {categorias.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategorias.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? "No se encontraron categorías" : "No hay categorías registradas"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : "Comienza creando tu primera categoría para organizar tus productos"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Categoría
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Productos</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria) => (
                    <TableRow key={categoria.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        #{categoria.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium">{categoria.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {categoria.descripcion || "Sin descripción"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Package className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="font-medium">
                            {categoria._count?.productos || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {(categoria._count?.productos || 0) > 0 ? (
                          <div className="flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />
                            <span className="text-sm text-green-600 font-medium">Activa</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                            <span className="text-sm text-yellow-600 font-medium">Vacía</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editCategory(categoria)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCategory(categoria.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={(categoria._count?.productos || 0) > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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