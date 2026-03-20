import { Router } from 'express';
import { authMiddleware, requirePerfil } from '../middleware/auth';
import { login, registrarMorador, me } from '../controllers/authController';
import { listar as listarAvisos, criar as criarAviso, deletar as deletarAviso } from '../controllers/avisosController';
import { listar as listarEncomendas, registrar as registrarEncomenda, retirar as retirarEncomenda } from '../controllers/encomendasController';
import { listarCondominios, criarCondominio, bloquearCondominio, bloquearUsuario, estenderTrial, dashboard } from '../controllers/gerencialController';
import { query } from '../config/database';

const router = Router();

// AUTH
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, me);
router.post('/auth/moradores', authMiddleware, requirePerfil('sindico', 'gerencial'), registrarMorador);

// MORADORES
router.get('/moradores', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT id, nome, email, perfil, apartamento, bloco, telefone, ativo, bloqueado, criado_em
     FROM usuarios WHERE condominio_id = $1 AND perfil = 'morador' ORDER BY nome`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.patch('/moradores/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { nome, apartamento, bloco, telefone, ativo } = req.body;
  const result = await query(
    `UPDATE usuarios SET nome=$1, apartamento=$2, bloco=$3, telefone=$4, ativo=$5 WHERE id=$6 AND condominio_id=$7 RETURNING id, nome, email, apartamento, bloco, telefone, ativo`,
    [nome, apartamento, bloco, telefone, ativo, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/moradores/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  await query('DELETE FROM usuarios WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// AVISOS
router.get('/avisos', authMiddleware, listarAvisos);
router.post('/avisos', authMiddleware, requirePerfil('sindico', 'gerencial'), criarAviso);
router.patch('/avisos/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { titulo, conteudo, urgente, fixado } = req.body;
  const result = await query(
    `UPDATE avisos SET titulo=$1, conteudo=$2, urgente=$3, fixado=$4 WHERE id=$5 AND condominio_id=$6 RETURNING *`,
    [titulo, conteudo, urgente, fixado, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/avisos/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), deletarAviso);

// ENCOMENDAS
router.get('/encomendas', authMiddleware, listarEncomendas);
router.post('/encomendas', authMiddleware, requirePerfil('porteiro', 'sindico', 'gerencial'), registrarEncomenda);
router.patch('/encomendas/:id/retirar', authMiddleware, retirarEncomenda);
router.delete('/encomendas/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  await query('DELETE FROM encomendas WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// ESPACOS
router.get('/espacos', authMiddleware, async (req: any, res) => {
  const result = await query('SELECT * FROM espacos WHERE condominio_id=$1 AND ativo=true ORDER BY nome', [req.user.condominio_id]);
  res.json(result.rows);
});
router.post('/espacos', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { nome, descricao, capacidade } = req.body;
  const result = await query(
    `INSERT INTO espacos (condominio_id, nome, descricao, capacidade) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.condominio_id, nome, descricao, capacidade]
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/espacos/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { nome, descricao, capacidade } = req.body;
  const result = await query(
    `UPDATE espacos SET nome=$1, descricao=$2, capacidade=$3 WHERE id=$4 AND condominio_id=$5 RETURNING *`,
    [nome, descricao, capacidade, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/espacos/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  await query('UPDATE espacos SET ativo=false WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// RESERVAS
router.get('/reservas', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT r.*, e.nome as espaco_nome, u.nome as usuario_nome, u.apartamento
     FROM reservas r JOIN espacos e ON r.espaco_id = e.id JOIN usuarios u ON r.usuario_id = u.id
     WHERE r.condominio_id=$1 ORDER BY r.data_inicio DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.post('/reservas', authMiddleware, async (req: any, res) => {
  const { espaco_id, data_inicio, data_fim, observacao } = req.body;
  const conflito = await query(
    `SELECT id FROM reservas WHERE espaco_id=$1 AND status='aprovada' AND NOT (data_fim<=$2 OR data_inicio>=$3)`,
    [espaco_id, data_inicio, data_fim]
  );
  if (conflito.rows.length > 0) return res.status(400).json({ erro: 'Horario indisponivel para este espaco' });
  const result = await query(
    `INSERT INTO reservas (espaco_id, usuario_id, condominio_id, data_inicio, data_fim, observacao) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [espaco_id, req.user.id, req.user.condominio_id, data_inicio, data_fim, observacao]
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/reservas/:id/status', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { status } = req.body;
  const result = await query('UPDATE reservas SET status=$1 WHERE id=$2 AND condominio_id=$3 RETURNING *', [status, req.params.id, req.user.condominio_id]);
  res.json(result.rows[0]);
});
router.delete('/reservas/:id', authMiddleware, async (req: any, res) => {
  await query('DELETE FROM reservas WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// VISITANTES
// GET — morador vê só os do próprio apto, porteiro/sindico vê todos
router.get('/visitantes', authMiddleware, async (req: any, res) => {
  const { condominio_id, perfil, id, apartamento } = req.user;
  let sql = `
    SELECT v.*, m.nome as morador_nome, m.apartamento as morador_apartamento
    FROM visitantes v
    LEFT JOIN usuarios m ON v.morador_id = m.id
    WHERE v.condominio_id=$1
  `;
  const params: any[] = [condominio_id];
  if (perfil === 'morador') {
    sql += ` AND (v.morador_id=$2 OR v.apartamento=$3)`;
    params.push(id, apartamento);
  }
  sql += ` ORDER BY v.criado_em DESC LIMIT 100`;
  const result = await query(sql, params);
  res.json(result.rows);
});

// POST — morador cria com status pendente, porteiro/sindico cria como autorizado
router.post('/visitantes', authMiddleware, async (req: any, res) => {
  const { morador_id, nome, documento, placa, motivo, apartamento } = req.body;
  const { condominio_id, id: registrado_por, perfil, apartamento: apto_usuario } = req.user;
  const status = perfil === 'morador' ? 'pendente' : 'autorizado';
  const entrada_em = perfil === 'morador' ? null : 'NOW()';
  const apto = apartamento || apto_usuario;
  const result = await query(
    `INSERT INTO visitantes (condominio_id, morador_id, registrado_por, nome, documento, placa, motivo, status, apartamento, entrada_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,${perfil === 'morador' ? 'NULL' : 'NOW()'}) RETURNING *`,
    [condominio_id, morador_id || req.user.id, registrado_por, nome, documento, placa, motivo, status, apto]
  );
  res.status(201).json(result.rows[0]);
});

// PATCH autorizar — porteiro completa dados e autoriza visitante pendente
router.patch('/visitantes/:id/autorizar', authMiddleware, requirePerfil('porteiro', 'sindico', 'gerencial'), async (req: any, res) => {
  const { documento, placa, motivo } = req.body;
  const result = await query(
    `UPDATE visitantes
     SET status='autorizado',
         entrada_em=NOW(),
         documento=COALESCE(NULLIF($1,''), documento),
         placa=COALESCE(NULLIF($2,''), placa),
         motivo=COALESCE(NULLIF($3,''), motivo)
     WHERE id=$4 AND condominio_id=$5 RETURNING *`,
    [documento, placa, motivo, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});

// PATCH status — registrar saída
router.patch('/visitantes/:id/status', authMiddleware, async (req: any, res) => {
  const { status } = req.body;
  const extra = status === 'saiu' ? ', saida_em=NOW()' : '';
  const result = await query(
    `UPDATE visitantes SET status=$1${extra} WHERE id=$2 AND condominio_id=$3 RETURNING *`,
    [status, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});

router.delete('/visitantes/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  await query('DELETE FROM visitantes WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// ASSEMBLEIAS
router.get('/assembleias', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT a.*, u.nome as criado_por_nome,
            COUNT(v.id) as total_votos,
            COUNT(v.id) FILTER (WHERE v.voto='sim') as votos_sim,
            COUNT(v.id) FILTER (WHERE v.voto='nao') as votos_nao,
            COUNT(v.id) FILTER (WHERE v.voto='abstencao') as votos_abstencao
     FROM assembleias a JOIN usuarios u ON a.criado_por=u.id
     LEFT JOIN votos v ON v.assembleia_id=a.id
     WHERE a.condominio_id=$1 GROUP BY a.id, u.nome ORDER BY a.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.post('/assembleias', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { titulo, descricao, data_limite } = req.body;
  const result = await query(
    `INSERT INTO assembleias (condominio_id, criado_por, titulo, descricao, data_limite) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, descricao, data_limite]
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/assembleias/:id/encerrar', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const result = await query(`UPDATE assembleias SET status='encerrada' WHERE id=$1 AND condominio_id=$2 RETURNING *`, [req.params.id, req.user.condominio_id]);
  res.json(result.rows[0]);
});
router.delete('/assembleias/:id', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  await query('DELETE FROM assembleias WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});
router.post('/assembleias/:id/votar', authMiddleware, async (req: any, res) => {
  const { voto } = req.body;
  try {
    const result = await query(
      `INSERT INTO votos (assembleia_id, usuario_id, voto) VALUES ($1,$2,$3)
       ON CONFLICT (assembleia_id, usuario_id) DO UPDATE SET voto=$3 RETURNING *`,
      [req.params.id, req.user.id, voto]
    );
    res.json(result.rows[0]);
  } catch { res.status(400).json({ erro: 'Erro ao registrar voto' }); }
});

// ACHADOS
router.get('/achados', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT ap.*, u.nome as registrado_nome FROM achados_perdidos ap
     JOIN usuarios u ON ap.registrado_por=u.id
     WHERE ap.condominio_id=$1 ORDER BY ap.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.post('/achados', authMiddleware, async (req: any, res) => {
  const { descricao, local_encontrado } = req.body;
  const result = await query(
    `INSERT INTO achados_perdidos (condominio_id, registrado_por, descricao, local_encontrado) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.user.condominio_id, req.user.id, descricao, local_encontrado]
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/achados/:id/retirar', authMiddleware, async (req: any, res) => {
  const { retirado_por_nome, retirado_por_apto } = req.body;
  const result = await query(
    `UPDATE achados_perdidos
     SET status='retirado', retirado_por=$1, retirado_por_nome=$2, retirado_por_apto=$3, retirado_em=NOW()
     WHERE id=$4 AND condominio_id=$5 RETURNING *`,
    [req.user.id, retirado_por_nome, retirado_por_apto, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/achados/:id', authMiddleware, async (req: any, res) => {
  await query('DELETE FROM achados_perdidos WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// MURAL
router.get('/mural', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT m.*, u.nome as autor_nome, u.apartamento FROM mural m
     JOIN usuarios u ON m.autor_id=u.id
     WHERE m.condominio_id=$1 AND m.ativo=true ORDER BY m.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.post('/mural', authMiddleware, async (req: any, res) => {
  const { titulo, conteudo, categoria } = req.body;
  const result = await query(
    `INSERT INTO mural (condominio_id, autor_id, titulo, conteudo, categoria) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, conteudo, categoria || 'geral']
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/mural/:id', authMiddleware, async (req: any, res) => {
  const { titulo, conteudo, categoria } = req.body;
  const result = await query(
    `UPDATE mural SET titulo=$1, conteudo=$2, categoria=$3 WHERE id=$4 AND condominio_id=$5 RETURNING *`,
    [titulo, conteudo, categoria, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/mural/:id', authMiddleware, async (req: any, res) => {
  await query(`UPDATE mural SET ativo=false WHERE id=$1 AND condominio_id=$2`, [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// MANUTENCOES
router.get('/manutencoes', authMiddleware, async (req: any, res) => {
  const result = await query(
    `SELECT m.*, u.nome as solicitante_nome, u.apartamento FROM manutencoes m
     JOIN usuarios u ON m.solicitante_id=u.id
     WHERE m.condominio_id=$1 ORDER BY m.criado_em DESC`,
    [req.user.condominio_id]
  );
  res.json(result.rows);
});
router.post('/manutencoes', authMiddleware, async (req: any, res) => {
  const { titulo, descricao, local } = req.body;
  const result = await query(
    `INSERT INTO manutencoes (condominio_id, solicitante_id, titulo, descricao, local) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [req.user.condominio_id, req.user.id, titulo, descricao, local]
  );
  res.status(201).json(result.rows[0]);
});
router.patch('/manutencoes/:id/status', authMiddleware, requirePerfil('sindico', 'gerencial'), async (req: any, res) => {
  const { status } = req.body;
  const result = await query(
    `UPDATE manutencoes SET status=$1::varchar, resolvido_em=CASE WHEN $1::varchar='concluido' THEN NOW() ELSE NULL END WHERE id=$2 AND condominio_id=$3 RETURNING *`,
    [status, req.params.id, req.user.condominio_id]
  );
  res.json(result.rows[0]);
});
router.delete('/manutencoes/:id', authMiddleware, async (req: any, res) => {
  await query('DELETE FROM manutencoes WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
  res.json({ ok: true });
});

// NOTIFICACOES
router.get('/notificacoes', authMiddleware, async (req: any, res) => {
  const result = await query('SELECT * FROM notificacoes WHERE usuario_id=$1 ORDER BY criado_em DESC LIMIT 50', [req.user.id]);
  res.json(result.rows);
});
router.patch('/notificacoes/:id/lida', authMiddleware, async (req: any, res) => {
  await query('UPDATE notificacoes SET lida=true WHERE id=$1 AND usuario_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// GERENCIAL
router.get('/gerencial/dashboard', authMiddleware, requirePerfil('gerencial'), dashboard);
router.get('/gerencial/condominios', authMiddleware, requirePerfil('gerencial'), listarCondominios);
router.post('/gerencial/condominios', authMiddleware, requirePerfil('gerencial'), criarCondominio);
router.patch('/gerencial/condominios/:id/editar', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const { nome, endereco, cidade, estado } = req.body;
  const result = await query(
    `UPDATE condominios SET nome=$1, endereco=$2, cidade=$3, estado=$4 WHERE id=$5 RETURNING *`,
    [nome, endereco, cidade, estado, req.params.id]
  );
  res.json(result.rows[0]);
});
router.post('/gerencial/condominios/:id/sindico', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const { nome, email, senha } = req.body;
  const bcrypt = require('bcryptjs');
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Nome, email e senha obrigatorios' });
  const existe = await query('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
  if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email ja cadastrado' });
  const senha_hash = await bcrypt.hash(senha, 10);
  const result = await query(
    `INSERT INTO usuarios (nome, email, senha_hash, perfil, condominio_id) VALUES ($1,$2,$3,'sindico',$4) RETURNING id, nome, email, perfil`,
    [nome, email.toLowerCase(), senha_hash, req.params.id]
  );
  res.status(201).json(result.rows[0]);
});
router.delete('/gerencial/condominios/:id', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  await query('DELETE FROM condominios WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
router.patch('/gerencial/condominios/:id/bloquear', authMiddleware, requirePerfil('gerencial'), bloquearCondominio);
router.patch('/gerencial/condominios/:id/sem-vencimento', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const result = await query(
    `UPDATE condominios SET trial_fim = '2099-12-31', bloqueado = false WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  res.json(result.rows[0]);
});
router.patch('/gerencial/condominios/:id/trial', authMiddleware, requirePerfil('gerencial'), estenderTrial);
router.delete('/gerencial/usuarios/:id', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  await query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});
router.patch('/gerencial/usuarios/:id', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const { nome, perfil, condominio_id } = req.body;
  const result = await query(
    'UPDATE usuarios SET nome=$1, perfil=$2, condominio_id=$3 WHERE id=$4 RETURNING id, nome, email, perfil, condominio_id',
    [nome, perfil, condominio_id || null, req.params.id]
  );
  res.json(result.rows[0]);
});
router.patch('/gerencial/usuarios/:id/bloquear', authMiddleware, requirePerfil('gerencial'), bloquearUsuario);
router.post('/gerencial/usuarios', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const bcrypt = require('bcryptjs');
  const { nome, email, senha, perfil, condominio_id } = req.body;
  if (!nome || !email || !senha || !perfil) return res.status(400).json({ erro: 'Campos obrigatorios nao preenchidos' });
  const existe = await query('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
  if (existe.rows.length > 0) return res.status(400).json({ erro: 'Email ja cadastrado' });
  const nomeExiste = await query('SELECT id FROM usuarios WHERE LOWER(nome)=LOWER($1)', [nome]);
  if (nomeExiste.rows.length > 0) return res.status(400).json({ erro: 'Nome ja cadastrado' });
  const senha_hash = await bcrypt.hash(senha, 10);
  const result = await query(
    'INSERT INTO usuarios (nome, email, senha_hash, perfil, condominio_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nome, email, perfil',
    [nome, email.toLowerCase(), senha_hash, perfil, condominio_id || null]
  );
  res.status(201).json(result.rows[0]);
});
router.get('/gerencial/usuarios', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const result = await query(
    `SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.bloqueado, u.criado_em, c.nome as condominio_nome
     FROM usuarios u LEFT JOIN condominios c ON u.condominio_id=c.id
     WHERE u.perfil != 'gerencial' ORDER BY u.criado_em DESC`
  );
  res.json(result.rows);
});
router.patch('/gerencial/usuarios/:id', authMiddleware, requirePerfil('gerencial'), async (req: any, res) => {
  const { nome, perfil, condominio_id } = req.body;
  const result = await query(
    'UPDATE usuarios SET nome=$1, perfil=$2, condominio_id=$3 WHERE id=$4 RETURNING id, nome, email, perfil, condominio_id',
    [nome, perfil, condominio_id || null, req.params.id]
  );
  res.json(result.rows[0]);
});
router.patch('/gerencial/usuarios/:id/bloquear', authMiddleware, requirePerfil('gerencial'), bloquearUsuario);

export default router;
