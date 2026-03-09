import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
import { toast } from "sonner";
import { Users, Shield, UserX, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Usuarios() {
  const { isAdmin, user: currentUser } = useAppAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: users, isLoading } = trpc.users.list.useQuery();

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso");
      utils.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido com sucesso");
      utils.users.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie os usuários do sistema</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Usuários cadastrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {users?.map((u) => {
                const initials = u.name
                  ? u.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                  : "U";
                const isSelf = u.id === currentUser?.id;

                return (
                  <div key={u.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <Avatar className="h-10 w-10 border border-primary/15">
                      <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{u.name || "Sem nome"}</p>
                        <Badge
                          variant="outline"
                          className={u.role === "admin"
                            ? "text-primary border-primary/30 bg-primary/5 text-xs"
                            : "text-muted-foreground text-xs"}
                        >
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                        {isSelf && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{u.email || "Sem e-mail"}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Cadastrado em {format(new Date(u.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    {!isSelf && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => updateRoleMutation.mutate({
                            userId: u.id,
                            role: u.role === "admin" ? "user" : "admin",
                          })}
                          disabled={updateRoleMutation.isPending}
                        >
                          <Shield className="w-3.5 h-3.5 mr-1.5" />
                          {u.role === "admin" ? "Remover admin" : "Tornar admin"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteId(u.id)}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ userId: deleteId })}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
