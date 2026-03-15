// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.estaLogado) {
    router.navigate(['/login']);
    return false;
  }
  return true;
};

export const perfilGuard = (...perfis: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.estaLogado) { router.navigate(['/login']); return false; }
    if (!perfis.includes(auth.perfil)) { router.navigate(['/home']); return false; }
    return true;
  };
};
