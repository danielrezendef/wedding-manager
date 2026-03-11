ALTER TABLE `agendamentos`
MODIFY COLUMN `status` enum('orcamento','confirmado','cobranca','pagamento','concluido')
NOT NULL DEFAULT 'orcamento';
