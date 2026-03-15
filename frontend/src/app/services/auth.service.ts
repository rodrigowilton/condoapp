// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, LoginResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(this.usuarioSalvo());
  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, senha })
      .pipe(tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(res.usuario));
        this.usuarioSubject.next(res.usuario);
      }));
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.usuarioSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  get usuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  get perfil(): string {
    return this.usuario?.perfil || '';
  }

  get estaLogado(): boolean {
    return !!this.getToken();
  }

  private usuarioSalvo(): Usuario | null {
    const u = localStorage.getItem('usuario');
    return u ? JSON.parse(u) : null;
  }

  me(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.apiUrl}/auth/me`)
      .pipe(tap(u => {
        localStorage.setItem('usuario', JSON.stringify(u));
        this.usuarioSubject.next(u);
      }));
  }
}
