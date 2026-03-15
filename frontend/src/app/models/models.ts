// src/app/models/usuario.model.ts
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'morador' | 'sindico' | 'porteiro' | 'gerencial';
  apartamento?: string;
  bloco?: string;
  telefone?: string;
  condominio_id?: string;
  condominio_nome?: string;
  trial_fim?: string;
  ativo: boolean;
  bloqueado: boolean;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface Aviso {
  id: string;
  titulo: string;
  conteudo: string;
  urgente: boolean;
  fixado: boolean;
  autor_nome: string;
  criado_em: string;
}

export interface Encomenda {
  id: string;
  morador_nome: string;
  apartamento: string;
  bloco?: string;
  remetente?: string;
  descricao?: string;
  prateleira: string;
  foto_url?: string;
  status: 'aguardando' | 'retirado';
  criado_em: string;
  retirado_em?: string;
}

export interface Reserva {
  id: string;
  espaco_id: string;
  espaco_nome: string;
  usuario_nome: string;
  apartamento: string;
  data_inicio: string;
  data_fim: string;
  status: 'pendente' | 'aprovada' | 'recusada' | 'cancelada';
  observacao?: string;
}

export interface Espaco {
  id: string;
  nome: string;
  descricao?: string;
  capacidade?: number;
}

export interface Visitante {
  id: string;
  nome: string;
  documento?: string;
  placa?: string;
  motivo?: string;
  foto_url?: string;
  morador_nome: string;
  apartamento: string;
  status: 'aguardando' | 'autorizado' | 'recusado' | 'saiu';
  entrada_em?: string;
  saida_em?: string;
  criado_em: string;
}

export interface Assembleia {
  id: string;
  titulo: string;
  descricao?: string;
  data_limite: string;
  status: 'aberta' | 'encerrada';
  criado_por_nome: string;
  total_votos: number;
  votos_sim: number;
  votos_nao: number;
  criado_em: string;
}

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem?: string;
  tipo: string;
  lida: boolean;
  criado_em: string;
}

export interface Condominio {
  id: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativo: boolean;
  bloqueado: boolean;
  trial_inicio: string;
  trial_fim: string;
  trial_expirado: boolean;
  dias_restantes: number;
  total_moradores: number;
  total_sindicos: number;
}
