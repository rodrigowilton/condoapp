import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { pool } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Arquivos de upload (fotos)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rotas ────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Inicia servidor ──────────────────────
const start = async () => {
  try {
    // Testa conexão com banco
    await pool.query('SELECT 1');
    console.log('✅ Banco de dados conectado');

    app.listen(PORT, () => {
      console.log(`🚀 CondoApp Backend rodando na porta ${PORT}`);
      console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('❌ Falha ao conectar no banco:', err);
    process.exit(1);
  }
};

start();

export default app;
