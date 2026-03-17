"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletar = exports.criar = exports.listar = void 0;
const database_1 = require("../config/database");
// GET /api/avisos
const listar = async (req, res) => {
    try {
        const { condominio_id } = req.user;
        const result = await (0, database_1.query)(`SELECT a.*, u.nome as autor_nome
       FROM avisos a JOIN usuarios u ON a.autor_id = u.id
       WHERE a.condominio_id = $1
       ORDER BY a.fixado DESC, a.criado_em DESC`, [condominio_id]);
        return res.json(result.rows);
    }
    catch (err) {
        return res.status(500).json({ erro: 'Erro ao listar avisos' });
    }
};
exports.listar = listar;
// POST /api/avisos
const criar = async (req, res) => {
    try {
        const { titulo, conteudo, urgente, fixado } = req.body;
        const { condominio_id, id: autor_id } = req.user;
        if (!titulo || !conteudo) {
            return res.status(400).json({ erro: 'Título e conteúdo são obrigatórios' });
        }
        const result = await (0, database_1.query)(`INSERT INTO avisos (condominio_id, autor_id, titulo, conteudo, urgente, fixado)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [condominio_id, autor_id, titulo, conteudo, urgente || false, fixado || false]);
        // Notificar todos os moradores do condomínio
        await (0, database_1.query)(`INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
       SELECT id, $1, $2, 'aviso' FROM usuarios
       WHERE condominio_id = $3 AND perfil = 'morador' AND ativo = true`, [`📢 ${titulo}`, conteudo.substring(0, 100), condominio_id]);
        return res.status(201).json(result.rows[0]);
    }
    catch (err) {
        return res.status(500).json({ erro: 'Erro ao criar aviso' });
    }
};
exports.criar = criar;
// DELETE /api/avisos/:id
const deletar = async (req, res) => {
    try {
        const { id } = req.params;
        const { condominio_id } = req.user;
        await (0, database_1.query)('DELETE FROM avisos WHERE id = $1 AND condominio_id = $2', [id, condominio_id]);
        return res.json({ mensagem: 'Aviso removido' });
    }
    catch (err) {
        return res.status(500).json({ erro: 'Erro ao remover aviso' });
    }
};
exports.deletar = deletar;
