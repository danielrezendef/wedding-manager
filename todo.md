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

## Correções e Melhorias - Fase 3
- [x] Verificar e corrigir responsividade em mobile
- [x] Corrigir sobreposição de elementos em diferentes tamanhos
- [x] Corrigir problema de login automático
- [x] Adicionar UI para login com Google (em breve)
- [x] Removido Apple Sign In (mantido apenas Google)
- [x] Testar fluxo de login social

## Página de Perfil do Usuário - Fase 4
- [x] Criar router tRPC para atualizar perfil
- [x] Criar página de Perfil com formulário
- [x] Adicionar rota no App.tsx
- [x] Adicionar link no menu/sidebar
- [x] Testes de atualização de perfil

## Upload de Foto de Perfil - Fase 5
- [x] Adicionar campo profilePhoto no schema users
- [x] Criar router tRPC para upload de foto
- [x] Implementar componente de upload no frontend
- [x] Integrar foto no menu lateral
- [x] Integrar foto na página de Perfil
- [x] Testes de upload de foto

## Integração com S3 para Fotos de Perfil - Fase 6
- [x] Criar router tRPC para gerar presigned URL
- [x] Implementar upload direto para S3 no frontend
- [x] Atualizar procedure uploadProfilePhoto para usar S3
- [x] Remover armazenamento base64 de fotos
- [x] Testes de integração S3

## Correção de Upload e OAuth - Fase 7
- [x] Debugar e corrigir erro de upload de imagem
- [x] Implementar autenticação OAuth com Google
- [x] Buscar foto de perfil do Google automaticamente
- [x] Testes de OAuth e upload de foto

## Autenticação Social - Fase 8
- [x] Instalar google-auth-library e apple-signin-auth
- [x] Criar routers tRPC para Google OAuth
- [x] Criar routers tRPC para Apple Sign In
- [x] Atualizar página de Login com botões sociais funcionais
- [x] Buscar foto de perfil automaticamente do Google
- [x] Buscar foto de perfil automaticamente do Apple
- [x] Solicitar credenciais Google e Apple ao usuário
- [x] Testes de autenticação social
- [x] Sincronizar com Git

## Remoção Apple Sign In - Fase 9
- [x] Remover procedure appleLogin do backend
- [x] Remover botão e lógica Apple do Login.tsx
- [x] Remover Apple JS SDK do index.html
- [ ] Remover secret VITE_APPLE_CLIENT_ID
- [x] Testes e sincronização com Git

## Alteração de Status - Fase 10
- [x] Alterar enum de status "Cobrança" para "Pagamento" no schema
- [x] Executar pnpm db:push para migrar banco
- [x] Atualizar backend (routers e db helpers)
- [x] Atualizar frontend (componentes, páginas, labels)
- [x] Atualizar testes
- [x] Build e testes passando
- [ ] Sincronizar com Git
