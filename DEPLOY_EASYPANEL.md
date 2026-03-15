# 🖥️ Guia Completo — Deploy no EasyPanel (VPS)

## ✅ PRÉ-REQUISITOS
- VPS com Ubuntu 20.04+ (mínimo 1GB RAM)
- EasyPanel já instalado (você já tem!)
- Domínio ou IP da VPS em mãos

---

## PARTE 1 — BANCO DE DADOS POSTGRESQL NO EASYPANEL

### Passo 1 — Criar o serviço PostgreSQL

1. Acesse seu EasyPanel: `http://SEU_IP:3000`
2. Clique em **"+ New Project"**
3. Nome do projeto: `condoapp`
4. Dentro do projeto, clique em **"+ New Service"**
5. Escolha **"Database"** → **"PostgreSQL"**
6. Preencha:
   - **Service Name:** `condoapp-db`
   - **Image:** `postgres:16-alpine`
   - **Database:** `condoapp`
   - **Username:** `condoapp_user`
   - **Password:** `CRIE_UMA_SENHA_FORTE_AQUI` ← anote esta senha!
7. Clique em **"Create"**
8. Aguarde ficar verde (Running) ✅

---

### Passo 2 — Criar o Schema (tabelas)

Após o banco estar rodando:

1. No EasyPanel, clique no serviço `condoapp-db`
2. Clique na aba **"Terminal"** (ou "Console")
3. Digite o comando abaixo para entrar no PostgreSQL:

```bash
psql -U condoapp_user -d condoapp
```

4. Cole TODO o conteúdo do arquivo `database/01_schema.sql`
5. Pressione Enter
6. Você verá várias mensagens `CREATE TABLE`, `CREATE INDEX`, `INSERT`
7. Digite `\q` para sair

**Alternativa via linha de comando SSH na VPS:**
```bash
# Conecte na VPS via SSH
ssh root@SEU_IP_VPS

# Copie o arquivo para a VPS
# (antes disso, cole o conteúdo em /tmp/schema.sql na VPS)
nano /tmp/schema.sql
# Cole o conteúdo do arquivo 01_schema.sql, salve com Ctrl+X → Y → Enter

# Descubra o container ID do PostgreSQL
docker ps | grep postgres

# Execute o schema
docker exec -i CONTAINER_ID psql -U condoapp_user -d condoapp < /tmp/schema.sql
```

---

## PARTE 2 — BACKEND NODE.JS NO EASYPANEL

### Passo 3 — Enviar o código para a VPS

**Opção A — Via Git (recomendado):**
```bash
# Na sua máquina local, dentro da pasta condoapp/
git init
git add .
git commit -m "primeiro commit condoapp"

# Crie um repositório no GitHub (github.com → New Repository → condoapp)
git remote add origin https://github.com/SEU_USUARIO/condoapp.git
git push -u origin main
```

**Opção B — Via SCP (copia direto para VPS):**
```bash
# No terminal da sua máquina:
scp -r ./condoapp root@SEU_IP_VPS:/home/condoapp
```

---

### Passo 4 — Criar serviço do Backend no EasyPanel

1. No projeto `condoapp`, clique em **"+ New Service"**
2. Escolha **"App"**
3. Preencha:
   - **Service Name:** `condoapp-api`
   - **Source:** Git Repository (se usou GitHub) OU escolha "Docker"

**Se usou GitHub:**
- Cole a URL do seu repositório
- Branch: `main`
- Root Directory: `backend`
- Build Command: `npm install && npm run build`
- Start Command: `node dist/index.js`

**Se subiu via SCP:**
- Escolha **"Dockerfile"**
- Path: `/home/condoapp/backend`

4. Na aba **"Environment"**, adicione as variáveis:

```
NODE_ENV=production
PORT=3000
DB_HOST=condoapp-db     ← nome do serviço postgres no EasyPanel
DB_PORT=5432
DB_NAME=condoapp
DB_USER=condoapp_user
DB_PASSWORD=SUA_SENHA_DO_BANCO
JWT_SECRET=coloque_uma_string_longa_e_aleatoria_aqui_minimo_32_chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=*
```

5. Na aba **"Ports"**, adicione: `3000`
6. Clique em **"Deploy"**
7. Aguarde ficar verde ✅

---

### Passo 5 — Domínio e HTTPS (opcional mas recomendado)

1. No serviço `condoapp-api`, clique na aba **"Domains"**
2. Clique em **"Add Domain"**
3. Digite: `api.seudominio.com.br`
4. EasyPanel configura o HTTPS automaticamente com Let's Encrypt ✅

---

## PARTE 3 — TESTAR A API

### Passo 6 — Verificar se está funcionando

Abra o navegador ou use um terminal:

```bash
# Health check
curl http://SEU_IP:3000/health

# Deve retornar:
# {"status":"ok","timestamp":"..."}
```

**Testar o login do admin:**
```bash
curl -X POST http://SEU_IP:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@condoapp.com","senha":"Admin@123"}'

# Vai retornar um token JWT — guarde-o!
```

> ⚠️ **IMPORTANTE:** Após o primeiro login, troque a senha do admin!

---

## PARTE 4 — FRONTEND IONIC (na sua máquina)

### Passo 7 — Instalar dependências e rodar

```bash
# Entre na pasta do frontend
cd condoapp/frontend

# Instale o Ionic CLI globalmente (só uma vez)
npm install -g @ionic/cli

# Instale as dependências do projeto
npm install

# Configure a URL da API
# Abra o arquivo: src/environments/environment.ts
# Troque a URL pela do seu backend
```

### Passo 8 — Rodar no navegador

```bash
# Dentro de condoapp/frontend/
ionic serve
# Abre em http://localhost:8100
```

### Passo 9 — Gerar APK para Android

```bash
# Instale o Android Studio: https://developer.android.com/studio
# Depois, dentro de condoapp/frontend/:

ionic build
npx cap add android
npx cap sync android
npx cap open android
# O Android Studio abre → clique em Build → Generate APK
```

---

## RESUMO DOS SERVIÇOS NO EASYPANEL

```
Projeto: condoapp
├── condoapp-db   (PostgreSQL 16) → porta 5432
└── condoapp-api  (Node.js)       → porta 3000
                                    domínio: api.seudominio.com.br
```

---

## 🔐 SEGURANÇA — Faça ANTES de ir para produção

1. Troque a senha do admin padrão
2. Coloque um JWT_SECRET longo e aleatório (min. 32 chars)
3. Configure FRONTEND_URL com a URL real (não use *)
4. Ative HTTPS no EasyPanel
5. No EasyPanel, vá em Settings → Bloqueie a porta 5432 ao mundo externo

---

## ❓ PROBLEMAS COMUNS

**Backend não conecta no banco:**
- Verifique se o DB_HOST é o nome do serviço no EasyPanel (ex: `condoapp-db`)
- Confirme usuário e senha nas variáveis de ambiente

**Erro "relation does not exist":**
- O schema SQL não foi executado — repita o Passo 2

**CORS Error no frontend:**
- Adicione a URL do frontend na variável FRONTEND_URL do backend
