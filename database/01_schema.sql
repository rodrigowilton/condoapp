-- ============================================================
-- CONDOAPP — Schema PostgreSQL
-- Execute este arquivo no banco criado no EasyPanel
-- ============================================================

-- Extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ────────────────────────────────────────
-- TABELA: condominios
-- ────────────────────────────────────────
CREATE TABLE condominios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        VARCHAR(200) NOT NULL,
  endereco    VARCHAR(300),
  cidade      VARCHAR(100),
  estado      VARCHAR(2),
  cep         VARCHAR(9),
  ativo       BOOLEAN DEFAULT TRUE,
  trial_inicio TIMESTAMP DEFAULT NOW(),
  trial_fim   TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days'),
  bloqueado   BOOLEAN DEFAULT FALSE,
  criado_em   TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: usuarios
-- ────────────────────────────────────────
CREATE TABLE usuarios (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  nome          VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  senha_hash    VARCHAR(300) NOT NULL,
  perfil        VARCHAR(20) NOT NULL CHECK (perfil IN ('morador','sindico','porteiro','gerencial')),
  apartamento   VARCHAR(20),
  bloco         VARCHAR(10),
  telefone      VARCHAR(20),
  avatar_url    VARCHAR(500),
  ativo         BOOLEAN DEFAULT TRUE,
  bloqueado     BOOLEAN DEFAULT FALSE,
  criado_em     TIMESTAMP DEFAULT NOW(),
  ultimo_acesso TIMESTAMP
);

-- ────────────────────────────────────────
-- TABELA: avisos
-- ────────────────────────────────────────
CREATE TABLE avisos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  autor_id      UUID REFERENCES usuarios(id),
  titulo        VARCHAR(200) NOT NULL,
  conteudo      TEXT NOT NULL,
  urgente       BOOLEAN DEFAULT FALSE,
  fixado        BOOLEAN DEFAULT FALSE,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: espacos (churrasqueira, salão, etc.)
-- ────────────────────────────────────────
CREATE TABLE espacos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  nome          VARCHAR(100) NOT NULL,
  descricao     TEXT,
  capacidade    INTEGER,
  ativo         BOOLEAN DEFAULT TRUE
);

-- ────────────────────────────────────────
-- TABELA: reservas
-- ────────────────────────────────────────
CREATE TABLE reservas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  espaco_id     UUID REFERENCES espacos(id) ON DELETE CASCADE,
  usuario_id    UUID REFERENCES usuarios(id),
  condominio_id UUID REFERENCES condominios(id),
  data_inicio   TIMESTAMP NOT NULL,
  data_fim      TIMESTAMP NOT NULL,
  status        VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada','cancelada')),
  observacao    TEXT,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: encomendas
