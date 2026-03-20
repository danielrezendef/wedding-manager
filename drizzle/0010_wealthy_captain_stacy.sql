ALTER TABLE `agendamentos` RENAME COLUMN `nomeNoiva` TO `descricao`;--> statement-breakpoint
ALTER TABLE `agendamentos` MODIFY COLUMN `descricao` text NOT NULL;--> statement-breakpoint
ALTER TABLE `agendamentos` DROP COLUMN `nomeNoivo`;