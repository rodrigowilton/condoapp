"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const authController_1 = require("../controllers/authController");
const avisosController_1 = require("../controllers/avisosController");
const encomendasController_1 = require("../controllers/encomendasController");
const gerencialController_1 = require("../controllers/gerencialController");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// AUTH
router.post('/auth/login', authController_1.login);
router.get('/auth/me', auth_1.authMiddleware, authController_1.me);
router.post('/auth/moradores', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), authController_1.registrarMorador);
// MORADORES
router.get('/moradores', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT id, nome, email, perfil, apartamento, bloco, telefone, ativo, bloqueado, criado_em
     FROM usuarios WHERE condominio_id = $1 AND perfil = 'morador' ORDER BY nome`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.patch('/moradores/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { nome, apartamento, bloco, telefone, ativo } = req.body;
    const result = await (0, database_1.query)(`UPDATE usuarios SET nome=$1, apartamento=$2, bloco=$3, telefone=$4, ativo=$5 WHERE id=$6 AND condominio_id=$7 RETURNING id, nome, email, apartamento, bloco, telefone, ativo`, [nome, apartamento, bloco, telefone, ativo, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/moradores/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM usuarios WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// AVISOS
router.get('/avisos', auth_1.authMiddleware, avisosController_1.listar);
router.post('/avisos', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), avisosController_1.criar);
router.patch('/avisos/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { titulo, conteudo, urgente, fixado } = req.body;
    const result = await (0, database_1.query)(`UPDATE avisos SET titulo=$1, conteudo=$2, urgente=$3, fixado=$4 WHERE id=$5 AND condominio_id=$6 RETURNING *`, [titulo, conteudo, urgente, fixado, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/avisos/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), avisosController_1.deletar);
// ENCOMENDAS
router.get('/encomendas', auth_1.authMiddleware, encomendasController_1.listar);
router.post('/encomendas', auth_1.authMiddleware, (0, auth_1.requirePerfil)('porteiro', 'sindico', 'gerencial'), encomendasController_1.registrar);
router.patch('/encomendas/:id/retirar', auth_1.authMiddleware, encomendasController_1.retirar);
router.delete('/encomendas/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM encomendas WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// ESPACOS
router.get('/espacos', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)('SELECT * FROM espacos WHERE condominio_id=$1 AND ativo=true ORDER BY nome', [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/espacos', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { nome, descricao, capacidade } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO espacos (condominio_id, nome, descricao, capacidade) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user.condominio_id, nome, descricao, capacidade]);
    res.status(201).json(result.rows[0]);
});
router.patch('/espacos/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { nome, descricao, capacidade } = req.body;
    const result = await (0, database_1.query)(`UPDATE espacos SET nome=$1, descricao=$2, capacidade=$3 WHERE id=$4 AND condominio_id=$5 RETURNING *`, [nome, descricao, capacidade, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/espacos/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    await (0, database_1.query)('UPDATE espacos SET ativo=false WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// RESERVAS
router.get('/reservas', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT r.*, e.nome as espaco_nome, u.nome as usuario_nome, u.apartamento
     FROM reservas r JOIN espacos e ON r.espaco_id = e.id JOIN usuarios u ON r.usuario_id = u.id
     WHERE r.condominio_id=$1 ORDER BY r.data_inicio DESC`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/reservas', auth_1.authMiddleware, async (req, res) => {
    const { espaco_id, data_inicio, data_fim, observacao } = req.body;
    const conflito = await (0, database_1.query)(`SELECT id FROM reservas WHERE espaco_id=$1 AND status='aprovada' AND NOT (data_fim<=$2 OR data_inicio>=$3)`, [espaco_id, data_inicio, data_fim]);
    if (conflito.rows.length > 0)
        return res.status(400).json({ erro: 'Horario indisponivel para este espaco' });
    const result = await (0, database_1.query)(`INSERT INTO reservas (espaco_id, usuario_id, condominio_id, data_inicio, data_fim, observacao) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [espaco_id, req.user.id, req.user.condominio_id, data_inicio, data_fim, observacao]);
    res.status(201).json(result.rows[0]);
});
router.patch('/reservas/:id/status', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { status } = req.body;
    const result = await (0, database_1.query)('UPDATE reservas SET status=$1 WHERE id=$2 AND condominio_id=$3 RETURNING *', [status, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/reservas/:id', auth_1.authMiddleware, async (req, res) => {
    await (0, database_1.query)('DELETE FROM reservas WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// VISITANTES
router.get('/visitantes', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT v.*, m.nome as morador_nome, m.apartamento FROM visitantes v
     LEFT JOIN usuarios m ON v.morador_id = m.id
     WHERE v.condominio_id=$1 ORDER BY v.criado_em DESC LIMIT 100`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/visitantes', auth_1.authMiddleware, async (req, res) => {
    const { morador_id, nome, documento, placa, motivo } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO visitantes (condominio_id, morador_id, registrado_por, nome, documento, placa, motivo, status, entrada_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'autorizado',NOW()) RETURNING *`, [req.user.condominio_id, morador_id, req.user.id, nome, documento, placa, motivo]);
    res.status(201).json(result.rows[0]);
});
router.patch('/visitantes/:id/status', auth_1.authMiddleware, async (req, res) => {
    const { status } = req.body;
    const result = await (0, database_1.query)(`UPDATE visitantes SET status=$1 WHERE id=$2 AND condominio_id=$3 RETURNING *`, [status, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/visitantes/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM visitantes WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// ASSEMBLEIAS
router.get('/assembleias', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT a.*, u.nome as criado_por_nome,
            COUNT(v.id) as total_votos,
            COUNT(v.id) FILTER (WHERE v.voto='sim') as votos_sim,
            COUNT(v.id) FILTER (WHERE v.voto='nao') as votos_nao,
            COUNT(v.id) FILTER (WHERE v.voto='abstencao') as votos_abstencao
     FROM assembleias a JOIN usuarios u ON a.criado_por=u.id
     LEFT JOIN votos v ON v.assembleia_id=a.id
     WHERE a.condominio_id=$1 GROUP BY a.id, u.nome ORDER BY a.criado_em DESC`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/assembleias', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { titulo, descricao, data_limite } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO assembleias (condominio_id, criado_por, titulo, descricao, data_limite) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.condominio_id, req.user.id, titulo, descricao, data_limite]);
    res.status(201).json(result.rows[0]);
});
router.patch('/assembleias/:id/encerrar', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const result = await (0, database_1.query)(`UPDATE assembleias SET status='encerrada' WHERE id=$1 AND condominio_id=$2 RETURNING *`, [req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/assembleias/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM assembleias WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
router.post('/assembleias/:id/votar', auth_1.authMiddleware, async (req, res) => {
    const { voto } = req.body;
    try {
        const result = await (0, database_1.query)(`INSERT INTO votos (assembleia_id, usuario_id, voto) VALUES ($1,$2,$3)
       ON CONFLICT (assembleia_id, usuario_id) DO UPDATE SET voto=$3 RETURNING *`, [req.params.id, req.user.id, voto]);
        res.json(result.rows[0]);
    }
    catch {
        res.status(400).json({ erro: 'Erro ao registrar voto' });
    }
});
// ACHADOS
router.get('/achados', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT ap.*, u.nome as registrado_nome FROM achados_perdidos ap
     JOIN usuarios u ON ap.registrado_por=u.id
     WHERE ap.condominio_id=$1 ORDER BY ap.criado_em DESC`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/achados', auth_1.authMiddleware, async (req, res) => {
    const { descricao, local_encontrado } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO achados_perdidos (condominio_id, registrado_por, descricao, local_encontrado) VALUES ($1,$2,$3,$4) RETURNING *`, [req.user.condominio_id, req.user.id, descricao, local_encontrado]);
    res.status(201).json(result.rows[0]);
});
router.patch('/achados/:id/retirar', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`UPDATE achados_perdidos SET status='retirado', retirado_por=$1 WHERE id=$2 AND condominio_id=$3 RETURNING *`, [req.user.id, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/achados/:id', auth_1.authMiddleware, async (req, res) => {
    await (0, database_1.query)('DELETE FROM achados_perdidos WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// MURAL
router.get('/mural', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT m.*, u.nome as autor_nome, u.apartamento FROM mural m
     JOIN usuarios u ON m.autor_id=u.id
     WHERE m.condominio_id=$1 AND m.ativo=true ORDER BY m.criado_em DESC`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/mural', auth_1.authMiddleware, async (req, res) => {
    const { titulo, conteudo, categoria } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO mural (condominio_id, autor_id, titulo, conteudo, categoria) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.condominio_id, req.user.id, titulo, conteudo, categoria || 'geral']);
    res.status(201).json(result.rows[0]);
});
router.patch('/mural/:id', auth_1.authMiddleware, async (req, res) => {
    const { titulo, conteudo, categoria } = req.body;
    const result = await (0, database_1.query)(`UPDATE mural SET titulo=$1, conteudo=$2, categoria=$3 WHERE id=$4 AND condominio_id=$5 RETURNING *`, [titulo, conteudo, categoria, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/mural/:id', auth_1.authMiddleware, async (req, res) => {
    await (0, database_1.query)(`UPDATE mural SET ativo=false WHERE id=$1 AND condominio_id=$2`, [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// MANUTENCOES
router.get('/manutencoes', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)(`SELECT m.*, u.nome as solicitante_nome, u.apartamento FROM manutencoes m
     JOIN usuarios u ON m.solicitante_id=u.id
     WHERE m.condominio_id=$1 ORDER BY m.criado_em DESC`, [req.user.condominio_id]);
    res.json(result.rows);
});
router.post('/manutencoes', auth_1.authMiddleware, async (req, res) => {
    const { titulo, descricao, local } = req.body;
    const result = await (0, database_1.query)(`INSERT INTO manutencoes (condominio_id, solicitante_id, titulo, descricao, local) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [req.user.condominio_id, req.user.id, titulo, descricao, local]);
    res.status(201).json(result.rows[0]);
});
router.patch('/manutencoes/:id/status', auth_1.authMiddleware, (0, auth_1.requirePerfil)('sindico', 'gerencial'), async (req, res) => {
    const { status } = req.body;
    const result = await (0, database_1.query)(`UPDATE manutencoes SET status=$1::varchar, resolvido_em=CASE WHEN $1::varchar='concluido' THEN NOW() ELSE NULL END WHERE id=$2 AND condominio_id=$3 RETURNING *`, [status, req.params.id, req.user.condominio_id]);
    res.json(result.rows[0]);
});
router.delete('/manutencoes/:id', auth_1.authMiddleware, async (req, res) => {
    await (0, database_1.query)('DELETE FROM manutencoes WHERE id=$1 AND condominio_id=$2', [req.params.id, req.user.condominio_id]);
    res.json({ ok: true });
});
// NOTIFICACOES
router.get('/notificacoes', auth_1.authMiddleware, async (req, res) => {
    const result = await (0, database_1.query)('SELECT * FROM notificacoes WHERE usuario_id=$1 ORDER BY criado_em DESC LIMIT 50', [req.user.id]);
    res.json(result.rows);
});
router.patch('/notificacoes/:id/lida', auth_1.authMiddleware, async (req, res) => {
    await (0, database_1.query)('UPDATE notificacoes SET lida=true WHERE id=$1 AND usuario_id=$2', [req.params.id, req.user.id]);
    res.json({ ok: true });
});
// GERENCIAL
router.get('/gerencial/dashboard', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.dashboard);
router.get('/gerencial/condominios', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.listarCondominios);
router.post('/gerencial/condominios', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.criarCondominio);
router.patch('/gerencial/condominios/:id/editar', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const { nome, endereco, cidade, estado } = req.body;
    const result = await (0, database_1.query)(`UPDATE condominios SET nome=$1, endereco=$2, cidade=$3, estado=$4 WHERE id=$5 RETURNING *`, [nome, endereco, cidade, estado, req.params.id]);
    res.json(result.rows[0]);
});
router.post('/gerencial/condominios/:id/sindico', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const { nome, email, senha } = req.body;
    const bcrypt = require('bcryptjs');
    if (!nome || !email || !senha)
        return res.status(400).json({ erro: 'Nome, email e senha obrigatorios' });
    const existe = await (0, database_1.query)('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length > 0)
        return res.status(400).json({ erro: 'Email ja cadastrado' });
    const senha_hash = await bcrypt.hash(senha, 10);
    const result = await (0, database_1.query)(`INSERT INTO usuarios (nome, email, senha_hash, perfil, condominio_id) VALUES ($1,$2,$3,'sindico',$4) RETURNING id, nome, email, perfil`, [nome, email.toLowerCase(), senha_hash, req.params.id]);
    res.status(201).json(result.rows[0]);
});
router.delete('/gerencial/condominios/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM condominios WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
});
router.patch('/gerencial/condominios/:id/bloquear', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.bloquearCondominio);
router.patch('/gerencial/condominios/:id/sem-vencimento', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const result = await (0, database_1.query)(`UPDATE condominios SET trial_fim = '2099-12-31', bloqueado = false WHERE id = $1 RETURNING *`, [req.params.id]);
    res.json(result.rows[0]);
});
router.patch('/gerencial/condominios/:id/trial', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.estenderTrial);
router.delete('/gerencial/usuarios/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    await (0, database_1.query)('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
});
router.patch('/gerencial/usuarios/:id', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const { nome, perfil, condominio_id } = req.body;
    const result = await (0, database_1.query)('UPDATE usuarios SET nome=$1, perfil=$2, condominio_id=$3 WHERE id=$4 RETURNING id, nome, email, perfil, condominio_id', [nome, perfil, condominio_id || null, req.params.id]);
    res.json(result.rows[0]);
});
router.patch('/gerencial/usuarios/:id/bloquear', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), gerencialController_1.bloquearUsuario);
router.post('/gerencial/usuarios', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const bcrypt = require('bcryptjs');
    const { nome, email, senha, perfil, condominio_id } = req.body;
    if (!nome || !email || !senha || !perfil)
        return res.status(400).json({ erro: 'Campos obrigatorios nao preenchidos' });
    const existe = await (0, database_1.query)('SELECT id FROM usuarios WHERE email=$1', [email.toLowerCase()]);
    if (existe.rows.length > 0)
        return res.status(400).json({ erro: 'Email ja cadastrado' });
    const nomeExiste = await (0, database_1.query)('SELECT id FROM usuarios WHERE LOWER(nome)=LOWER($1)', [nome]);
    if (nomeExiste.rows.length > 0)
        return res.status(400).json({ erro: 'Nome ja cadastrado' });
    const senha_hash = await bcrypt.hash(senha, 10);
    const result = await (0, database_1.query)('INSERT INTO usuarios (nome, email, senha_hash, perfil, condominio_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, nome, email, perfil', [nome, email.toLowerCase(), senha_hash, perfil, condominio_id || null]);
    res.status(201).json(result.rows[0]);
});
router.get('/gerencial/usuarios', auth_1.authMiddleware, (0, auth_1.requirePerfil)('gerencial'), async (req, res) => {
    const result = await (0, database_1.query)(`SELECT u.id, u.nome, u.email, u.perfil, u.ativo, u.bloqueado, u.criado_em, c.nome as condominio_nome
     FROM usuarios u LEFT JOIN condominios c ON u.condominio_id=c.id
     WHERE u.perfil != 'gerencial' ORDER BY u.criado_em DESC`);
    res.json(result.rows);
});
exports.default = router;
