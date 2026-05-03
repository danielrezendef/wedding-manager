import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useAppAuth } from "@/contexts/AuthContext";

type FormDataType = {
  nomeCompleto: string;
  cpf: string;
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

const initialFormData: FormDataType = {
  nomeCompleto: "",
  cpf: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export default function Contratos() {
  const { user } = useAppAuth();
  const canUseContracts = Boolean(user?.gerarContratoAutomaticamente);
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleCpfChange = (value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setFormData((prev) => ({ ...prev, cpf: v }));
  };

  const handleCepChange = (value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 8);
    if (v.length > 5) {
      v = v.replace(/(\d{5})(\d)/, "$1-$2");
    }
    setFormData((prev) => ({ ...prev, cep: v }));

    if (v.replace(/\D/g, "").length === 8) {
      searchCep(v.replace(/\D/g, ""));
    }
  };

  const searchCep = async (cep: string) => {
    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error("CEP não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      
      toast.success("Endereço preenchido via CEP");
    } catch (error) {
      toast.error("Erro ao buscar CEP");
    } finally {
      setIsSearchingCep(false);
    }
  };

  const utils = trpc.useUtils();

  const {
    data: contrato,
    isLoading,
    isFetching,
  } = trpc.contratos.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const createMutation = trpc.contratos.create.useMutation({
    onSuccess: async () => {
      toast.success("Contrato salvo com sucesso!");
      await utils.contratos.get.invalidate();
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.contratos.update.useMutation({
    onSuccess: async () => {
      toast.success("Contrato atualizado com sucesso!");
      await utils.contratos.get.invalidate();
      setIsEditing(false);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (contrato) {
      setFormData({
        nomeCompleto: contrato.nomeCompleto ?? "",
        cpf: contrato.cpf ?? "",
        cep: contrato.cep ?? "",
        rua: contrato.rua ?? "",
        numero: contrato.numero ?? "",
        complemento: contrato.complemento ?? "",
        bairro: contrato.bairro ?? "",
        cidade: contrato.cidade ?? "",
        estado: contrato.estado ?? "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [contrato]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUseContracts) {
      toast.error("Ative a emissão automática de contrato no perfil para editar os contratos.");
      return;
    }

    if (!formData.nomeCompleto || !formData.cpf || !formData.rua || !formData.numero || !formData.bairro || !formData.cidade || !formData.estado) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const payload = {
      ...formData,
      nomeCompleto: formData.nomeCompleto.trim(),
      cpf: formData.cpf.trim(),
      cep: formData.cep.trim(),
      rua: formData.rua.trim(),
      numero: formData.numero.trim(),
      complemento: formData.complemento.trim(),
      bairro: formData.bairro.trim(),
      cidade: formData.cidade.trim(),
      estado: formData.estado.trim(),
    };

    if (contrato) {
      updateMutation.mutate({
        id: contrato.id,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDisabled = !canUseContracts || (!!contrato && !isEditing);
  
  const hasChanges = contrato
    ? formData.nomeCompleto.trim() !== (contrato.nomeCompleto ?? "").trim() ||
      formData.cpf.trim() !== (contrato.cpf ?? "").trim() ||
      formData.cep.trim() !== (contrato.cep ?? "").trim() ||
      formData.rua.trim() !== (contrato.rua ?? "").trim() ||
      formData.numero.trim() !== (contrato.numero ?? "").trim() ||
      formData.complemento.trim() !== (contrato.complemento ?? "").trim() ||
      formData.bairro.trim() !== (contrato.bairro ?? "").trim() ||
      formData.cidade.trim() !== (contrato.cidade ?? "").trim() ||
      formData.estado.trim() !== (contrato.estado ?? "").trim()
    : true;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Contrato</h1>
          {(isLoading || isFetching) && (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          {canUseContracts
            ? "Preencha seus dados de contrato abaixo"
            : "Ative a emissão automática de contrato no perfil para habilitar os botões de contrato"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Contrato</CardTitle>
          <CardDescription>
            {contrato
              ? "Edite seus dados de contrato"
              : "Crie seu contrato com os dados abaixo"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleChange("nomeCompleto", e.target.value)}
                  placeholder="Digite seu nome completo"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep">CEP (Opcional)</Label>
                <div className="relative">
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    disabled={isDisabled || isSaving}
                  />
                  {isSearchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={formData.rua}
                  onChange={(e) => handleChange("rua", e.target.value)}
                  placeholder="Rua / Logradouro"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => handleChange("numero", e.target.value)}
                  placeholder="Nº"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento (Opcional)</Label>
                <Input
                  id="complemento"
                  value={formData.complemento}
                  onChange={(e) => handleChange("complemento", e.target.value)}
                  placeholder="Apto, Bloco, etc"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  value={formData.bairro}
                  onChange={(e) => handleChange("bairro", e.target.value)}
                  placeholder="Bairro"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => handleChange("cidade", e.target.value)}
                  placeholder="Cidade"
                  disabled={isDisabled || isSaving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado (UF)</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleChange("estado", e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                  disabled={isDisabled || isSaving}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {contrato && !isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  disabled={!canUseContracts}
                  className="w-full"
                >
                  Editar
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={!canUseContracts || isSaving || (contrato ? !hasChanges : false)}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar"
                    )}
                  </Button>

                  {contrato && isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          nomeCompleto: contrato.nomeCompleto ?? "",
                          cpf: contrato.cpf ?? "",
                          cep: contrato.cep ?? "",
                          rua: contrato.rua ?? "",
                          numero: contrato.numero ?? "",
                          complemento: contrato.complemento ?? "",
                          bairro: contrato.bairro ?? "",
                          cidade: contrato.cidade ?? "",
                          estado: contrato.estado ?? "",
                        });
                      }}
                      className="flex-1"
                      disabled={!canUseContracts}
                    >
                      Cancelar
                    </Button>
                  )}
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
