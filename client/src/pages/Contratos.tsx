import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Contratos() {
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    enderecoCompleto: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const { data: contrato, isLoading, refetch } = trpc.contratos.get.useQuery();
  
  const createMutation = trpc.contratos.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato salvo com sucesso!");
      refetch();
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      refetch();
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    if (contrato) {
      setFormData({
        nomeCompleto: contrato.nomeCompleto,
        cpf: contrato.cpf,
        enderecoCompleto: contrato.enderecoCompleto,
      });
    }
  }, [contrato]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setFormData((prev) => ({ ...prev, cpf: v }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto || !formData.cpf || !formData.enderecoCompleto) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (contrato) {
      updateMutation.mutate({
        id: contrato.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contrato</h1>
        <p className="text-muted-foreground mt-2">
          Preencha seus dados de contrato abaixo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Contrato</CardTitle>
          <CardDescription>
            {contrato ? "Edite seus dados de contrato" : "Crie seu contrato com os dados abaixo"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                placeholder="Digite seu nome completo"
                disabled={!isEditing && !!contrato}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                disabled={!isEditing && !!contrato}
              />
            </div>

            <div>
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Textarea
                id="endereco"
                value={formData.enderecoCompleto}
                onChange={(e) => setFormData({ ...formData, enderecoCompleto: e.target.value })}
                placeholder="Digite seu endereço completo"
                rows={4}
                disabled={!isEditing && !!contrato}
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
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
                        if (contrato) {
                          setFormData({
                            nomeCompleto: contrato.nomeCompleto,
                            cpf: contrato.cpf,
                            enderecoCompleto: contrato.enderecoCompleto,
                          });
                        }
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
