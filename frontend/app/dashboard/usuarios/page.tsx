"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Mail,
  Phone,
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff,
  CalendarDays,
  UserPlus,
  FilterX,
  Loader2
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  telefono?: string;
  rol: {
    id: number;
    nombre: string;
  };
  createdAt: string;
}

interface Rol {
  id: number;
  nombre: string;
}

export default function UsersPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      nombre: "",
      telefono: "",
      password: "",
      rolId: "",
    },
  });

  const editForm = useForm({
    defaultValues: {
      email: "",
      nombre: "",
      telefono: "",
      password: "",
      rolId: "",
    },
  });

  // Fetch usuarios y roles
  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://192.168.0.102:3001/auth/usuarios", { headers });

      let users = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setUsuarios(users);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://192.168.0.102:3001/roles", { headers });

      let rolesData = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setRoles(rolesData);
    } catch (err) {
      console.error("Error al obtener roles:", err);
      setRoles([]);
    }
  };

  // Crear usuario
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const userData = {
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        rolId: parseInt(data.rolId),
        password: data.password
      };

      // Crear nuevo usuario
      const res = await axios.post("http://192.168.0.102:3001/auth/register", userData, { headers });
      setUsuarios(prev => [...prev, res.data.user]);
      form.reset();
      setIsCreateModalOpen(false);
    } catch (err: any) {
      console.error("Error al guardar usuario:", err);
      if (err.response?.status === 403) {
        alert("No tienes permisos para realizar esta acción. Solo los administradores pueden crear usuarios.");
      } else if (err.response?.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      } else {
        alert(err.response?.data?.message || "Error al guardar el usuario");
      }
    }
    setLoading(false);
  };

  // Actualizar usuario
  const onEditSubmit = async (data: any) => {
    if (!editingUser) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("No estás autenticado. Por favor, inicia sesión nuevamente.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const userData = {
        email: data.email,
        nombre: data.nombre,
        telefono: data.telefono,
        rolId: parseInt(data.rolId),
        ...(data.password && { password: data.password })
      };

      // Actualizar usuario existente
      const res = await axios.put(`http://192.168.0.102:3001/auth/usuarios/${editingUser.id}`, userData, { headers });
      setUsuarios(prev => prev.map(user =>
        user.id === editingUser.id ? res.data : user
      ));
      editForm.reset();
      setIsEditModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      console.error("Error al actualizar usuario:", err);
      if (err.response?.status === 403) {
        alert("No tienes permisos para realizar esta acción.");
      } else if (err.response?.status === 401) {
        alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
      } else {
        alert(err.response?.data?.message || "Error al actualizar el usuario");
      }
    }
    setLoading(false);
  };

  // Eliminar usuario
  const deleteUser = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://192.168.0.102:3001/auth/usuarios/${id}`, { headers });
      setUsuarios(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  // Editar usuario
  const editUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    editForm.setValue("email", usuario.email);
    editForm.setValue("nombre", usuario.nombre);
    editForm.setValue("telefono", usuario.telefono || "");
    editForm.setValue("rolId", usuario.rol.id.toString());
    editForm.setValue("password", ""); // No mostrar password actual
    setIsEditModalOpen(true);
  };

  // Cancelar edición
  const cancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    editForm.reset();
  };

  // Cancelar creación
  const cancelCreate = () => {
    setIsCreateModalOpen(false);
    form.reset();
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setFilterRole("all");
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.rol.id.toString() === filterRole;

    return matchesSearch && matchesRole;
  });

  // Estadísticas
  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.rol.nombre?.toLowerCase().includes('admin')).length,
  };

  return (
    <div className="space-y-8 p-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Usuarios</h1>
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
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="rounded-full shadow-sm bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-slate-500 to-slate-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Usuarios
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500 shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-sm flex items-center text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl overflow-hidden shadow-md transition-all duration-200 hover:shadow-lg">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-400"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administradores
            </CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 shadow-sm">
              <Shield className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.admins}</div>
            <p className="text-sm flex items-center text-muted-foreground">
              Con permisos de admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden bg-white border shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-sky-400"></div>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="h-6 w-6 text-blue-500" />
              Nuevo Usuario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Completa el formulario para crear un nuevo usuario
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
                      <FormLabel className="text-sm font-medium">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre del usuario..." 
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
                  name="email"
                  rules={{
                    required: "El email es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="usuario@ejemplo.com" 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Teléfono
                          <span className="text-muted-foreground ml-1">(Opcional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1234567890" 
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
                    name="rolId"
                    rules={{ required: "El rol es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((rol) => (
                              <SelectItem key={rol.id} value={rol.id.toString()} className="bg-white">
                                {rol.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="password"
                  rules={{ required: "La contraseña es requerida" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña..."
                            {...field}
                            className="h-10 rounded-lg bg-white border-slate-200 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                    className="rounded-lg bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span>Crear Usuario</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-xl p-0 overflow-hidden bg-white border shadow-lg">
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 to-yellow-400"></div>
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Edit className="h-6 w-6 text-amber-500" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Modifica los datos del usuario seleccionado
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
                      <FormLabel className="text-sm font-medium">Nombre Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre del usuario..." 
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
                  name="email"
                  rules={{
                    required: "El email es requerido",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email inválido"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="usuario@ejemplo.com" 
                          {...field} 
                          className="h-10 rounded-lg bg-white border-slate-200"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          Teléfono
                          <span className="text-muted-foreground ml-1">(Opcional)</span>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+1234567890" 
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
                    name="rolId"
                    rules={{ required: "El rol es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Rol</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg bg-white border-slate-200">
                              <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((rol) => (
                              <SelectItem key={rol.id} value={rol.id.toString()}>
                                {rol.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Nueva Contraseña
                        <span className="text-muted-foreground ml-1">(dejar vacío para mantener actual)</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Nueva contraseña..."
                            {...field}
                            className="h-10 rounded-lg bg-white border-slate-200 pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
                        <span>Actualizar Usuario</span>
                      </div>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <Card className="rounded-xl shadow-sm overflow-hidden border-none">
        <div className="h-1 w-full bg-gradient-to-r from-slate-400 to-slate-300"></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6">
          <CardTitle className="flex items-center text-lg">
            <Users className="h-5 w-5 mr-2 text-slate-500" />
            Lista de Usuarios
            <Badge 
              variant="outline" 
              className="ml-3 py-0.5 px-2 rounded-md text-xs bg-slate-50 text-slate-500 border-slate-200"
            >
              {filteredUsuarios.length} de {usuarios.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64 border-slate-200 rounded-lg"
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
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px] h-9 rounded-lg border-slate-200">
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map((rol) => (
                  <SelectItem key={rol.id} value={rol.id.toString()} className="hover:bg-slate-50 transition-colors data-[highlighted]:bg-slate-100 bg-white">
                    {rol.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchTerm || filterRole !== "all") && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="rounded-lg h-9"
              >
                <FilterX className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4 opacity-70" />
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : filteredUsuarios.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-slate-500 mb-2">
                {searchTerm || filterRole !== "all"
                  ? "No se encontraron usuarios"
                  : "No hay usuarios registrados"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {searchTerm || filterRole !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primer usuario del sistema"
                }
              </p>
              {searchTerm || filterRole !== "all" ? (
                <Button 
                  variant="outline"
                  onClick={clearFilters}
                  className="rounded-lg"
                >
                  <FilterX className="h-4 w-4 mr-2" />
                  Limpiar Filtros
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-lg bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Crear Primer Usuario
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
                      <TableHead className="font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Usuario</TableHead>
                      <TableHead className="font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Contacto</TableHead>
                      <TableHead className="text-center font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Rol</TableHead>
                      <TableHead className="text-center font-medium text-slate-500 text-xs uppercase tracking-wider py-3">Registro</TableHead>
                      <TableHead className="text-right font-medium text-slate-500 text-xs uppercase tracking-wider py-3 w-[70px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsuarios.map((usuario) => (
                      <TableRow key={usuario.id} className="hover:bg-slate-50 border-t border-slate-100">
                        <TableCell className="font-mono text-sm text-slate-500 py-3">
                          #{usuario.id}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center space-x-3">
                            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                              <span className="text-sm font-medium">
                                {usuario.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-slate-700">{usuario.nombre}</div>
                              <div className="text-xs text-slate-500 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {usuario.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          {usuario.telefono ? (
                            <div className="flex items-center text-xs text-slate-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {usuario.telefono}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Sin teléfono</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 text-xs">
                            <Shield className="h-3 w-3 mr-1 text-slate-400" />
                            {usuario.rol.nombre}
                          </div>
                        </TableCell>
                        <TableCell className="text-center py-3">
                          <div className="text-xs text-slate-500">
                            {new Date(usuario.createdAt).toLocaleDateString()}
                          </div>
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
                                onClick={() => editUser(usuario)}
                                className="cursor-pointer"
                              >
                                <Edit className="h-4 w-4 mr-2 text-amber-500" />
                                <span>Editar</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteUser(usuario.id)}
                                className="cursor-pointer"
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
                  Mostrando {filteredUsuarios.length} {filteredUsuarios.length === 1 ? "usuario" : "usuarios"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}