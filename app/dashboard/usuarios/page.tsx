"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Calendar,
  Filter,
  MoreHorizontal,
  Eye,
  EyeOff
} from "lucide-react";
import axios from "axios";

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  telefono?: string;
  rol: {
    id: number;
    nombre: string;
  };
  activo: boolean;
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
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
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/auth/usuarios", { headers });

      let users = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setUsuarios(users);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
      setUsuarios([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get("http://localhost:3001/roles", { headers });

      let rolesData = Array.isArray(res.data) ? res.data : Array.isArray(res.data.data) ? res.data.data : [];
      setRoles(rolesData);
    } catch (err) {
      console.error("Error al obtener roles:", err);
      setRoles([]);
    }
  };

  // Crear o actualizar usuario
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
        ...(data.password && { password: data.password })
      };

      if (editingUser) {
        // Actualizar usuario existente
        const res = await axios.put(`http://localhost:3001/auth/usuarios/${editingUser.id}`, userData, { headers });
        setUsuarios(prev => prev.map(user =>
          user.id === editingUser.id ? res.data : user
        ));
        setEditingUser(null);
      } else {
        // Crear nuevo usuario
        const res = await axios.post("http://localhost:3001/auth/register", userData, { headers });
        setUsuarios(prev => [...prev, res.data.user]);
      }

      form.reset();
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

  // Eliminar usuario
  const deleteUser = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:3001/auth/usuarios/${id}`, { headers });
      setUsuarios(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  // Cambiar estado del usuario
  const toggleUserStatus = async (id: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.patch(`http://localhost:3001/auth/usuarios/${id}/status`, {
        activo: !currentStatus
      }, { headers });

      setUsuarios(prev => prev.map(user =>
        user.id === id ? { ...user, activo: !currentStatus } : user
      ));
    } catch (err) {
      console.error("Error al cambiar estado del usuario:", err);
    }
  };

  // Editar usuario
  const editUser = (usuario: Usuario) => {
    setEditingUser(usuario);
    form.setValue("email", usuario.email);
    form.setValue("nombre", usuario.nombre);
    form.setValue("telefono", usuario.telefono || "");
    form.setValue("rolId", usuario.rol.id.toString());
    form.setValue("password", ""); // No mostrar password actual
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingUser(null);
    form.reset();
  };

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.rol.id.toString() === filterRole;
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active" && user.activo) ||
                         (filterStatus === "inactive" && !user.activo);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: usuarios.length,
    active: usuarios.filter(u => u.activo).length,
    inactive: usuarios.filter(u => !u.activo).length,
    admins: usuarios.filter(u => u.rol.nombre.toLowerCase().includes('admin')).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema y sus permisos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Con acceso al sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Sin acceso al sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">
              Con permisos de admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Rol</label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={rol.id.toString()}>
                      {rol.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Estado</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {editingUser ? "Editar Usuario" : "Añadir Nuevo Usuario"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nombre"
                  rules={{ required: "El nombre es requerido" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del usuario..." {...field} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="usuario@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
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
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                control={form.control}
                name="password"
                rules={editingUser ? {} : { required: "La contraseña es requerida" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {editingUser ? "Nueva Contraseña (dejar vacío para mantener actual)" : "Contraseña"}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Contraseña..."
                          {...field}
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

              <div className="flex items-center space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : editingUser ? "Actualizar Usuario" : "Crear Usuario"}
                </Button>
                {editingUser && (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Lista de Usuarios
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredUsuarios.length} de {usuarios.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsuarios.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm || filterRole !== "all" || filterStatus !== "all"
                  ? "No se encontraron usuarios"
                  : "No hay usuarios registrados"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || filterRole !== "all" || filterStatus !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primer usuario del sistema"
                }
              </p>
              {!searchTerm && filterRole === "all" && filterStatus === "all" && (
                <Button onClick={() => document.querySelector('input[placeholder*="Nombre"]')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Usuario
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead className="text-center">Rol</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono font-medium">
                        #{usuario.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {usuario.nombre.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{usuario.nombre}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {usuario.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {usuario.telefono ? (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {usuario.telefono}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sin teléfono</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Shield className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="font-medium">{usuario.rol.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          {usuario.activo ? (
                            <>
                              <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-600 font-medium">Activo</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-sm text-red-600 font-medium">Inactivo</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(usuario.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(usuario.id, usuario.activo)}
                            className="h-8 w-8 p-0"
                            title={usuario.activo ? "Desactivar usuario" : "Activar usuario"}
                          >
                            {usuario.activo ? (
                              <UserX className="h-4 w-4 text-red-600" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editUser(usuario)}
                            className="h-8 w-8 p-0"
                            title="Editar usuario"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteUser(usuario.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Eliminar usuario"
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