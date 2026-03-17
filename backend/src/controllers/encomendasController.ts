import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';

// GET /api/encomendas — lista encomendas do condomínio
export const listar = async (req: AuthRequest, res: Response) => {
  try {
    const { condominio_id, perfil, id } = req.user!;

    let sql = `
      SELECT e.*, 
             m.nome as morador_nome, m.apartamento, m.bloco,
             r.nome as registrado_nome
      FROM encomendas e
      LEFT JOIN usuarios m ON e.morador_id = m.id
      JOIN usuarios r ON e.registrado_por = r.id
      WHERE e.condominio_id = $1
    `;
    const params: any[] = [condominio_id];

    // Morador só vê as próprias encomendas
    if (perfil === 'morador') {
      sql += ` AND e.morador_id = $2`;
      params.push(id);
    }

    sql += ` ORDER BY e.criado_em DESC`;

    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar encomendas' });
  }
};

// POST /api/encomendas — porteiro registra encomenda
export const registrar = async (req: AuthRequest, res: Response) => {
  try {
    const { morador_id, remetente, descricao, prateleira, foto_url } = req.body;
    const { condominio_id, id: registrado_por } = req.user!;

    if (!prateleira) {
      return res.status(400).json({ erro: 'Prateleira é obrigatória' });
    }

    const result = await query(
      `INSERT INTO encomendas (condominio_id, morador_id, registrado_por, remetente, descricao, prateleira, foto_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [condominio_id, morador_id, registrado_por, remetente, descricao, prateleira, foto_url]
    );

    // Criar notificação para o morador (se informado)
    if (morador_id) {
      await query(
        `INSERT INTO notificacoes (usuario_id, titulo, mensagem, tipo)
         VALUES ($1, $2, $3, 'encomenda')`,
        [morador_id, '📦 Nova encomenda!', `Sua encomenda chegou. Prateleira: ${prateleira}. Remetente: ${remetente || 'não informado'}`]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao registrar encomenda' });
  }
};

// PATCH /api/encomendas/:id/retirar — morador confirma retirada
export const retirar = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { id: usuario_id } = req.user!;

    const result = await query(
      `UPDATE encomendas SET status = 'retirado', retirado_em = NOW()
       WHERE id = $1 AND condominio_id = (
         SELECT condominio_id FROM usuarios WHERE id = $2
       )
       RETURNING *`,
      [id, usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: 'Encomenda não encontrada' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar encomenda' });
  }
};
