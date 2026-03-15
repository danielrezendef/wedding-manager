import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export default function Compartilhamento() {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("edit");

  const { data: invitesSent, isLoading: loadingSent, refetch: refetchSent } = trpc.invites.listSent.useQuery();
  const { data: permissions, isLoading: loadingPerms, refetch: refetchPerms } = trpc.invites.listPermissions.useQuery();

  const sendMutation = trpc.invites.send.useMutation({
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setEmail("");
      setPermission("edit");
      refetchSent();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = trpc.invites.revoke.useMutation({
    onSuccess: () => {
      toast.success("Acesso revogado com sucesso!");
      refetchPerms();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Digite um email");
      return;
    }
    sendMutation.mutate({ invitedEmail: email, permissions: permission });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
    };
    return variants[status] || "default";
  };

  if (loadingSent || loadingPerms) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Compartilhamento de Gerenciamento</h1>
        <p className="text-muted-foreground mt-2">
          Convide outras pessoas para gerenciar suas informações
        </p>
      </div>

      {/* Enviar Convite */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Convite</CardTitle>
          <CardDescription>
            Convide alguém para gerenciar suas informações de usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <Label htmlFor="email">Email da Pessoa</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pessoa@example.com"
              />
            </div>

            <div>
              <Label htmlFor="permission">Nível de Acesso</Label>
              <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "edit")}>
                <SelectTrigger id="permission">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="edit">Editar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={sendMutation.isPending}
              className="w-full"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Convite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Convites Enviados */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Gerencie os convites que você enviou
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitesSent && invitesSent.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enviado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitesSent.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.invitedEmail}</TableCell>
                      <TableCell className="capitalize">{invite.permissions}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(invite.status)}>
                          {invite.status === "pending" && "Pendente"}
                          {invite.status === "accepted" && "Aceito"}
                          {invite.status === "rejected" && "Rejeitado"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(invite.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum convite enviado</p>
          )}
        </CardContent>
      </Card>

      {/* Acessos Concedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Acessos Concedidos</CardTitle>
          <CardDescription>
            Pessoas que têm permissão para gerenciar suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {permissions && permissions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID do Gerenciador</TableHead>
                    <TableHead>Tipo de Recurso</TableHead>
                    <TableHead>Nível de Acesso</TableHead>
                    <TableHead>Concedido em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissions.map((perm) => (
                    <TableRow key={perm.id}>
                      <TableCell>{perm.managerId}</TableCell>
                      <TableCell className="capitalize">{perm.resourceType}</TableCell>
                      <TableCell className="capitalize">{perm.accessLevel}</TableCell>
                      <TableCell>{new Date(perm.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => revokeMutation.mutate({ permissionId: perm.id })}
                          disabled={revokeMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum acesso concedido</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
