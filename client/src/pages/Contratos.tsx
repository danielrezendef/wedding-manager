import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Contratos() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cpf: "",
    enderecoCompleto: "",
  });

  const { data: contratos, isLoading, refetch } = trpc.contratos.list.useQuery();
  const createMutation = trpc.contratos.create.useMutation({
    onSuccess: () => {
      toast.success("Contrato criado com sucesso!");
      refetch();
      resetForm();
      setIsOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.contratos.update.useMutation({
    onSuccess: () => {
      toast.success("Contrato atualizado com sucesso!");
      refetch();
      resetForm();
      setIsOpen(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.contratos.delete.useMutation({
    onSuccess: () => {
      toast.success("Contrato deletado com sucesso!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setFormData({ nomeCompleto: "", cpf: "", enderecoCompleto: "" });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.nomeCompleto || !formData.cpf || !formData.enderecoCompleto) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (contrato: any) => {
    setFormData({
      nomeCompleto: contrato.nomeCompleto,
      cpf: contrato.cpf,
      enderecoCompleto: contrato.enderecoCompleto,
    });
    setEditingId(contrato.id);
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este contrato?")) {
      deleteMutation.mutate({ id });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Contratos</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Contrato
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nomeCompleto">Nome Completo</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                  placeholder="Digite o nome completo"
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea
                  id="endereco"
                  value={formData.enderecoCompleto}
                  onChange={(e) => setFormData({ ...formData, enderecoCompleto: e.target.value })}
                  placeholder="Digite o endereço completo"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full"
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
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {contratos && contratos.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contratos.map((contrato) => (
                <TableRow key={contrato.id}>
                  <TableCell className="font-medium">{contrato.nomeCompleto}</TableCell>
                  <TableCell>{contrato.cpf}</TableCell>
                  <TableCell className="max-w-xs truncate">{contrato.enderecoCompleto}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(contrato)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(contrato.id)}
                      disabled={deleteMutation.isPending}
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
        <div className="text-center py-12">
          <p className="text-muted-foreground">Nenhum contrato cadastrado ainda</p>
        </div>
      )}
    </div>
  );
}
