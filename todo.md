# Wedding Manager - TODO

## Schema & Banco de Dados
- [x] Tabela users (com email/senha para auth JWT personalizada)
- [x] Tabela agendamentos (campos completos)
- [x] Tabela cobranças (vinculada ao agendamento)
- [x] Migrations com pnpm db:push

## Backend - Autenticação JWT Personalizada
- [x] Registro de usuário (email + senha + bcrypt)
- [x] Login com geração de JWT
- [x] Middleware de proteção de rotas
- [x] Controle de acesso por perfil (admin/user)
- [x] Logout / invalidação de sessão

## Backend - Agendamentos
- [x] Criar agendamento (status inicial: Orçamento)
- [x] Listar agendamentos (admin: todos, user: próprios)
- [x] Editar agendamento
- [x] Excluir agendamento (admin only)
- [x] Filtros: período, status, nome da noiva, nome do noivo
- [x] Paginação

## Backend - Cobranças
- [x] Criar cobrança vinculada ao agendamento
- [x] Atualizar status do agendamento para Confirmado ao salvar cobrança
- [x] Editar cobrança
- [x] Visualizar cobrança

## Backend - Dashboard
- [x] Total de agendamentos por mês
- [x] Total de agendamentos por ano
- [x] Valor total a receber
- [x] Quantidade por status
- [x] Próximos eventos
- [x] Resumo financeiro dos confirmados

## Frontend - Layout & Navegação
- [x] DashboardLayout com sidebar elegante
- [x] Tema claro com paleta sofisticada (rose/gold)
- [x] Tipografia refinada (Google Fonts)
- [x] Animações suaves
- [x] Responsividade mobile/desktop

## Frontend - Autenticação
- [x] Página de Login elegante
- [x] Página de Cadastro
- [x] Proteção de rotas no frontend
- [x] Contexto de autenticação

## Frontend - Dashboard
- [x] Cards de indicadores (total, valor, status)
- [x] Gráfico de agendamentos por mês
- [x] Lista de próximos eventos
- [x] Resumo financeiro

## Frontend - Agendamentos
- [x] Listagem com tabela paginada
- [x] Filtros e busca
- [x] Modal/formulário de criação
- [x] Modal/formulário de edição
- [x] Visualização detalhada
- [x] Confirmação de exclusão
- [x] Badge de status colorido

## Frontend - Cobrança
- [x] Formulário de cobrança (ao fechar orçamento)
- [x] Visualização dos dados de cobrança
- [x] Edição de cobrança

## Frontend - Usuários (Admin)
- [x] Listagem de usuários
- [x] Gerenciamento de perfis

## Testes
- [x] Testes de autenticação
- [x] Testes de agendamentos
- [x] Testes de cobranças

## Novos Recursos - Fase 2
- [x] Instalar @react-pdf/renderer
- [x] Criar componente PDFRecibo
- [x] Implementar botão de download PDF no card de cobrança
- [x] Implementar alteração de status para admins
- [x] Renomear status "pendente" para "cobrança" em todo o sistema
- [x] Mudar status automaticamente para "cobrança" ao emitir PDF
- [x] Adicionar testes para PDF e alteração de status
