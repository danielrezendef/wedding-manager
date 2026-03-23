ALTER TABLE `cobrancas` ADD `cep` varchar(9);--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `rua` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `numero` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `complemento` varchar(255);--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `bairro` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `cidade` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `cobrancas` ADD `estado` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `contratos` ADD `cep` varchar(9);--> statement-breakpoint
ALTER TABLE `contratos` ADD `rua` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `contratos` ADD `numero` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `contratos` ADD `complemento` varchar(255);--> statement-breakpoint
ALTER TABLE `contratos` ADD `bairro` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `contratos` ADD `cidade` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `contratos` ADD `estado` varchar(2) NOT NULL;--> statement-breakpoint
ALTER TABLE `cobrancas` DROP COLUMN `enderecoCompleto`;--> statement-breakpoint
ALTER TABLE `contratos` DROP COLUMN `enderecoCompleto`;