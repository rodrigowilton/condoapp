import { Router } from 'express';
import { authMiddleware, requirePerfil } from '../middleware/auth';
import { login, registrarMorador, me } from '../controllers/authController';
import { listar as listarAvisos, criar as criarAviso, deletar as deletarAviso } from '../controllers/avisosController';
import { listar as listarEncomendas, registrar as registrarEncomenda, retirar as retirarEncomenda } from '../controllers/encomendasController';
import {
  listarCondominios, criarCondominio, bloquearCondominio,
  bloquearUsuario, estenderTrial, dashboard
} from '../controllers/gerencialController';
import { query } from '../config/database';

const router = Router();

// ── AUTH ────────────────────────────────
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);
router.post('/auth/moradores', authMiddleware, requirePerfil('sindico', 'gerencial'), registrarMorador);

// ── AVISOS ──────────────────────────────
router.get('/avisos', authMiddleware, listarAvisos);
router.post('/avisos', authMiddleware, requirePerfil('sindico'), criarAviso);
router.delete('/avisos/:id', authMiddleware, requirePerfil('sindico'), deletarAviso);

// ── ENCOMENDAS ──────────────────────────
router.get('/encomendas', authMiddleware, listarEncomendas);
router.post('/encomendas', authMiddleware, requirePerfil('porteiro', 'sindico'), registrarEncomenda);
router.patch('/encomendas/:id/retirar', authMiddleware, retirarEncomenda);

// ── RESERVAS ────────────────────────────
router.get('/espacos', authMiddleware, async (req: any, res) => {
  const result = await query(
    'SELECT * FROM espacos WHERE condominio_id = $1 AND ativo = true ORDER BY nome',
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.get('/reservas', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT r.*, e.nome as espaco_nome, u.nome as usuario_nome, u.apartamento
     FROM reservas r JOIN espacos e ON r.espaco_id = e.id JOIN usuarios u ON r.usuario_id = u.id
     WHERE r.condominio_id = $1 ORDER BY r.data_inicio DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/reservas', authMiddleware, async (req: any, res) => {
  const { espaco_id, data_inicio, data_fim, observacao } = req.body;
  const conflito = await query(
    `SELECT id FROM reservas WHERE espaco_id = $1 AND status = 'aprovada'
     AND NOT (data_fim <= $2 OR data_inicio >= $3)`,
    [espaco_id, data_inicio, data_fim]
  );
  if (conflito.rows.length > 0) return res.status(400).json({ erro: 'Horário indisponível para este espaço' });

  const result = await query(
    `INSERT INTO reservas (espaco_id, usuario_id, condominio_id, data_inicio, data_fim, observacao)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [espaco_id, req.user.id, req.user.condominio_id, data_inicio, data_fim, observacao]
  );
  res.status(201).json(result.rows[0]);
});

router.patch('/reservas/:id/status', authMiddleware, requirePerfil('sindico'), async (req: any, res) => {
  const { status } = req.body;
  const result = await query(
    'UPDATE reservas SET status = $1 WHERE id = $2 AND condominio_id = $3 RETURNING *',
    [status, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});

// ── VISITANTES ──────────────────────────
router.get('/visitantes', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT v.*, m.nome as morador_nome, m.apartamento
     FROM visitantes v LEFT JOIN usuarios m ON v.morador_id = m.id
     WHERE v.condominio_id = $1 ORDER BY v.criado_em DESC LIMIT 100`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/visitantes', authMiddleware, requirePerfil('porteiro', 'sindico'), async (req: any, res) => {
  const { morador_id, nome, documento, placa, motivo, foto_url } = req.body;
  const result = await query(
    `INSERT INTO visitantes (condominio_id, morador_id, registrado_por, nome, documento, placa, motivo, foto_url, status, entrada_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'autorizado',NOW()) RETURNING *`,
    [req.user.condominio_id, morador_id, req.user.id, nome, documento, placa, motivo, foto_url]
  );
  res.status(201).json(result.rows[0]);
});

// ── ASSEMBLEIAS / VOTAÇÕES ──────────────
router.get('/assembleias', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT a.*, u.nome as criado_por_nome,
            COUNT(v.id) as total_votos,
            COUNT(v.id) FILTER (WHERE v.voto = 'sim') as votos_sim,
            COUNT(v.id) FILTER (WHERE v.voto = 'nao') as votos_nao
     FROM assembleias a JOIN usuarios u ON a.criado_por = u.id
     LEFT JOIN votos v ON v.assembleia_id = a.id
     WHERE a.condominio_id = $1 GROUP BY a.id, u.nome ORDER BY a.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/assembleias', authMiddleware, requirePerfil('sindico'), async (req: any, res) => {
  const { titulo, descricao, data_limite } = req.body;
  const result = await query(
    `INSERT INTO assembleias (condominio_id, criado_por, titulo, descricao, data_limite)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, descricao, data_limite]
  );
  res.status(201).json(result.rows[0]);
});

router.post('/assembleias/:id/votar', authMiddleware, async (req: any, res) => {
  const { voto } = req.body;
  try {
    const result = await query(
      `INSERT INTO votos (assembleia_id, usuario_id, voto) VALUES ($1,$2,$3)
       ON CONFLICT (assembleia_id, usuario_id) DO UPDATE SET voto = $3 RETURNING *`,
      [req.params.id, req.user.id, voto]
    );
    res.json(result.rows[0]);
  } catch {
    res.status(400).json({ erro: 'Erro ao registrar voto' });
  }
});

// ── ACHADOS & PERDIDOS ──────────────────
router.get('/achados', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT ap.*, u.nome as registrado_nome FROM achados_perdidos ap
     JOIN usuarios u ON ap.registrado_por = u.id
     WHERE ap.condominio_id = $1 ORDER BY ap.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/achados', authMiddleware, async (req: any, res) => {
  const { descricao, local_encontrado, foto_url } = req.body;
  const result = await query(
    `INSERT INTO achados_perdidos (condominio_id, registrado_por, descricao, local_encontrado, foto_url)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, descricao, local_encontrado, foto_url]
  );
  res.status(201).json(result.rows[0]);
});

// ── MURAL ───────────────────────────────
router.get('/mural', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT m.*, u.nome as autor_nome, u.apartamento FROM mural m
     JOIN usuarios u ON m.autor_id = u.id
     WHERE m.condominio_id = $1 AND m.ativo = true ORDER BY m.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/mural', authMiddleware, async (req: any, res) => {
  const { titulo, conteudo, categoria } = req.body;
  const result = await query(
    `INSERT INTO mural (condominio_id, autor_id, titulo, conteudo, categoria)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, conteudo, categoria || 'geral']
  );
  res.status(201).json(result.rows[0]);
});

// ── MANUTENÇÕES ─────────────────────────
router.get('/manutencoes', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT m.*, u.nome as solicitante_nome, u.apartamento FROM manutencoes m
     JOIN usuarios u ON m.solicitante_id = u.id
     WHERE m.condominio_id = $1 ORDER BY m.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});

router.post('/manutencoes', authMiddleware, async (req: any, res) => {
  const { titulo, descricao, local, foto_url } = req.body;
  const result = await query(
    `INSERT INTO manutencoes (condominio_id, solicitante_id, titulo, descricao, local, foto_url)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, descricao, local, foto_url]
  );
  res.status(201).json(result.rows[0]);
});

