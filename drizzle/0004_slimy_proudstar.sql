-- First, update all existing 'cobranca' values to 'pagamento'
UPDATE `agendamentos` SET `status` = 'pagamento' WHERE `status` = 'cobranca';

-- Then modify the enum to include the new value and remove the old one
ALTER TABLE `agendamentos` MODIFY COLUMN `status` enum('orcamento','confirmado','pagamento','concluido') NOT NULL DEFAULT 'orcamento';
