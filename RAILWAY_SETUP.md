# Guia Completo: Configurar Wedding Manager no Railway

Este guia fornece um passo a passo detalhado para fazer deploy do Wedding Manager no Railway com banco de dados PostgreSQL.

---

## Pré-requisitos

- Conta no [Railway.app](https://railway.app) (gratuita)
- Repositório GitHub com o código do projeto
- Credenciais Google OAuth (para login social)

---

## PARTE 1: Preparar o Repositório GitHub

### 1.1 Fazer push do código para GitHub

Se ainda não fez, envie o código para GitHub:

```bash
cd /home/ubuntu/wedding-manager

# Inicializar Git (se não estiver inicializado)
git init

# Adicionar repositório remoto (substitua USER/REPO pelos seus dados)
git remote add origin https://github.com/SEU_USUARIO/wedding-manager.git

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Initial commit: Wedding Manager com Google OAuth"

# Fazer push para master
git push -u origin master
```

### 1.2 Verificar se o repositório está público ou privado

- Se for **privado**, Railway conseguirá acessar via sua conta GitHub
- Se for **público**, qualquer pessoa pode ver o código (recomendado para projetos open-source)

---

## PARTE 2: Criar Projeto no Railway

### 2.1 Acessar Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Sign in with GitHub"** (ou crie conta)
3. Autorize o Railway a acessar seus repositórios

### 2.2 Criar novo projeto

1. Na dashboard, clique em **"Create New Project"**
2. Selecione **"Deploy from GitHub repo"**
3. Procure por **"wedding-manager"** (ou o nome do seu repositório)
4. Clique em **"Deploy"**

Railway começará a fazer o build automaticamente.

---

## PARTE 3: Configurar Banco de Dados PostgreSQL

### 3.1 Adicionar PostgreSQL ao projeto

1. Na página do projeto no Railway, clique em **"+ New"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Railway criará automaticamente uma instância PostgreSQL

### 3.2 Obter credenciais do banco

1. Clique na aba **"PostgreSQL"** no painel do projeto
2. Vá para **"Variables"** (ou **"Connect"**)
3. Você verá:
   - `DATABASE_URL` (string de conexão completa)
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`

**Copie a `DATABASE_URL`** — você precisará dela para configurar variáveis de ambiente.

---

## PARTE 4: Configurar Variáveis de Ambiente

### 4.1 Acessar variáveis do projeto

1. Na página do projeto Railway, clique na aba do seu **aplicativo** (não no banco de dados)
2. Vá para **"Variables"**

### 4.2 Adicionar variáveis obrigatórias

Adicione as seguintes variáveis de ambiente:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | `postgresql://...` | String de conexão do PostgreSQL (copie do banco) |
| `NODE_ENV` | `production` | Ambiente de produção |
| `JWT_SECRET` | `sua-chave-secreta-aqui` | Chave para assinar JWTs (gere uma string aleatória forte) |
| `VITE_GOOGLE_CLIENT_ID` | `seu-google-client-id` | ID do cliente Google OAuth |
| `VITE_APP_TITLE` | `Wedding Manager` | Título da aplicação |
| `VITE_APP_LOGO` | `https://...` | URL do logo (opcional) |

### 4.3 Gerar JWT_SECRET seguro

Execute no terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie o resultado e use como `JWT_SECRET`.

### 4.4 Obter Google Client ID

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione existente
3. Vá para **"APIs & Services"** → **"Credentials"**
4. Clique em **"Create Credentials"** → **"OAuth 2.0 Client ID"**
5. Selecione **"Web application"**
6. Adicione URIs autorizados:
   - `https://seu-projeto.railway.app` (substitua pelo seu domínio)
   - `https://seu-projeto.railway.app/api/oauth/callback`
   - `http://localhost:3000` (para testes locais)
7. Copie o **Client ID** e adicione em `VITE_GOOGLE_CLIENT_ID`

---

## PARTE 5: Configurar Domínio Customizado (Opcional)

### 5.1 Usar domínio do Railway

Railway fornece um domínio automático: `seu-projeto.railway.app`

Para usar seu próprio domínio:

1. Na página do projeto, vá para **"Settings"**
2. Procure por **"Custom Domain"**
3. Adicione seu domínio (ex: `wedding-manager.com`)
4. Railway fornecerá instruções para configurar DNS

---

## PARTE 6: Fazer Deploy

### 6.1 Deploy automático

Railway faz deploy automaticamente quando você faz push para a branch `master`:

```bash
git push origin master
```

Você verá o build acontecendo em tempo real na dashboard do Railway.

### 6.2 Monitorar o deploy

1. Na dashboard do Railway, clique na aba **"Deployments"**
2. Você verá o status do build:
   - 🟡 **Building** — compilando
   - 🟢 **Success** — deploy concluído
   - 🔴 **Failed** — erro no deploy

### 6.3 Ver logs

Se houver erro, clique em **"View Logs"** para ver detalhes.

---

## PARTE 7: Executar Migrations do Banco de Dados

### 7.1 Conectar ao banco de dados

Após o deploy bem-sucedido, você precisa executar as migrations:

**Opção A: Usar Railway CLI (recomendado)**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Fazer login
railway login

# Conectar ao projeto
railway link

# Executar migrations
railway run pnpm db:push
```

**Opção B: Conectar manualmente via PostgreSQL**

```bash
# Instalar psql (PostgreSQL client)
# No macOS: brew install postgresql
# No Ubuntu: sudo apt-get install postgresql-client

# Conectar ao banco
psql "postgresql://user:password@host:port/database"

# Executar migrations (dentro do psql)
\i drizzle/migrations/0001_initial.sql
```

### 7.2 Verificar se as tabelas foram criadas

```bash
railway run pnpm db:push
```

Se tudo correr bem, você verá: ✅ **Migrations applied successfully**

---

## PARTE 8: Testar a Aplicação

### 8.1 Acessar a aplicação

1. Vá para o domínio do seu projeto: `https://seu-projeto.railway.app`
2. Você deve ver a página de login do Wedding Manager

### 8.2 Testar login

1. Clique em **"Continuar com Google"**
2. Faça login com sua conta Google
3. Você deve ser redirecionado para o dashboard

### 8.3 Verificar logs em tempo real

Na dashboard do Railway, clique em **"Logs"** para ver o que está acontecendo.

---

## PARTE 9: Troubleshooting

### Problema: "Build failed"

**Solução:**
1. Verifique os logs: clique em **"View Logs"** no Railway
2. Procure por erros de compilação
3. Verifique se `package.json` tem o script `start`
4. Verifique se `railway.json` está correto

### Problema: "Database connection error"

**Solução:**
1. Verifique se `DATABASE_URL` está correto
2. Verifique se o PostgreSQL está rodando
3. Tente reconectar: na dashboard, delete o banco e crie um novo

### Problema: "Google login não funciona"

**Solução:**
1. Verifique se `VITE_GOOGLE_CLIENT_ID` está correto
2. Verifique se o domínio está autorizado no Google Cloud Console
3. Verifique se a URL de callback está exata: `https://seu-projeto.railway.app/api/oauth/callback`

### Problema: "Página em branco ou erro 500"

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros JavaScript
3. Verifique os logs do Railway
4. Tente limpar cache: Ctrl+Shift+Delete

---

## PARTE 10: Próximos Passos

### 10.1 Configurar CI/CD (opcional)

Railway já faz deploy automático. Para mais controle, configure GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [master]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: railway up
```

### 10.2 Monitorar performance

1. Na dashboard do Railway, vá para **"Metrics"**
2. Monitore CPU, memória e requisições
3. Configure alertas se necessário

### 10.3 Backups do banco de dados

Railway faz backups automáticos. Para acessar:

1. Clique na aba **"PostgreSQL"**
2. Vá para **"Backups"**
3. Você pode restaurar de um backup anterior

---

## Resumo dos Passos

| Passo | Ação |
|-------|------|
| 1 | Fazer push do código para GitHub |
| 2 | Criar projeto no Railway |
| 3 | Adicionar PostgreSQL |
| 4 | Configurar variáveis de ambiente |
| 5 | Configurar Google OAuth |
| 6 | Fazer deploy (automático) |
| 7 | Executar migrations |
| 8 | Testar a aplicação |
| 9 | Monitorar e troubleshoot |

---

## Contato e Suporte

- **Railway Docs:** https://docs.railway.app
- **Railway Community:** https://railway.app/support
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2

---

**Pronto para deploy! 🚀**