router.patch('/manutencoes/:id/status', authMiddleware, requirePerfil('sindico'), async (req: any, res) => {
  const { status } = req.body;
  const result = await query(
    `UPDATE manutencoes SET status = $1, resolvido_em = CASE WHEN $1 = 'concluido' THEN NOW() ELSE NULL END
     WHERE id = $2 AND condominio_id = $3 RETURNING *`,
    [status, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});

// ── NOTIFICAÇÕES ────────────────────────
router.get('/notificacoes', authMiddleware, async (req: any, res) => {
  const result = await query(
    'SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criado_em DESC LIMIT 50',
    [req.user.id]
  );
  res.json(result.rows);
});

router.patch('/notificacoes/:id/lida', authMiddleware, async (req: any, res) => {
  await query('UPDATE notificacoes SET lida = true WHERE id = $1 AND usuario_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ── GERENCIAL (só admin) ─────────────────
router.get('/gerencial/dashboard', authMiddleware, requirePerfil('gerencial'), dashboard);
router.get('/gerencial/condominios', authMiddleware, requirePerfil('gerencial'), listarCondominios);
router.post('/gerencial/condominios', authMiddleware, requirePerfil('gerencial'), criarCondominio);
router.patch('/gerencial/condominios/:id/bloquear', authMiddleware, requirePerfil('gerencial'), bloquearCondominio);
router.patch('/gerencial/condominios/:id/trial', authMiddleware, requirePerfil('gerencial'), estenderTrial);
router.patch('/gerencial/usuarios/:id/bloquear', authMiddleware, requirePerfil('gerencial'), bloquearUsuario);

router.get('/gerencial/usuarios', authMiddleware, requirePerfil('gerencial'), async (req, res) => {
  const result = await query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.bloqueado, u.criado_em, c.nome as condominio_nome
     FROM usuarios u LEFT JOIN condominios c ON u.condominio_id = c.id
     WHERE u.perfil != 'gerencial' ORDER BY u.criado_em DESC`
  );
  res.json(result.rows);
});

export default router;
