import { useAppAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WeddingLayout from "@/components/WeddingLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, Mail, User, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Perfil() {
  const { user } = useAppAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const generateUploadUrlMutation = trpc.auth.generateProfilePhotoUploadUrl.useMutation();
  const uploadPhotoMutation = trpc.auth.uploadProfilePhoto.useMutation();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();
  const changePasswordMutation = trpc.auth.changePassword.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
      });
      toast.success("Perfil atualizado com sucesso!");
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar perfil");
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error?.message || "Erro ao alterar senha");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida (JPG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Gerar URL de upload
      const uploadUrlResponse = await generateUploadUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
      });

      if (!uploadUrlResponse.success || !uploadUrlResponse.uploadUrl) {
        toast.error("Erro ao gerar URL de upload");
        return;
      }

      // Upload do arquivo para S3
      const uploadResponse = await fetch(uploadUrlResponse.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        console.error("Upload failed:", uploadResponse.status, uploadResponse.statusText);
        toast.error(`Erro ao fazer upload: ${uploadResponse.statusText}`);
        return;
      }

      // Extrair URL da foto (remover query string)
      const photoUrl = uploadUrlResponse.uploadUrl.split("?")[0];

      // Atualizar perfil com URL da foto
      await uploadPhotoMutation.mutateAsync({
        photoUrl: photoUrl,
      });

      toast.success("Foto atualizada com sucesso!");
    } catch (error: any) {
      console.error("Photo upload error:", error);
      toast.error(error?.message || "Erro ao processar a imagem");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!user) {
    return (
      <WeddingLayout>
        <div className="container max-w-2xl py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </WeddingLayout>
    );
  }

  return (
    <WeddingLayout>
      <div className="container max-w-2xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Visualize e edite suas informações pessoais</p>
        </div>

        {/* Card de Foto de Perfil */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Atualize sua foto de perfil (máximo 5MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Foto de perfil"
                  className="w-20 h-20 rounded-full object-cover border-2 border-rose-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center">
                  <User className="w-10 h-10 text-rose-600" />
                </div>
              )}
              <div className="flex-1">
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingPhoto}
                    onClick={() => document.getElementById("photo-upload")?.click()}
                    className="w-full"
                  >
                    {isUploadingPhoto ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Selecionar Foto
                      </>
                    )}
                  </Button>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Informações Pessoais */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seus dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Alterações"
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user.name || "",
                        email: user.email || "",
                      });
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Mantenha sua conta segura alterando sua senha regularmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  className="mt-1"
                />
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    "Alterar Senha"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </WeddingLayout>
  );
}
