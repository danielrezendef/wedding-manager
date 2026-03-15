import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function ConvitesRecebidos() {
  const { data: invites, isLoading, refetch } = trpc.invites.listReceived.useQuery();

  const acceptMutation = trpc.invites.accept.useMutation({
    onSuccess: () => {
      toast.success("Convite aceito com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const rejectMutation = trpc.invites.reject.useMutation({
    onSuccess: () => {
      toast.success("Convite rejeitado!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      accepted: "default",
      rejected: "destructive",
    };
    return variants[status] || "default";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingInvites = invites?.filter((i) => i.status === "pending") || [];
  const otherInvites = invites?.filter((i) => i.status !== "pending") || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Convites Recebidos</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os convites para compartilhamento de gerenciamento
        </p>
      </div>

      {/* Convites Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Convites Pendentes</CardTitle>
          <CardDescription>
            Convites aguardando sua resposta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingInvites.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De (ID)</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Expira em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.ownerId}</TableCell>
                      <TableCell className="capitalize">{invite.permissions}</TableCell>
                      <TableCell>{new Date(invite.expiresAt).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => acceptMutation.mutate({ inviteId: invite.id })}
                          disabled={acceptMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate({ inviteId: invite.id })}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">Nenhum convite pendente</p>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Convites */}
      {otherInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Convites</CardTitle>
            <CardDescription>
              Convites aceitos ou rejeitados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>De (ID)</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherInvites.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.ownerId}</TableCell>
                      <TableCell className="capitalize">{invite.permissions}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(invite.status)}>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
