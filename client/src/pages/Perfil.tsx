import { useState } from "react";
import { useAppAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import WeddingLayout from "@/components/WeddingLayout";

export default function Perfil() {
  const { user } = useAppAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: (data) => {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    await updateMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
    });
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
    });
    setIsEditing(false);
  };

  return (
    <WeddingLayout>
      <div className="container max-w-2xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Visualize e edite suas informações pessoais</p>
        </div>

        {/* Profile Card */}
        <Card className="border-border/60">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>Seus dados de conta</CardDescription>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-2"
                >
                  Editar
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Nome Completo
              </label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="h-10"
                />
              ) : (
                <div className="px-3 py-2 bg-muted/50 rounded-md text-foreground">
                  {user?.name || "Não informado"}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                E-mail
              </label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="seu@email.com"
                  className="h-10"
                />
              ) : (
                <div className="px-3 py-2 bg-muted/50 rounded-md text-foreground">
                  {user?.email || "Não informado"}
                </div>
              )}
            </div>

            {/* Role Badge */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Perfil
              </label>
              <Badge
                variant={user?.role === "admin" ? "default" : "secondary"}
                className="w-fit"
              >
                {user?.role === "admin" ? "Administrador" : "Usuário"}
              </Badge>
            </div>

            {/* Account Info */}
            <div className="pt-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-medium">ID da Conta:</span> #{user?.id}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Membro desde:</span> Desde seu cadastro
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 gap-2"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-border/40">
          <p className="text-sm text-muted-foreground">
            💡 <span className="font-medium">Dica:</span> Mantenha suas informações atualizadas para
            garantir que você receba notificações e comunicações importantes.
          </p>
        </div>
      </div>
    </WeddingLayout>
  );
}
