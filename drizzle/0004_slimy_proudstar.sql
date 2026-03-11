ALTER TABLE `agendamentos`
MODIFY COLUMN `status` enum('orcamento','confirmado','cobranca','pagamento','concluido')
NOT NULL DEFAULT 'orcamento';

UPDATE `agendamentos`
SET `status` = 'pagamento'
WHERE `status` = 'cobranca';

ALTER TABLE `agendamentos`
MODIFY COLUMN `status` enum('orcamento','confirmado','pagamento','concluido')
NOT NULL DEFAULT 'orcamento';