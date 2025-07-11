"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Tag,
  DollarSign,
  Info,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: {
    id: number;
    nombre: string;
  };
}

interface ComboProducto {
  id?: number;
  productoId: number;
  cantidad: number;
  producto?: Producto;
}

interface Combo {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  productos: ComboProducto[];
}

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  
  // Estado para el formulario de combo
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComboId, setEditingComboId] = useState<number | null>(null);
  const [comboForm, setComboForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    activo: true,
    productos: [] as ComboProducto[]
  });
  
  // Estado para el selector de producto
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProductCantidad, setSelectedProductCantidad] = useState<string>("1");

  // Cargar combos y productos al inicio
  useEffect(() => {
    fetchCombos();
    fetchProductos();
  }, []);

  // Función para obtener combos
  const fetchCombos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://192.168.0.102:3001/combos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCombos(response.data);
    } catch (error) {
      console.error('Error al obtener combos:', error);
      toast.error('Error al cargar los combos');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener productos
  const fetchProductos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://192.168.0.102:3001/productos', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProductos(response.data);
    } catch (error) {
      console.error('Error al obtener productos:', error);
      toast.error('Error al cargar los productos');
    }
  };

  // Filtrar combos por término de búsqueda y estado activo
  const filteredCombos = combos.filter(combo => {
    const matchesSearch = combo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = showInactive ? true : combo.activo;
    return matchesSearch && matchesActive;
  });

  // Resetear el formulario
  const resetForm = () => {
    setComboForm({
      nombre: "",
      descripcion: "",
      precio: "",
      activo: true,
      productos: []
    });
    setEditingComboId(null);
  };

  // Abrir diálogo para crear un nuevo combo
  const handleCreateCombo = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Abrir diálogo para editar un combo existente
  const handleEditCombo = (combo: Combo) => {
    setEditingComboId(combo.id);
    setComboForm({
      nombre: combo.nombre,
      descripcion: combo.descripcion || "",
      precio: combo.precio.toString(),
      activo: combo.activo,
      productos: combo.productos.map(p => ({
        productoId: p.productoId,
        cantidad: p.cantidad,
        producto: p.producto
      }))
    });
    setIsDialogOpen(true);
  };

  // Añadir producto al combo
  const handleAddProductToCombo = () => {
    if (!selectedProductId || parseInt(selectedProductCantidad) <= 0) {
      toast.error('Seleccione un producto y una cantidad válida');
      return;
    }

    const productoId = parseInt(selectedProductId);
    const cantidad = parseInt(selectedProductCantidad);
    
    // Verificar si el producto ya está en el combo
    const productoExistente = comboForm.productos.find(p => p.productoId === productoId);
    if (productoExistente) {
      toast.error('Este producto ya está en el combo');
      return;
    }

    // Encontrar los detalles del producto
    const productoInfo = productos.find(p => p.id === productoId);
    
    // Añadir producto al combo
    setComboForm({
      ...comboForm,
      productos: [
        ...comboForm.productos,
        {
          productoId,
          cantidad,
          producto: productoInfo
        }
      ]
    });

    // Resetear selección
    setSelectedProductId("");
    setSelectedProductCantidad("1");
  };

  // Eliminar producto del combo
  const handleRemoveProductFromCombo = (productoId: number) => {
    setComboForm({
      ...comboForm,
      productos: comboForm.productos.filter(p => p.productoId !== productoId)
    });
  };

  // Guardar combo (crear o actualizar)
  const handleSaveCombo = async () => {
    if (!comboForm.nombre || !comboForm.precio || comboForm.productos.length === 0) {
      toast.error('Por favor complete todos los campos requeridos y añada al menos un producto');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const comboData = {
        nombre: comboForm.nombre,
        descripcion: comboForm.descripcion,
        precio: parseFloat(comboForm.precio),
        activo: comboForm.activo,
        productos: comboForm.productos.map(p => ({
          productoId: p.productoId,
          cantidad: p.cantidad
        }))
      };

      if (editingComboId) {
        // Actualizar combo existente
        await axios.patch(`http://192.168.0.102:3001/combos/${editingComboId}`, comboData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Combo actualizado con éxito');
      } else {
        // Crear nuevo combo
        await axios.post('http://192.168.0.102:3001/combos', comboData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Combo creado con éxito');
      }

      // Cerrar diálogo y recargar combos
      setIsDialogOpen(false);
      resetForm();
      fetchCombos();
    } catch (error) {
      console.error('Error al guardar combo:', error);
      toast.error('Error al guardar el combo');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar combo
  const handleDeleteCombo = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este combo?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://192.168.0.102:3001/combos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Combo eliminado con éxito');
      fetchCombos();
    } catch (error) {
      console.error('Error al eliminar combo:', error);
      toast.error('Error al eliminar el combo');
    } finally {
      setLoading(false);
    }
  };

  // Calcular precio total de un combo (suma de productos)
  const calcularPrecioProductos = (productos: ComboProducto[]) => {
    return productos.reduce((total, item) => {
      const producto = item.producto;
      if (!producto) return total;
      return total + (producto.precio * item.cantidad);
    }, 0);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Combos</h1>
          <p className="text-muted-foreground text-sm md:text-base">Administra los combos de productos disponibles</p>
        </div>
        <Button 
          onClick={handleCreateCombo}
          className="w-full md:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo Combo
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar combos..."
            className="pl-9 h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-10"
            onClick={() => setShowInactive(!showInactive)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showInactive ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            className="h-10 w-10"
            onClick={fetchCombos}
            disabled={loading}
            title="Actualizar"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {loading && combos.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-600">Cargando combos...</span>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-xl border border-dashed">
          <Package className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No hay combos</h3>
          <p className="text-sm text-gray-500 mt-1 text-center max-w-md">
            Crea tu primer combo para ofrecer ofertas especiales a tus clientes
          </p>
          <Button 
            onClick={handleCreateCombo} 
            className="mt-4"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Crear combo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCombos.map((combo) => (
            <Card key={combo.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {combo.nombre}
                  </CardTitle>
                  <Badge 
                    variant={combo.activo ? "default" : "secondary"}
                    className={combo.activo ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                  >
                    {combo.activo ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                
                {combo.descripcion && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {combo.descripcion}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      ${Number(combo.precio).toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">precio especial</span>
                  </div>
                  
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7"
                      >
                        <Info className="h-3.5 w-3.5 mr-1.5" />
                        Ver ahorro
                        <ChevronDown className="h-3.5 w-3.5 ml-1 transition-transform" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="bg-blue-50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Precio normal:</span>
                          <span className="font-medium">${Number(calcularPrecioProductos(combo.productos)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tu ahorro:</span>
                          <span className="font-medium text-green-600">
                            ${(Number(calcularPrecioProductos(combo.productos)) - Number(combo.precio)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-700">
                    Incluye {combo.productos.length} {combo.productos.length === 1 ? 'producto' : 'productos'}:
                  </div>
                  <ul className="space-y-2">
                    {combo.productos.map((item) => (
                      <li key={item.productoId} className="flex justify-between text-sm">
                        <span>{item.cantidad}x {item.producto?.nombre}</span>
                        <span className="text-gray-600">
                          ${((item.producto?.precio || 0) * item.cantidad).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditCombo(combo)}
                >
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteCombo(combo.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Diálogo para crear/editar combo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingComboId ? 'Editar Combo' : 'Crear Nuevo Combo'}
            </DialogTitle>
            <DialogDescription>
              Complete la información del combo y agregue los productos que lo componen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Combo</Label>
                <Input
                  id="nombre"
                  value={comboForm.nombre}
                  onChange={(e) => setComboForm({...comboForm, nombre: e.target.value})}
                  placeholder="Ej. Combo Familiar"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="precio">Precio ($)</Label>
                <Input
                  id="precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={comboForm.precio}
                  onChange={(e) => setComboForm({...comboForm, precio: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción (Opcional)</Label>
              <Textarea
                id="descripcion"
                value={comboForm.descripcion}
                onChange={(e) => setComboForm({...comboForm, descripcion: e.target.value})}
                placeholder="Describa brevemente el combo"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={comboForm.activo}
                onChange={(e) => setComboForm({...comboForm, activo: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="activo">Combo activo</Label>
            </div>
            
            <Separator className="my-2" />
            
            <div>
              <h3 className="text-sm font-medium mb-2">Agregar Productos al Combo</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Select
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un producto" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 rounded-md shadow-md">
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id.toString()} className="flex justify-between bg-white text-black hover:bg-slate-700/50 cursor-pointer border-none">
                          {producto.nombre} - ${Number(producto.precio).toFixed(2)} - Stock: {producto.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={selectedProductCantidad}
                    onChange={(e) => setSelectedProductCantidad(e.target.value)}
                    className="w-20"
                  />
                  <Button
                    onClick={handleAddProductToCombo}
                    disabled={!selectedProductId}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {comboForm.productos.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Productos en el Combo</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comboForm.productos.map((item) => (
                      <TableRow key={item.productoId}>
                        <TableCell>{item.producto?.nombre}</TableCell>
                        <TableCell className="text-center">{item.cantidad}</TableCell>
                        <TableCell className="text-right">${Number(item.producto?.precio).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${((Number(item.producto?.precio) || 0) * item.cantidad).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveProductFromCombo(item.productoId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">
                        Total Productos:
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ${Number(calcularPrecioProductos(comboForm.productos)).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                {/* Mostrar ahorro */}
                {comboForm.precio && (
                  <div className="mt-2 text-sm flex justify-end items-center gap-2">
                    <span>Ahorro en el combo:</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 font-medium">
                      ${(Number(calcularPrecioProductos(comboForm.productos)) - Number(comboForm.precio || "0")).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCombo} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  {editingComboId ? 'Actualizar' : 'Crear'} Combo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 