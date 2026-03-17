import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { set } from "date-fns";

type FormDataType = {
  nomeCompleto: string;
  cpf: string;
  enderecoCompleto: string;
};

const initialFormData: FormDataType = {
  nomeCompleto: "",
  cpf: "",
  enderecoCompleto: "",
};

export default function Contratos() {
  const [formData, setFormData] = useState<FormDataType>(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleCpfChange = (field: keyof FormDataType, value: string) => {
    let v = value.replace(/\D/g, "").slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setFormData((prev) => ({ ...prev, [field]: v }));
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
        enderecoCompleto: contrato.enderecoCompleto ?? "",
      });
    } else {
      setFormData(initialFormData);
    }
  }, [contrato]);




  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nomeCompleto = formData.nomeCompleto.trim();
    const cpf = formData.cpf.trim();
    const enderecoCompleto = formData.enderecoCompleto.trim();

    if (!nomeCompleto || !cpf || !enderecoCompleto) {
      toast.error("Preencha todos os campos");
      return;
    }

    const payload = {
      nomeCompleto,
      cpf,
      enderecoCompleto,
    };

    if (contrato) {
      const hasChangedData =
        nomeCompleto !== (contrato.nomeCompleto ?? "").trim() ||
        cpf !== (contrato.cpf ?? "").trim() ||
        enderecoCompleto !== (contrato.enderecoCompleto ?? "").trim();

      if (!hasChangedData) {
        setIsEditing(false);
        return;
      }

      updateMutation.mutate({
        id: contrato.id,
        ...payload,
      });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isDisabled = !!contrato && !isEditing;
  const hasChanges = contrato
    ? formData.nomeCompleto.trim() !== (contrato.nomeCompleto ?? "").trim() ||
      formData.cpf.trim() !== (contrato.cpf ?? "").trim() ||
      formData.enderecoCompleto.trim() !== (contrato.enderecoCompleto ?? "").trim()
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
          Preencha seus dados de contrato abaixo
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
            <div className="space-y-3">
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) => handleChange("nomeCompleto", e.target.value)}
                placeholder="Digite seu nome completo"
                disabled={isDisabled || isSaving}
              />
            </div>

          {/* CPF */}
            <div className="space-y-3">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleCpfChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
                disabled={isDisabled || isSaving}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Textarea
                id="endereco"
                value={formData.enderecoCompleto}
                onChange={(e) =>
                  handleChange("enderecoCompleto", e.target.value)
                }
                placeholder="Digite seu endereço completo"
                rows={4}
                disabled={isDisabled || isSaving}
              />
            </div>

            <div className="flex gap-3">
              {contrato && !isEditing ? (
                <Button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="w-full"
                >
                  Editar
                </Button>
              ) : (
                <>
                  <Button
                    type="submit"
                    disabled={isSaving || (contrato ? !hasChanges : false)}
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
                          enderecoCompleto: contrato.enderecoCompleto ?? "",
                        });
                      }}
                      className="flex-1"
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
