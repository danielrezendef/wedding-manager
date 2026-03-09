CREATE TABLE `agendamentos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nomeNoiva` varchar(255) NOT NULL,
	`nomeNoivo` varchar(255) NOT NULL,
	`dataEvento` date NOT NULL,
	`horario` time NOT NULL,
	`enderecoCerimonia` text NOT NULL,
	`valorServico` decimal(10,2) NOT NULL,
	`status` enum('orcamento','confirmado','pendente','concluido') NOT NULL DEFAULT 'orcamento',
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agendamentos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cobrancas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agendamentoId` int NOT NULL,
	`nomeResponsavel` varchar(255) NOT NULL,
	`cpf` varchar(14) NOT NULL,
	`enderecoCompleto` text NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`condicaoPagamento` varchar(255) NOT NULL,
	`formaPagamento` enum('pix','dinheiro','cartao_credito','cartao_debito','transferencia','boleto') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cobrancas_id` PRIMARY KEY(`id`),
	CONSTRAINT `cobrancas_agendamentoId_unique` UNIQUE(`agendamentoId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);