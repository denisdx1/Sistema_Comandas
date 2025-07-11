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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  SelectValue,} from "@/components/ui/select";
import { PlusCircle, Package, DollarSign, Tag, Search, AlertCircle, Loader2, CheckCircle2, Plus, Edit, Pencil, Trash2, AlertTriangle } from "lucide-react";
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
  stock: number;
  categoria?: { id: number; nombre: string };
  categoriaId?: number;
}

export default function ProductsPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);

  const form = useForm({
    defaultValues: {
      nombre: "",
      precio: "",
      stock: "0",
      categoriaId: "",
    },
    mode: "onSubmit",
  });
  
  const editForm = useForm({
    defaultValues: {
      nombre: "",
      precio: "",
      stock: "0",
      categoriaId: "",
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios.get("http://192.168.0.102:3001/productos", { headers })
      .then((res) => setProductos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error al obtener productos:", err));

    axios.get("http://192.168.0.102:3001/categorias", { headers })
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
    // Validación manual antes de enviar
    if (!data.nombre) {
      form.setError("nombre", { type: "required", message: "El nombre es obligatorio" });
      return;
    }
    if (!data.precio) {
      form.setError("precio", { type: "required", message: "El precio es obligatorio" });
      return;
    }
    if (parseFloat(data.precio) <= 0) {
      form.setError("precio", { type: "min", message: "El precio debe ser mayor a 0" });
      return;
    }
    if (!data.categoriaId) {
      form.setError("categoriaId", { type: "required", message: "La categoría es obligatoria" });
      return;
    }
    
    setLoading(true);
    setShowSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.post(
        "http://192.168.0.102:3001/productos",
        {
          nombre: data.nombre,
          precio: parseFloat(data.precio),
          stock: parseFloat(data.stock),
          categoriaId: parseInt(data.categoriaId),
        },
        { headers }
      );

      if (res.data) {
        setProductos((prev) => [...prev, res.data]);
        form.reset();
        setShowSuccess(true);
        // Ocultar el mensaje de éxito después de 3 segundos
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error al crear producto:", err);
    }
    setLoading(false);
  };
  
  // Función para editar un producto
  const editProduct = (producto: Producto) => {
    setEditingProduct(producto);
    editForm.setValue("nombre", producto.nombre);
    editForm.setValue("precio", producto.precio.toString());
    editForm.setValue("stock", producto.stock.toString());
    editForm.setValue("categoriaId", (producto.categoria?.id || producto.categoriaId)?.toString() || "");
    setIsEditModalOpen(true);
  };
  
  // Confirmar eliminación de producto
  const confirmDelete = (id: number) => {
    setProductToDelete(id);
    setIsDeleteAlertOpen(true);
  };

  // Eliminar producto
  const deleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://192.168.0.102:3001/productos/${productToDelete}`, { headers });
      setProductos(prev => prev.filter(prod => prod.id !== productToDelete));
      setSuccessMessage("Producto eliminado correctamente");
      setTimeout(() => setSuccessMessage(""), 3000);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error al eliminar producto:", err);
    }
  };
  
  // Función para actualizar un producto
  const onEditSubmit = async (data: any) => {
    if (!editingProduct) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.patch(
        `http://192.168.0.102:3001/productos/${editingProduct.id}`,
        {
          nombre: data.nombre,
          precio: parseFloat(data.precio),
          stock: parseFloat(data.stock),
          categoriaId: parseInt(data.categoriaId),
        },
        { headers }
      );

      setProductos(prev => prev.map(prod =>
        prod.id === editingProduct.id ? res.data : prod
      ));
      setIsEditModalOpen(false);
      setEditingProduct(null);
      editForm.reset();
    } catch (err) {
      console.error("Error al actualizar producto:", err);
    }
    setLoading(false);
  };
  
  // Función para cancelar la edición
  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingProduct(null);
    editForm.reset();
  };

  const filteredProductos = productos.filter(prod =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo para la paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProductos.slice(indexOfFirstItem, indexOfLastItem);
  
  // Efecto para resetear la página cuando cambia el término de búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  
  // Función para cambiar de página
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Función para ir a la página anterior
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Función para ir a la página siguiente
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-black/5 to-transparent p-6 rounded-xl border border-black/10 shadow-sm mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-black to-black/70 bg-clip-text text-transparent">Gestión de Productos</h1>
          <p className="text-muted-foreground mt-1">
            Administra y organiza los productos de tu negocio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-black/5 hover:shadow-lg transition-all duration-300 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center">
              <Package className="h-4 w-4 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{productos.length}</div>
            <p className="text-xs text-muted-foreground">
              Productos registrados
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-black/5 hover:shadow-lg transition-all duration-300 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <div className="h-8 w-8 rounded-full bg-black/5 flex items-center justify-center">
              <Tag className="h-4 w-4 text-black" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{categorias.length}</div>
            <p className="text-xs text-muted-foreground">
              Categorías disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-white to-green-50 hover:shadow-lg transition-all duration-300 card-hover">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              ${formatPrice(calculateTotal(productos))}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total del inventario
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border border-black/10 bg-gradient-to-br from-white to-black/5 overflow-hidden rounded-xl">
        <CardHeader className="pb-4 border-b border-black/10">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-black to-black/70 bg-clip-text text-transparent">
              Añadir Nuevo Producto
            </span>
          </CardTitle>
          <CardDescription className="mt-2">
            Complete el formulario para agregar un nuevo producto al sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {showSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative mb-4 flex items-center shadow-sm animate-fade-in">
              <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
              <span className="font-medium">Producto creado con éxito</span>
            </div>
          )}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                        <Package className="h-3 w-3 text-black" />
                      </div>
                      Nombre del Producto
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej. Coca Cola" 
                        {...field} 
                        className={`h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all ${form.formState.errors.nombre ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs animate-fade-in" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="precio"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-green-50 flex items-center justify-center">
                        <DollarSign className="h-3 w-3 text-green-600" />
                      </div>
                      Precio
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="Ej. 10.50" 
                        {...field} 
                        className={`h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all ${form.formState.errors.precio ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs animate-fade-in" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                        <Tag className="h-3 w-3 text-black" />
                      </div>
                      Stock
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1" 
                        min="0" 
                        placeholder="Ej. 100" 
                        {...field} 
                        className={`h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all ${form.formState.errors.stock ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs animate-fade-in" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoriaId"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="flex items-center gap-2 text-sm font-medium">
                      <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                        <Tag className="h-3 w-3 text-black" />
                      </div>
                      Categoría
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className={`h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all ${form.formState.errors.categoriaId ? 'border-red-300 focus-visible:ring-red-200' : ''}`}>
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
                    <FormMessage className="text-xs animate-fade-in" />
                  </FormItem>
                )}
              />
              <div className="flex items-end">
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-10 bg-gradient-to-r from-black to-black/80 text-white hover:from-black/90 hover:to-black/70 transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Añadir Producto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg border border-black/10 bg-gradient-to-br from-white to-black/5 overflow-hidden rounded-xl mt-8">
        <CardHeader className="pb-4 border-b border-black/10">
          <CardTitle className="text-xl flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-black to-black/70 bg-clip-text text-transparent">
              Lista de Productos
            </span>
            <span className="ml-2 text-sm font-normal bg-black/5 px-2 py-1 rounded-full">
              {filteredProductos.length} de {productos.length}
            </span>
          </CardTitle>
          <CardDescription className="mt-2">
            Visualiza y gestiona todos los productos registrados
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {filteredProductos.length === 0 ? (
            <div className="text-center py-12 px-4 bg-gradient-to-b from-transparent to-black/5 rounded-xl border border-dashed border-black/20">
              <div className="h-16 w-16 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-black/40" />
              </div>
              <h3 className="text-xl font-medium text-black/80 mb-2">
                {searchTerm ? "No se encontraron productos" : "No hay productos registrados"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda o verifica que el producto exista en el sistema."
                  : "Comienza agregando tu primer producto al sistema para gestionar tu inventario de manera eficiente."
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => {
                    const input = document.querySelector('input[placeholder*="Nombre"]') as HTMLInputElement;
                    input?.focus();
                  }}
                  className="bg-gradient-to-r from-black to-black/80 text-white hover:from-black/90 hover:to-black/70 transition-all shadow-md hover:shadow-lg px-6"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[400px] rounded-xl border border-black/10 shadow-inner bg-gradient-to-b from-white to-black/5">
              <Table className="relative">
                <TableHeader className="sticky top-0 bg-gradient-to-r from-gray-50 to-white z-10 shadow-sm">
                  <TableRow className="border-b border-black/10 hover:bg-transparent">
                    <TableHead className="w-[80px] font-semibold text-black/70 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-black/5 px-1.5 py-0.5 rounded">#</span>
                        <span>ID</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-black/70 py-4">
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5 text-black/50" />
                        <span>Nombre</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-black/70 py-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-green-500" />
                        <span>Precio</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-black/70 py-4">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-orange-500" />
                        <span>Stock</span>
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-black/70 py-4">
                      <div className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5 text-blue-500" />
                        <span>Categoría</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-black/70 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Edit className="h-3.5 w-3.5 text-blue-500" />
                        <span>Acciones</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="transition-all duration-300">
                  {currentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                          <Package className="h-8 w-8 text-black/20" />
                          <p>No hay productos en esta página</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((producto, index) => (
                    <TableRow 
                      key={producto.id} 
                      className="group transition-all border-b border-black/5 hover:bg-gradient-to-r hover:from-black/5 hover:to-transparent cursor-pointer"
                    >
                      <TableCell className="font-medium text-black/80 group-hover:text-black">
                        <div className="bg-black/5 text-black/70 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm group-hover:bg-black/10 transition-all">
                          {producto.id}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-black/80 group-hover:text-black transition-colors">
                        {producto.nombre}
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center">
                            <DollarSign className="h-3 w-3 text-green-600" />
                          </div>
                          <span className="text-emerald-600 font-medium">
                            {formatPrice(producto.precio)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center">
                            <Tag className="h-3 w-3 text-orange-600" />
                          </div>
                          <span className="text-orange-600 font-medium">
                            {producto.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 shadow-sm">
                          {categorias.find(
                            (cat) => cat.id === (producto.categoria?.id || producto.categoriaId)
                          )?.nombre || "Sin categoría"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editProduct(producto)}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200"
                            title="Editar producto"
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e: { stopPropagation: () => void; }) => {
                              e.stopPropagation();
                              confirmDelete(producto.id);
                            }}
                            className="h-8 w-8 p-0 bg-gradient-to-r from-red-50 to-red-100 border-red-200 hover:bg-red-100 hover:text-red-700 transition-all duration-200"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                  
                  </TableBody>
              </Table>
            </ScrollArea>
          )}
          
          {/* Controles de paginación */}
          {filteredProductos.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 px-2 gap-4 animate-fade-in">
              <div className="text-sm text-muted-foreground bg-black/5 px-3 py-1.5 rounded-lg shadow-sm">
                Mostrando <span className="font-medium text-black">{indexOfFirstItem + 1}</span> a <span className="font-medium text-black">
                  {Math.min(indexOfLastItem, filteredProductos.length)}
                </span> de <span className="font-medium text-black">{filteredProductos.length}</span> productos
              </div>
              
              <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-black/5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToPreviousPage} 
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0 flex items-center justify-center border-black/10 hover:bg-black/5 disabled:opacity-50 transition-all duration-200 ease-in-out"
                  aria-label="Ir a la página anterior"
                  title="Página anterior"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                </Button>
                
                <div className="flex items-center space-x-1">
                   {/* Optimización para mostrar un número limitado de botones de página */}
                   {Array.from({ length: totalPages }, (_, i) => i + 1)
                     .filter(page => {
                       // Siempre mostrar la primera y última página
                       if (page === 1 || page === totalPages) return true;
                       // Mostrar páginas cercanas a la página actual
                       if (Math.abs(page - currentPage) <= 1) return true;
                       // Mostrar elipsis para indicar páginas omitidas
                       if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) return true;
                       return false;
                     })
                     .map((page, index, array) => {
                       // Mostrar elipsis si hay saltos en la secuencia
                       if (index > 0 && page - array[index - 1] > 1) {
                         return (
                           <React.Fragment key={`ellipsis-${page}`}>
                             <span className="px-2 text-muted-foreground">...</span>
                             <Button
                               key={page}
                               variant={currentPage === page ? "default" : "outline"}
                               size="sm"
                               onClick={() => paginate(page)}
                               className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-black text-white hover:bg-black/90' : 'border-black/10 hover:bg-black/5'}`}
                             >
                               {page}
                             </Button>
                           </React.Fragment>
                         );
                       }
                       return (
                         <Button
                           key={page}
                           variant={currentPage === page ? "default" : "outline"}
                           size="sm"
                           onClick={() => paginate(page)}
                           className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-black text-white hover:bg-black/90' : 'border-black/10 hover:bg-black/5'}`}
                         >
                           {page}
                         </Button>
                       );
                     })}
                 </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0 flex items-center justify-center border-black/10 hover:bg-black/5 disabled:opacity-50 transition-all duration-200 ease-in-out"
                  aria-label="Ir a la página siguiente"
                  title="Página siguiente"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                </Button>
                
                <Select 
                  value={itemsPerPage.toString()} 
                  onValueChange={(value: string) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1); // Resetear a la primera página cuando cambia el número de items
                  }}
                  aria-label="Seleccionar número de productos por página"
                >
                  <SelectTrigger className="h-8 w-[110px] border-black/10 focus:ring-black/20 transition-all duration-200 ease-in-out">
                    <SelectValue placeholder="5 por página" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[110px]">
                    <SelectItem value="5">5 por página</SelectItem>
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="15">15 por página</SelectItem>
                    <SelectItem value="20">20 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white/80 backdrop-blur-md border border-black/10 shadow-xl rounded-xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Pencil className="h-4 w-4 text-blue-600" />
              </div>
              <span className="bg-gradient-to-r from-black to-black/70 bg-clip-text text-transparent">
                Editar Producto
              </span>
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modifica los detalles del producto seleccionado
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={editForm.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                          <Package className="h-3 w-3 text-black" />
                        </div>
                        Nombre del Producto
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej. Coca Cola" 
                          {...field} 
                          className="h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs animate-fade-in" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="precio"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-green-50 flex items-center justify-center">
                          <DollarSign className="h-3 w-3 text-green-600" />
                        </div>
                        Precio
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0" 
                          placeholder="Ej. 10.50" 
                          {...field} 
                          className="h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all" 
                        />
                      </FormControl>
                      <FormMessage className="text-xs animate-fade-in" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                          <Tag className="h-3 w-3 text-black" />
                        </div>
                        Stock
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1" 
                          min="0" 
                          placeholder="Ej. 100" 
                          {...field} 
                          className={`h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all ${editForm.formState.errors.stock ? 'border-red-300 focus-visible:ring-red-200' : ''}`} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs animate-fade-in" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="categoriaId"
                  render={({ field }) => (
                    <FormItem className="space-y-2 md:col-span-2">
                      <FormLabel className="flex items-center gap-2 text-sm font-medium">
                        <div className="h-5 w-5 rounded-full bg-black/5 flex items-center justify-center">
                          <Tag className="h-3 w-3 text-black" />
                        </div>
                        Categoría
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 border-black/20 focus:border-black/30 focus:ring-2 focus:ring-black/20 transition-all">
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
                      <FormMessage className="text-xs animate-fade-in" />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={cancelEdit}
                  className="border-black/20 hover:bg-black/5 transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-black to-black/80 text-white hover:from-black/90 hover:to-black/70 transition-all shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar eliminación */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="bg-white/90 backdrop-blur-md border border-red-100 shadow-xl rounded-xl overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
                Confirmar Eliminación
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar este producto?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-black/10 text-black/70 hover:bg-black/5 hover:text-black transition-all">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteProduct}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
