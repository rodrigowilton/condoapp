"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePerfil = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
};
exports.authMiddleware = authMiddleware;
// Verifica se o perfil tem permissão
const requirePerfil = (...perfis) => {
    return (req, res, next) => {
        if (!req.user || !perfis.includes(req.user.perfil)) {
            return res.status(403).json({ erro: 'Acesso não autorizado para este perfil' });
        }
        next();
    };
};
exports.requirePerfil = requirePerfil;