-- ────────────────────────────────────────
CREATE TABLE encomendas (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id   UUID REFERENCES condominios(id) ON DELETE CASCADE,
  morador_id      UUID REFERENCES usuarios(id),
  registrado_por  UUID REFERENCES usuarios(id),
  remetente       VARCHAR(200),
  descricao       VARCHAR(300),
  prateleira      VARCHAR(50),
  foto_url        VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando','retirado')),
  retirado_em     TIMESTAMP,
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: visitantes
-- ────────────────────────────────────────
CREATE TABLE visitantes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id   UUID REFERENCES condominios(id) ON DELETE CASCADE,
  morador_id      UUID REFERENCES usuarios(id),
  registrado_por  UUID REFERENCES usuarios(id),
  nome            VARCHAR(200) NOT NULL,
  documento       VARCHAR(50),
  placa           VARCHAR(20),
  foto_url        VARCHAR(500),
  motivo          VARCHAR(200),
  status          VARCHAR(20) DEFAULT 'aguardando' CHECK (status IN ('aguardando','autorizado','recusado','saiu')),
  entrada_em      TIMESTAMP,
  saida_em        TIMESTAMP,
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: assembleias (votações)
-- ────────────────────────────────────────
CREATE TABLE assembleias (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  criado_por    UUID REFERENCES usuarios(id),
  titulo        VARCHAR(200) NOT NULL,
  descricao     TEXT,
  data_limite   TIMESTAMP NOT NULL,
  status        VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta','encerrada')),
  criado_em     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE votos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assembleia_id UUID REFERENCES assembleias(id) ON DELETE CASCADE,
  usuario_id    UUID REFERENCES usuarios(id),
  voto          VARCHAR(10) CHECK (voto IN ('sim','nao','abstencao')),
  criado_em     TIMESTAMP DEFAULT NOW(),
  UNIQUE(assembleia_id, usuario_id)
);

-- ────────────────────────────────────────
-- TABELA: achados_perdidos
-- ────────────────────────────────────────
CREATE TABLE achados_perdidos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id   UUID REFERENCES condominios(id) ON DELETE CASCADE,
  registrado_por  UUID REFERENCES usuarios(id),
  descricao       VARCHAR(300) NOT NULL,
  local_encontrado VARCHAR(200),
  foto_url        VARCHAR(500),
  status          VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel','retirado')),
  retirado_por    UUID REFERENCES usuarios(id),
  criado_em       TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: mural (recados entre moradores)
-- ────────────────────────────────────────
CREATE TABLE mural (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  autor_id      UUID REFERENCES usuarios(id),
  titulo        VARCHAR(200),
  conteudo      TEXT NOT NULL,
  categoria     VARCHAR(50) DEFAULT 'geral',
  ativo         BOOLEAN DEFAULT TRUE,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: manutencoes (chamados)
-- ────────────────────────────────────────
CREATE TABLE manutencoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  solicitante_id UUID REFERENCES usuarios(id),
  titulo        VARCHAR(200) NOT NULL,
  descricao     TEXT,
  local         VARCHAR(200),
  foto_url      VARCHAR(500),
  status        VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','concluido','cancelado')),
  resolvido_em  TIMESTAMP,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: vagas
-- ────────────────────────────────────────
CREATE TABLE vagas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominio_id UUID REFERENCES condominios(id) ON DELETE CASCADE,
  numero        VARCHAR(20) NOT NULL,
  tipo          VARCHAR(20) DEFAULT 'morador' CHECK (tipo IN ('morador','visitante')),
  usuario_id    UUID REFERENCES usuarios(id),
  ocupada       BOOLEAN DEFAULT FALSE,
  placa         VARCHAR(20),
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- TABELA: notificacoes
-- ────────────────────────────────────────
CREATE TABLE notificacoes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  mensagem      TEXT,
  tipo          VARCHAR(50),
  lida          BOOLEAN DEFAULT FALSE,
  criado_em     TIMESTAMP DEFAULT NOW()
);

-- ────────────────────────────────────────
-- ÍNDICES para performance
-- ────────────────────────────────────────
CREATE INDEX idx_usuarios_condominio ON usuarios(condominio_id);
CREATE INDEX idx_avisos_condominio ON avisos(condominio_id);
CREATE INDEX idx_encomendas_morador ON encomendas(morador_id);
CREATE INDEX idx_reservas_espaco ON reservas(espaco_id);
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);

-- ────────────────────────────────────────
-- USUÁRIO GERENCIAL PADRÃO
-- Senha: Admin@123 (troque depois!)
-- Hash bcrypt já gerado
-- ────────────────────────────────────────
INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
VALUES (
  'Administrador',
  'admin@condoapp.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3lGA.',
  'gerencial',
  true
);

-- ────────────────────────────────────────
-- CONDOMÍNIO DE EXEMPLO
-- ────────────────────────────────────────
INSERT INTO condominios (nome, endereco, cidade, estado, cep)
VALUES ('Residencial Exemplo', 'Rua das Flores, 100', 'Vila Velha', 'ES', '29100-000');
