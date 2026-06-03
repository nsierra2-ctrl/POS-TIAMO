import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { 
  useGetUsuarios, 
  useCrearUsuario, 
  useActualizarUsuario, 
  useEliminarUsuario, 
  getGetUsuariosQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_COLORS } from "@/lib/constants";
import { MoreHorizontal, Plus, Edit2, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function UsuariosPage() {
  const { data: usuarios, isLoading } = useGetUsuarios();
  const queryClient = useQueryClient();
  const crearUsuario = useCrearUsuario();
  const actualizarUsuario = useActualizarUsuario();
  const eliminarUsuario = useEliminarUsuario();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    usuario: "",
    contrasena: "",
    rol: "mesero" as "admin" | "mesero" | "cocinero" | "caja",
    activo: true
  });

  const openNew = () => {
    setEditingId(null);
    setFormData({ nombre: "", usuario: "", contrasena: "", rol: "mesero", activo: true });
    setIsDialogOpen(true);
  };

  const openEdit = (u: any) => {
    setEditingId(u.id);
    setFormData({ nombre: u.nombre, usuario: u.usuario, contrasena: "", rol: u.rol, activo: u.activo });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const dataToUpdate: any = {
        nombre: formData.nombre,
        rol: formData.rol,
        activo: formData.activo
      };
      if (formData.contrasena) dataToUpdate.contrasena = formData.contrasena;
      
      await actualizarUsuario.mutateAsync({ id: editingId, data: dataToUpdate });
    } else {
      await crearUsuario.mutateAsync({ 
        data: {
          nombre: formData.nombre,
          usuario: formData.usuario,
          contrasena: formData.contrasena,
          rol: formData.rol
        }
      });
    }
    queryClient.invalidateQueries({ queryKey: getGetUsuariosQueryKey() });
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      await eliminarUsuario.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getGetUsuariosQueryKey() });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 md:pb-0">
      <Navigation />
      <main className="flex-1 p-4 md:p-8 max-w-screen-2xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display">Usuarios</h1>
            <p className="text-muted-foreground">Gestión de personal y accesos</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4"/> Nuevo Usuario</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <Input required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                {!editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Usuario (Login)</label>
                    <Input required value={formData.usuario} onChange={e => setFormData({...formData, usuario: e.target.value})} />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">{editingId ? "Nueva Contraseña (opcional)" : "Contraseña"}</label>
                  <Input type="password" required={!editingId} value={formData.contrasena} onChange={e => setFormData({...formData, contrasena: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <Select value={formData.rol} onValueChange={(v: any) => setFormData({...formData, rol: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="mesero">Mesero</SelectItem>
                      <SelectItem value="cocinero">Cocinero</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editingId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estado</label>
                    <Select value={formData.activo ? "activo" : "inactivo"} onValueChange={(v) => setFormData({...formData, activo: v === "activo"})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full mt-4" disabled={crearUsuario.isPending || actualizarUsuario.isPending}>
                  Guardar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-card border-white/5">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground bg-black/20">
                    <th className="px-6 py-4 font-medium">Usuario</th>
                    <th className="px-6 py-4 font-medium">Login</th>
                    <th className="px-6 py-4 font-medium">Rol</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                    <th className="px-6 py-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Cargando...</td></tr>
                  ) : usuarios?.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{u.nombre}</td>
                      <td className="px-6 py-4 font-mono text-muted-foreground">{u.usuario}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded border ${STATUS_COLORS[u.rol]}`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {u.activo ? "Activo" : "Inactivo"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(u.id)}>
                              <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
