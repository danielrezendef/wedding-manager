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
import { Loader2, CreditCard } from "lucide-react";

const schema = z.object({
  nomeResponsavel: z.string().min(1, "Nome obrigatório"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  enderecoCompleto: z.string().min(1, "Endereço obrigatório"),
  valor: z.string().min(1, "Valor obrigatório"),
  condicaoPagamento: z.string().min(1, "Condição de pagamento obrigatória"),
  formaPagamento: z.enum(["pix", "dinheiro", "cartao_credito", "cartao_debito", "transferencia", "boleto"]),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agendamentoId: number;
  cobranca?: any;
};

export default function CobrancaModal({ open, onClose, onSuccess, agendamentoId, cobranca }: Props) {
  const isEdit = !!cobranca;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (cobranca) {
      reset({
        nomeResponsavel: cobranca.nomeResponsavel,
        cpf: cobranca.cpf,
        enderecoCompleto: cobranca.enderecoCompleto,
        valor: cobranca.valor,
        condicaoPagamento: cobranca.condicaoPagamento,
        formaPagamento: cobranca.formaPagamento,
      });
    } else {
      reset({});
    }
  }, [cobranca, open]);

  const createMutation = trpc.cobrancas.create.useMutation({
    onSuccess: () => {
      toast.success("Cobrança cadastrada! Status atualizado para Confirmado.");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.cobrancas.update.useMutation({
    onSuccess: () => {
      toast.success("Cobrança atualizada com sucesso!");
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate({ agendamentoId, ...data });
    } else {
      createMutation.mutate({ agendamentoId, ...data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const formaPagamento = watch("formaPagamento");

  // CPF mask
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
    setValue("cpf", v);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {isEdit ? "Editar cobrança" : "Fechar orçamento"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os dados de cobrança do agendamento"
              : "Preencha os dados de cobrança para confirmar o agendamento. O status será atualizado automaticamente para Confirmado."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* Responsável */}
          <div className="space-y-1.5">
            <Label htmlFor="nomeResponsavel">Nome Completo do Responsável *</Label>
            <Input id="nomeResponsavel" placeholder="Nome completo" {...register("nomeResponsavel")} />
            {errors.nomeResponsavel && <p className="text-xs text-destructive">{errors.nomeResponsavel.message}</p>}
          </div>

          {/* CPF */}
          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF *</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              {...register("cpf")}
              onChange={handleCpfChange}
            />
            {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
          </div>

          {/* Endereço */}
          <div className="space-y-1.5">
            <Label htmlFor="enderecoCompleto">Endereço Completo *</Label>
            <Textarea
              id="enderecoCompleto"
              placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
              rows={2}
              {...register("enderecoCompleto")}
            />
            {errors.enderecoCompleto && <p className="text-xs text-destructive">{errors.enderecoCompleto.message}</p>}
          </div>

          {/* Valor */}
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor *</Label>
            <Input id="valor" placeholder="Ex: 3500.00" {...register("valor")} />
            {errors.valor && <p className="text-xs text-destructive">{errors.valor.message}</p>}
          </div>

          {/* Condição e Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="condicaoPagamento">Condição de Pagamento *</Label>
              <Input
                id="condicaoPagamento"
                placeholder="Ex: 50% entrada + 50% no dia"
                {...register("condicaoPagamento")}
              />
              {errors.condicaoPagamento && <p className="text-xs text-destructive">{errors.condicaoPagamento.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Forma de Pagamento *</Label>
              <Select
                value={formaPagamento}
                onValueChange={(v) => setValue("formaPagamento", v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
              {errors.formaPagamento && <p className="text-xs text-destructive">{errors.formaPagamento.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEdit ? "Salvando..." : "Confirmar..."}</>
              ) : (
                isEdit ? "Salvar alterações" : "Confirmar agendamento"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
