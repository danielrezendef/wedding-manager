import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PDFReciboProps {
  agendamento: {
    id: number;
    nomeNoiva: string;
    nomeNoivo: string;
    dataEvento: Date;
    horario: string;
    endereco: string;
    valorServico: number;
    status: string;
  };
  cobranca: {
    id: number;
    responsavel: string;
    cpf: string;
    endereco: string;
    valor: number;
    condicaoPagamento: string;
    formaPagamento: string;
    createdAt: Date;
  };
  nomeEmpresa: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: "#c41e3a",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#c41e3a",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  row: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
    width: "30%",
  },
  value: {
    fontSize: 10,
    color: "#333",
    width: "70%",
  },
  twoColumn: {
    display: "flex",
    flexDirection: "row",
    gap: 20,
  },
  column: {
    flex: 1,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 5,
  },
  statusOrcamento: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  statusConfirmado: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPendente: {
    backgroundColor: "#fed7aa",
    color: "#92400e",
  },
  statusConcluido: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#c41e3a",
  },
  totalRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#c41e3a",
  },
});

const getStatusColor = (status: string) => {
  switch (status) {
    case "orcamento":
      return styles.statusOrcamento;
    case "confirmado":
      return styles.statusConfirmado;
    case "pendente":
      return styles.statusPendente;
    case "concluido":
      return styles.statusConcluido;
    default:
      return {};
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    orcamento: "Orçamento",
    confirmado: "Confirmado",
    pendente: "Pendente",
    concluido: "Concluído",
  };
  return labels[status] || status;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const PDFRecibo: React.FC<PDFReciboProps> = ({
  agendamento,
  cobranca,
  nomeEmpresa,
}) => {
  const dataEmissao = new Date();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{nomeEmpresa}</Text>
          <Text style={styles.subtitle}>Recibo de Cobrança - Serviço de Cerimonial</Text>
        </View>

        {/* Informações do Recibo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Recibo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Número:</Text>
            <Text style={styles.value}>#{cobranca.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Emissão:</Text>
            <Text style={styles.value}>
              {format(dataEmissao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, getStatusColor(agendamento.status)]}>
              <Text>{getStatusLabel(agendamento.status)}</Text>
            </View>
          </View>
        </View>

        {/* Dados do Evento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Evento</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Noiva:</Text>
            <Text style={styles.value}>{agendamento.nomeNoiva}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Noivo:</Text>
            <Text style={styles.value}>{agendamento.nomeNoivo}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data do Evento:</Text>
            <Text style={styles.value}>
              {format(new Date(agendamento.dataEvento), "dd 'de' MMMM 'de' yyyy", {
                locale: ptBR,
              })}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Horário:</Text>
            <Text style={styles.value}>{agendamento.horario}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Local:</Text>
            <Text style={styles.value}>{agendamento.endereco}</Text>
          </View>
        </View>

        {/* Dados do Responsável Financeiro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Responsável Financeiro</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{cobranca.responsavel}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>CPF:</Text>
            <Text style={styles.value}>{cobranca.cpf}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.value}>{cobranca.endereco}</Text>
          </View>
        </View>

        {/* Dados de Cobrança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados de Cobrança</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Valor do Serviço:</Text>
            <Text style={styles.value}>{formatCurrency(agendamento.valorServico)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Valor Cobrado:</Text>
            <Text style={styles.value}>{formatCurrency(cobranca.valor)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Condição de Pagamento:</Text>
            <Text style={styles.value}>{cobranca.condicaoPagamento}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Forma de Pagamento:</Text>
            <Text style={styles.value}>{cobranca.formaPagamento}</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ fontSize: 12, fontWeight: "bold" }}>TOTAL A PAGAR:</Text>
            <Text style={styles.totalValue}>{formatCurrency(cobranca.valor)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Documento emitido em{" "}
            {format(dataEmissao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </Text>
          <Text style={{ marginTop: 10 }}>
            Este recibo é válido como comprovante de cobrança do serviço de cerimonial.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
