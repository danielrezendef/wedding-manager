type Status = "orcamento" | "confirmado" | "pagamento" | "concluido";

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  orcamento: { label: "Orçamento", className: "status-orcamento" },
  confirmado: { label: "Confirmado", className: "status-confirmado" },
  pagamento: { label: "Pagamento", className: "status-pagamento" },
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
