import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const schema = z.object({
  nomeNoiva: z.string().min(1, "Nome da noiva obrigatório"),
  nomeNoivo: z.string().min(1, "Nome do noivo obrigatório"),
  dataEvento: z.string().min(1, "Data obrigatória"),
  horario: z.string().min(1, "Horário obrigatório"),
  enderecoCerimonia: z.string().min(1, "Endereço obrigatório"),
  valorServico: z.string().min(1, "Valor obrigatório"),
  status: z.enum(["orcamento", "confirmado", "pagamento", "concluido"]).optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agendamento?: any;
};

export default function AgendamentoModal({ open, onClose, onSuccess, agendamento }: Props) {
  const isEdit = !!agendamento;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      status: "orcamento",
    },
  });

  useEffect(() => {
    if (agendamento) {
      reset({
        nomeNoiva: agendamento.nomeNoiva,
        nomeNoivo: agendamento.nomeNoivo,
        dataEvento: agendamento.dataEvento
          ? format(new Date(agendamento.dataEvento), "yyyy-MM-dd")
          : "",
        horario: agendamento.horario?.slice(0, 5) ?? "",
        enderecoCerimonia: agendamento.enderecoCerimonia,
        valorServico: agendamento.valorServico,
        status: agendamento.status,
        observacoes: agendamento.observacoes ?? "",
      });
    } else {
      reset({ status: "orcamento" });
    }
  }, [agendamento, open]);

  const createMutation = trpc.agendamentos.create.useMutation({
    onSuccess: () => {
      toast.success("Agendamento criado com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.agendamentos.update.useMutation({
    onSuccess: () => {
      toast.success("Agendamento atualizado com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate({ id: agendamento.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const statusValue = watch("status");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar agendamento" : "Novo agendamento"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize os dados do agendamento" : "Preencha os dados para criar um novo agendamento"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Casal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="nomeNoiva">Nome da Noiva *</Label>
              <Input id="nomeNoiva" placeholder="Nome completo da noiva" {...register("nomeNoiva")} />
              {errors.nomeNoiva && <p className="text-xs text-destructive">{errors.nomeNoiva.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nomeNoivo">Nome do Noivo *</Label>
              <Input id="nomeNoivo" placeholder="Nome completo do noivo" {...register("nomeNoivo")} />
              {errors.nomeNoivo && <p className="text-xs text-destructive">{errors.nomeNoivo.message}</p>}
            </div>
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dataEvento">Data do Evento *</Label>
              <Input id="dataEvento" type="date" {...register("dataEvento")} />
              {errors.dataEvento && <p className="text-xs text-destructive">{errors.dataEvento.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="horario">Horário *</Label>
              <Input id="horario" type="time" {...register("horario")} />
              {errors.horario && <p className="text-xs text-destructive">{errors.horario.message}</p>}
            </div>
          </div>

          {/* Endereço */}
          <div className="space-y-1.5">
            <Label htmlFor="enderecoCerimonia">Endereço da Cerimônia *</Label>
            <Input id="enderecoCerimonia" placeholder="Rua, número, bairro, cidade" {...register("enderecoCerimonia")} />
            {errors.enderecoCerimonia && <p className="text-xs text-destructive">{errors.enderecoCerimonia.message}</p>}
          </div>

          {/* Valor e Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valorServico">Valor do Serviço *</Label>
              <Input id="valorServico" placeholder="Ex: 3500.00" {...register("valorServico")} />
              {errors.valorServico && <p className="text-xs text-destructive">{errors.valorServico.message}</p>}
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={statusValue}
                  onValueChange={(v) => setValue("status", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orcamento">Orçamento</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Detalhes adicionais, preferências, informações importantes..."
              rows={3}
              {...register("observacoes")}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEdit ? "Salvando..." : "Criando..."}</>
              ) : (
                isEdit ? "Salvar alterações" : "Criar agendamento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
