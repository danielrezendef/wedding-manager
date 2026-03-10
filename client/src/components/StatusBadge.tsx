type Status = "orcamento" | "confirmado" | "cobranca" | "concluido";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  orcamento: { label: "Orçamento", className: "status-orcamento" },
  confirmado: { label: "Confirmado", className: "status-confirmado" },
  cobranca: { label: "Cobrança", className: "status-cobranca" },
  concluido: { label: "Concluído", className: "status-concluido" },
};

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as Status] ?? { label: status, className: "" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  );
}
