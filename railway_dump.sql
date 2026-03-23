-- MySQL dump 10.13  Distrib 9.6.0, for macos14.8 (x86_64)
--
-- Host: interchange.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.6.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b',1773078547775),(2,'79b8e539a893e36de54fad5b49010b118318e7081a9b659ead6ea53551683530',1773078712400),(3,'5d8c1bbb7351a272783c5a1eb837f449074bf1b1f4870367806a5284dbcf9d58',1773141799260),(4,'11f00f226e4925b7a4975ac8de50c5535746f884a14dbd52d38f17cdcc16f408',1773147622632),(5,'573954f0a1279246b159fe4070c824b2ab7d806a0efbc5f65249e684d9c3b5b4',1773242806636),(6,'de63e09cd47f5171f5696ad9745541a87586818e8abf1d07d24ed60b317d06bb',1773300000000),(8,'134e8a7a0a2270bb154fbab50efd52ea960363a805802f5aa12583f0b2eedc35',1773586473302),(9,'7934d8ba76e495e8294325a23286147eca17bfec4e2516d0756f3b36212f6142',1773687122198),(10,'474aad5dd9846c28b08e9e33e3fcb8a6a74bdef74c228e37ff4d57363868c3d5',1773689174226),(11,'533c4c6e3e254bcb9a7250e7f20a473c23584de9d63c9b118c997de187d599fb',1773979338115);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `agendamentos`
--

DROP TABLE IF EXISTS `agendamentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `descricao` text NOT NULL,
  `dataEvento` date NOT NULL,
  `horario` time NOT NULL,
  `enderecoCerimonia` text NOT NULL,
  `valorServico` decimal(10,2) NOT NULL,
  `status` enum('orcamento','confirmado','cobranca','pagamento','concluido') NOT NULL DEFAULT 'orcamento',
  `observacoes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agendamentos`
--

LOCK TABLES `agendamentos` WRITE;
/*!40000 ALTER TABLE `agendamentos` DISABLE KEYS */;
INSERT INTO `agendamentos` VALUES (3,1,'Julia','2026-08-15','17:00:00','Igreja Matriz de São José (Garcias)',2000.00,'pagamento','Teclado e Violino','2026-03-11 17:12:33','2026-03-12 05:27:12'),(4,6,'Carol','2026-05-09','17:30:00','Sagrada Familia',1400.00,'pagamento','Vocal\nTeclado\nSom','2026-03-12 12:31:54','2026-03-16 19:57:21'),(5,6,'Renata','2026-09-12','17:30:00','Matriz Santana ',1400.00,'pagamento','Vocal\nTeclado\nSom','2026-03-12 12:34:05','2026-03-16 20:01:13'),(6,6,'Joice','2026-09-16','16:00:00','Estância Stela Maris Divinopolis',1400.00,'orcamento','Vocal\nTeclado\nViolino\nSom','2026-03-12 12:37:52','2026-03-12 12:37:52'),(7,6,'Gleyce','2026-09-26','17:30:00','Igreja Imaculada Conceição',1400.00,'pagamento','Vocal\nTeclado\nSom','2026-03-12 12:40:41','2026-03-16 20:05:31'),(8,6,'Milene','2026-11-14','17:00:00','Igreja Sagrada Família',2000.00,'pagamento','Vocal\nTeclado\nViolino\nSom','2026-03-12 12:42:20','2026-03-16 20:07:21'),(9,6,'Barbara','2027-01-23','17:00:00','Matriz Nsa do Rosário Azurita',1650.00,'pagamento','Vocal\nTeclado\nViolão ','2026-03-12 12:45:51','2026-03-16 20:09:12'),(10,6,'Lais','2027-03-20','11:00:00','Igreja Sagrada Familia',2200.00,'pagamento','Vocal\nTeclado\nViolino\nSom','2026-03-12 12:48:15','2026-03-16 20:10:58'),(13,9,'Ana','2027-03-03','19:00:00','Sagrada Familia',1000.00,'confirmado','1hora de apresentação','2026-03-18 22:57:20','2026-03-18 22:59:03'),(15,8,'Ana e Daniel','2027-03-03','10:11:00','dddd',1000.00,'confirmado','sjjdd','2026-03-20 04:17:14','2026-03-20 04:17:34');
/*!40000 ALTER TABLE `agendamentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cobrancas`
--

DROP TABLE IF EXISTS `cobrancas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cobrancas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `agendamentoId` int NOT NULL,
  `nomeResponsavel` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `enderecoCompleto` text NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `condicaoPagamento` varchar(255) NOT NULL,
  `formaPagamento` enum('pix','dinheiro','cartao_credito','cartao_debito','transferencia','boleto') NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cobrancas_agendamentoId_unique` (`agendamentoId`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cobrancas`
--

