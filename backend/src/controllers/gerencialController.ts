import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../config/database';
import bcrypt from 'bcryptjs';

// GET /api/gerencial/condominios — lista todos
export const listarCondominios = async (req: AuthRequest, res: Response) => {
  try {
    const result = await query(`
      SELECT c.*,
        COUNT(DISTINCT u.id) FILTER (WHERE u.perfil = 'morador') as total_moradores,
        COUNT(DISTINCT u.id) FILTER (WHERE u.perfil = 'sindico') as total_sindicos,
        CASE WHEN c.trial_fim < NOW() THEN true ELSE false END as trial_expirado,
        EXTRACT(DAY FROM (c.trial_fim - NOW())) as dias_restantes
      FROM condominios c
      LEFT JOIN usuarios u ON u.condominio_id = c.id
      GROUP BY c.id
      ORDER BY c.criado_em DESC
    `);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao listar condomínios' });
  }
};

// POST /api/gerencial/condominios — cria condomínio + síndico
export const criarCondominio = async (req: AuthRequest, res: Response) => {
  try {
    const { nome, endereco, cidade, estado, cep,
            sindico_nome, sindico_email, sindico_senha } = req.body;

    if (!nome || !sindico_nome || !sindico_email || !sindico_senha) {
      return res.status(400).json({ erro: 'Nome do condomínio e dados do síndico são obrigatórios' });
    }

    // Cria o condomínio
    const condo = await query(
      `INSERT INTO condominios (nome, endereco, cidade, estado, cep)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [nome, endereco, cidade, estado, cep]
    );

    // Cria o síndico vinculado
    const senha_hash = await bcrypt.hash(sindico_senha, 10);
    const sindico = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, condominio_id)
       VALUES ($1,$2,$3,'sindico',$4) RETURNING id, nome, email, perfil`,
      [sindico_nome, sindico_email.toLowerCase(), senha_hash, condo.rows[0].id]
    );

    return res.status(201).json({
      condominio: condo.rows[0],
      sindico: sindico.rows[0]
    });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ erro: 'E-mail já cadastrado' });
    return res.status(500).json({ erro: 'Erro ao criar condomínio' });
  }
};

// PATCH /api/gerencial/condominios/:id/bloquear
export const bloquearCondominio = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { bloqueado } = req.body;
    const result = await query(
      'UPDATE condominios SET bloqueado = $1 WHERE id = $2 RETURNING *',
      [bloqueado, id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar condomínio' });
  }
};

// PATCH /api/gerencial/usuarios/:id/bloquear
export const bloquearUsuario = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { bloqueado } = req.body;
    const result = await query(
      'UPDATE usuarios SET bloqueado = $1 WHERE id = $2 RETURNING id, nome, email, bloqueado',
      [bloqueado, id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao atualizar usuário' });
  }
};

// PATCH /api/gerencial/condominios/:id/trial
export const estenderTrial = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { dias } = req.body;
    const result = await query(
      `UPDATE condominios SET trial_fim = NOW() + ($1 || ' days')::interval, bloqueado = false
       WHERE id = $2 RETURNING *`,
      [dias || 30, id]
    );
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao estender trial' });
  }
};

// GET /api/gerencial/dashboard
export const dashboard = async (req: AuthRequest, res: Response) => {
  try {
    const [condos, usuarios, trials] = await Promise.all([
      query('SELECT COUNT(*) as total FROM condominios'),
      query("SELECT COUNT(*) as total FROM usuarios WHERE perfil != 'gerencial'"),
      query("SELECT COUNT(*) as total FROM condominios WHERE trial_fim > NOW() AND NOT bloqueado"),
    ]);

    return res.json({
      total_condominios: condos.rows[0].total,
      total_usuarios: usuarios.rows[0].total,
      trials_ativos: trials.rows[0].total,
    });
  } catch (err) {
    return res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
};
