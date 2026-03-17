import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios' });
    }

    // Busca usuário
    const result = await query(
      `SELECT u.*, c.bloqueado as condo_bloqueado, c.trial_fim
       FROM usuarios u
       LEFT JOIN condominios c ON u.condominio_id = c.id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    );

    const usuario = result.rows[0];

    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    if (!usuario.ativo || usuario.bloqueado) {
      return res.status(403).json({ erro: 'Usuário bloqueado ou inativo. Entre em contato com o administrador.' });
    }

    // Verifica trial expirado (para não-gerencial)
    if (usuario.perfil !== 'gerencial' && usuario.trial_fim) {
      const trialExpirado = new Date() > new Date(usuario.trial_fim);
      if (trialExpirado && usuario.condo_bloqueado) {
        return res.status(403).json({ erro: 'Período de trial encerrado. Entre em contato com o administrador.' });
      }
    }

    // Verifica senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
    }

    // Atualiza último acesso
    await query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = $1', [usuario.id]);

    // Gera token
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        perfil: usuario.perfil,
        condominio_id: usuario.condominio_id,
      },
      process.env.JWT_SECRET || '',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        apartamento: usuario.apartamento,
        bloco: usuario.bloco,
        condominio_id: usuario.condominio_id,
      }
    });

  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// POST /api/auth/register (síndico cria moradores)
export const registrarMorador = async (req: any, res: Response) => {
  try {
    const { nome, email, senha, apartamento, bloco, telefone } = req.body;
    const condominio_id = req.body.condominio_id || req.user?.condominio_id;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' });
    }

    // Verifica se email já existe
    const existe = await query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existe.rows.length > 0) {
      return res.status(400).json({ erro: 'E-mail já cadastrado' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    const result = await query(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, apartamento, bloco, telefone, condominio_id)
       VALUES ($1, $2, $3, 'morador', $4, $5, $6, $7)
       RETURNING id, nome, email, perfil, apartamento, bloco`,
      [nome, email.toLowerCase(), senha_hash, apartamento, bloco, telefone, condominio_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao registrar morador:', err);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// GET /api/auth/me
export const me = async (req: any, res: Response) => {
  try {
    const result = await query(
      `SELECT u.id, u.nome, u.email, u.perfil, u.apartamento, u.bloco, u.telefone,
              u.condominio_id, c.nome as condominio_nome, c.trial_fim, c.bloqueado as condo_bloqueado
       FROM usuarios u
       LEFT JOIN condominios c ON u.condominio_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