LOCK TABLES `cobrancas` WRITE;
/*!40000 ALTER TABLE `cobrancas` DISABLE KEYS */;
INSERT INTO `cobrancas` VALUES (4,3,'Júlia Dias Silva','171.091.026-70','Levy da Cruz dos Santos, 378, Sao Bento',2000.00,'Duas Vezes','pix','2026-03-12 05:27:09','2026-03-16 19:52:34'),(7,4,'Ana Carolina Marques Antunes','127.480.236-92','Rua Tarcísio Lopes Camargos, 32, Bairro Aeroporto, Itaúna, Minas Gerais, Cep 35680-609,',1400.00,'Duas Percelas','pix','2026-03-16 19:57:13','2026-03-16 19:57:13'),(8,5,'Renata Maria Parreiras','137.366.906-30','Rua Lagoa da Prata, no 332 apto 202, Bairro Morro do Sol, Itaúna Minas Gerais, Cep 35680-286',1950.00,'Duas Parcelas','pix','2026-03-16 20:00:11','2026-03-16 20:00:11'),(9,7,'Gleyce Paraguai de Carvalho','076.422.066-74','Av Brasília, 434, Ap 101, Bairro Universitário, Itaúna Minas Gerais',1400.00,'Duas Parcelas','pix','2026-03-16 20:03:31','2026-03-16 20:03:31'),(10,8,'Milene Aparecida Fonseca','143.457.896-80','Rua Ana de Faria dornas, 900 Bloco F, Ap 102, Bairro Santa Edwiges, Itaúna Minas Gerais, Cep 35680-802,',2000.00,'Duas Parcelas','pix','2026-03-16 20:07:18','2026-03-16 20:07:29'),(11,9,'Marcos Augusto Silva','127.286.926-10','Rua Turfa , 530, Bairro Padre Eustaquio,Itaúna Minas Gerais, Cep 35680-151',1650.00,'Duas Parcelas','pix','2026-03-16 20:09:08','2026-03-16 20:09:08'),(12,10,'Laís Oliveira Chagas','152.234.066-13','Monsenhor Hilton, 39, Bairro Jadir Marinho, Itaúna Minas Gerais',2200.00,'Duas Parcelas','pix','2026-03-16 20:10:53','2026-03-16 20:10:53'),(13,13,'Daniel Rezende Fonseca','115.209.676-16','Raul Soares, 111, Residencial Santanense, Itaúna',1000.00,'Duas Parcelas','pix','2026-03-18 22:59:03','2026-03-18 22:59:03'),(15,15,'Teste','111.828.288-33','hdhdd',200.00,'tes','pix','2026-03-20 04:17:34','2026-03-20 04:17:34');
/*!40000 ALTER TABLE `cobrancas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contratos`
--

DROP TABLE IF EXISTS `contratos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contratos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `nomeCompleto` varchar(255) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `enderecoCompleto` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contratos`
--

LOCK TABLES `contratos` WRITE;
/*!40000 ALTER TABLE `contratos` DISABLE KEYS */;
INSERT INTO `contratos` VALUES (1,6,'Ana Laura Souza','135.439.746-02','Rua Vovó Maria Drumond, 83, Bairro Murilo Gonçalves, Itaúna - Minas Gerais , Cep 35681-125,','2026-03-12 05:26:06','2026-03-16 19:46:21'),(2,9,'Pedro Oliveira','111.222.333-44','São bento','2026-03-18 22:59:59','2026-03-18 22:59:59');
/*!40000 ALTER TABLE `contratos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) NOT NULL,
  `name` text,
  `email` varchar(320) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  `password` varchar(255) DEFAULT NULL,
  `profilePhoto` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (6,'google_1773293076261_gb7hr1dtsi5','Daniel Rezende','daniel.rezende.f@gmail.com','google','admin','2026-03-12 05:24:36','2026-03-12 05:24:57','2026-03-12 05:24:36',NULL,'https://lh3.googleusercontent.com/a/ACg8ocJ-jNSErhao-Yh3lDlCAGtL0DE6CpU0gdIdhKgGYyVW3aZVrWg=s96-c'),(8,'google_1773685490334_xwlga6zkhml','Daniel Rezende','danielrezendefonseca@gmail.com','google','user','2026-03-16 18:24:50','2026-03-16 18:24:50','2026-03-16 18:24:50',NULL,'https://lh3.googleusercontent.com/a/ACg8ocKLk4xMUgdgGKB_ZRk9HpeTPAAEA2WDg6QBfAz3qEa6S_ucyBY=s96-c'),(9,'google_1773874548515_en6st9zmh7j','Pedro Rabelo','pedro.henrique.oliveira3103@gmail.com','google','user','2026-03-18 22:55:48','2026-03-18 22:55:48','2026-03-18 22:55:49',NULL,'https://lh3.googleusercontent.com/a/ACg8ocIek8wersIqtMGq86mO0nyaPP7ukadqbDD6su1iCF7JivgPiWhYgQ=s96-c'),(10,'google_1773875350848_eejagpnr9bj','John Cleiton','johncleytonputo@gmail.com','google','user','2026-03-18 23:09:10','2026-03-18 23:09:10','2026-03-18 23:09:11',NULL,'https://lh3.googleusercontent.com/a/ACg8ocIdmT1DgPnPxyfHx7BsjbS_6gH57v3HdeYOsh0XVKY2790NicnS=s96-c');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'railway'
--
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-20  2:28:42
