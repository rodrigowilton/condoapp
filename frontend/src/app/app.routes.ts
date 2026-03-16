// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, perfilGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },

  // ── Morador ─────────────────────────────────
  {
    path: 'morador',
    canActivate: [authGuard, perfilGuard('morador')],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',      loadComponent: () => import('./pages/home-morador/home-morador.page').then(m => m.HomeMoradorPage) },
      { path: 'avisos',    loadComponent: () => import('./pages/avisos/avisos.page').then(m => m.AvisosPage) },
      { path: 'reservas',  loadComponent: () => import('./pages/reservas/reservas.page').then(m => m.ReservasPage) },
      { path: 'encomendas',loadComponent: () => import('./pages/encomendas/encomendas.page').then(m => m.EncomendasPage) },
      { path: 'visitantes',loadComponent: () => import('./pages/visitantes/visitantes.page').then(m => m.VisitantesPage) },
      { path: 'votacao',   loadComponent: () => import('./pages/votacao/votacao.page').then(m => m.VotacaoPage) },
      { path: 'achados',   loadComponent: () => import('./pages/achados/achados.page').then(m => m.AchadosPage) },
      { path: 'mural',     loadComponent: () => import('./pages/mural/mural.page').then(m => m.MuralPage) },
      { path: 'manutencao',loadComponent: () => import('./pages/manutencao/manutencao.page').then(m => m.ManutencaoPage) },
    ]
  },

  // ── Síndico ─────────────────────────────────
  {
    path: 'sindico',
    canActivate: [authGuard, perfilGuard('sindico')],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home',      loadComponent: () => import('./pages/home-sindico/home-sindico.page').then(m => m.HomeSindicoPage) },
      { path: 'avisos',    loadComponent: () => import('./pages/avisos/avisos.page').then(m => m.AvisosPage) },
      { path: 'reservas',  loadComponent: () => import('./pages/reservas/reservas.page').then(m => m.ReservasPage) },
      { path: 'encomendas',loadComponent: () => import('./pages/encomendas/encomendas.page').then(m => m.EncomendasPage) },
      { path: 'visitantes',loadComponent: () => import('./pages/visitantes/visitantes.page').then(m => m.VisitantesPage) },
      { path: 'votacao',   loadComponent: () => import('./pages/votacao/votacao.page').then(m => m.VotacaoPage) },
      { path: 'achados',   loadComponent: () => import('./pages/achados/achados.page').then(m => m.AchadosPage) },
      { path: 'mural',     loadComponent: () => import('./pages/mural/mural.page').then(m => m.MuralPage) },
      { path: 'manutencao',loadComponent: () => import('./pages/manutencao/manutencao.page').then(m => m.ManutencaoPage) },
      { path: 'moradores', loadComponent: () => import('./pages/moradores/moradores.page').then(m => m.MoradoresPage) },
      { path: 'espacos', loadComponent: () => import('./pages/espacos/espacos.page').then(m => m.EspacosPage) },
      { path: 'historico', loadComponent: () => import('./pages/historico/historico.page').then(m => m.HistoricoPage) },
    ]
  },

  // ── Gerencial (seu painel privado) ───────────
  {
    path: 'gerencial',
    canActivate: [authGuard, perfilGuard('gerencial')],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./pages/gerencial/dashboard/dashboard.page').then(m => m.DashboardPage) },
      { path: 'condominios',  loadComponent: () => import('./pages/gerencial/condominios/condominios.page').then(m => m.CondominiosPage) },
      { path: 'usuarios',     loadComponent: () => import('./pages/gerencial/usuarios/usuarios.page').then(m => m.UsuariosPage) },
    ]
  },

  // Redireciona /home para o perfil correto
  { path: 'home', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
