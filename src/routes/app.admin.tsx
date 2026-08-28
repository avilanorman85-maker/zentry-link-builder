import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPublicUrl } from "@/lib/public-url";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/admin")({ component: Admin });

function Admin() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [newPlan, setNewPlan] = useState<"premium" | "vip">("premium");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/app/dashboard", replace: true });
  }, [loading, user, isAdmin, nav]);

  const refresh = async () => {
    const [{ data: u }, { data: pg }, { data: c }] = await Promise.all([
      supabase.from("profiles").select("id,name,email,plan,custom_domain,public_url"),
      supabase.from("pages").select("id,user_id,title,slug,status,visits,updated_at").order("updated_at", { ascending: false }),
      supabase.from("activation_codes").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setUsers(u ?? []); setPages(pg ?? []); setCodes(c ?? []);
  };
  useEffect(() => { if (isAdmin) refresh(); }, [isAdmin]);

  const changePlan = async (id: string, plan: any) => {
    await supabase.from("profiles").update({ plan }).eq("id", id);
    toast.success("Plan actualizado");
    refresh();
  };

  const deleteCode = async (id: string, code: string) => {
    if (!confirm(`¿Eliminar el código ${code}?`)) return;
    const { error } = await supabase.from("activation_codes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Código eliminado");
    refresh();
  };

  const deleteUsedCodes = async () => {
    const usedIds = codes.filter((c) => c.used_by).map((c) => c.id);
    if (usedIds.length === 0) { toast.info("No hay códigos usados"); return; }
    if (!confirm(`¿Eliminar ${usedIds.length} código(s) usado(s)?`)) return;
    const { error } = await supabase.from("activation_codes").delete().in("id", usedIds);
    if (error) { toast.error(error.message); return; }
    toast.success("Códigos usados eliminados");
    refresh();
  };

  const generateCode = async () => {
    const code = "ZENTRY-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    const { error } = await supabase.from("activation_codes").insert({ code, plan: newPlan });
    if (error) { toast.error(error.message); return; }
    toast.success(`Código creado: ${code}`);
    refresh();
  };

  const usersById = Object.fromEntries(users.map((u) => [u.id, u]));

  if (!isAdmin) return null;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Panel de Admin</h1>
        <p className="text-muted-foreground">Visión completa de todas las cuentas y páginas.</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="pages">Páginas ({pages.length})</TabsTrigger>
          <TabsTrigger value="codes">Códigos</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="rounded-2xl border border-border bg-card p-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Dominio</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select value={u.plan} onValueChange={(v) => changePlan(u.id, v)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.custom_domain || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pages" className="rounded-2xl border border-border bg-card p-6">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Título</TableHead><TableHead>Propietario</TableHead><TableHead>Slug</TableHead><TableHead>Visitas</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => {
                const owner = usersById[p.user_id];
                const url = getPublicUrl({ slug: p.slug, plan: owner?.plan, customDomain: owner?.custom_domain });
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell className="text-xs">{owner?.email ?? p.user_id.slice(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{p.slug}</TableCell>
                    <TableCell>{p.visits}</TableCell>
                    <TableCell>
                      <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                        <ExternalLink className="h-3 w-3" /> Ver
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="codes" className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex gap-2">
            <Select value={newPlan} onValueChange={(v: any) => setNewPlan(v)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateCode} className="bg-gradient-neon text-background font-semibold">Generar código</Button>
            <Button onClick={deleteUsedCodes} variant="destructive" className="ml-auto">Eliminar usados</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Plan</TableHead><TableHead>Estado</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.code}</TableCell>
                  <TableCell>{c.plan}</TableCell>
                  <TableCell>{c.used_by ? "Usado" : <span className="text-[var(--neon-green)]">Disponible</span>}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => deleteCode(c.id, c.code)} className="text-destructive hover:text-destructive">Eliminar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
