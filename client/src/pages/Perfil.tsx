import { useState } from "react";
import { useAppAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, X, Upload, Camera } from "lucide-react";
import { toast } from "sonner";
import WeddingLayout from "@/components/WeddingLayout";

export default function Perfil() {
  const { user } = useAppAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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

  const uploadPhotoMutation = trpc.auth.uploadProfilePhoto.useMutation({
    onSuccess: (data) => {
      toast.success("Foto de perfil atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer upload da foto");
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Aqui você pode enviar para um serviço de upload (como S3)
        // Por enquanto, vamos usar a URL base64 diretamente
        // Em produção, você deve enviar para um servidor de armazenamento
        
        await uploadPhotoMutation.mutateAsync({
          photoUrl: base64,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Erro ao processar a imagem");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <WeddingLayout>
      <div className="container max-w-2xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Visualize e edite suas informações pessoais</p>
        </div>

        {/* Profile Photo Card */}
        <Card className="border-border/60 mb-6">
          <CardHeader className="pb-6">
            <CardTitle>Foto de Perfil</CardTitle>
            <CardDescription>Atualize sua foto de perfil</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-6">
              {/* Photo Display */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-muted border-2 border-border/60 flex items-center justify-center">
                {user?.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-10 h-10 text-muted-foreground" />
                )}
              </div>

              {/* Upload Button */}
              <div className="flex-1">
                <label htmlFor="photo-upload" className="block">
                  <Button
                    variant="outline"
                    className="w-full gap-2 cursor-pointer"
                    disabled={isUploadingPhoto}
                    asChild
                  >
                    <span>
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Escolher Foto
                        </>
                      )}
                    </span>
                  </Button>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG ou GIF. Máximo 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WeddingLayout>
  );
}
