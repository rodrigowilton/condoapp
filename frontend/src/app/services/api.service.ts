// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  post<T>(path: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  patch<T>(path: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.base}${path}`, body, { headers: this.headers() });
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() });
  }

  // ── Avisos ──────────────────────────
  getAvisos() { return this.get<any[]>('/avisos'); }
  criarAviso(data: any) { return this.post('/avisos', data); }
  deletarAviso(id: string) { return this.delete(`/avisos/${id}`); }

  // ── Encomendas ──────────────────────
  getEncomendas() { return this.get<any[]>('/encomendas'); }
  registrarEncomenda(data: any) { return this.post('/encomendas', data); }
  retirarEncomenda(id: string) { return this.patch(`/encomendas/${id}/retirar`, {}); }

  // ── Reservas ────────────────────────
  getEspacos() { return this.get<any[]>('/espacos'); }
  getReservas() { return this.get<any[]>('/reservas'); }
  criarReserva(data: any) { return this.post('/reservas', data); }
  atualizarReserva(id: string, status: string) { return this.patch(`/reservas/${id}/status`, { status }); }

  // ── Visitantes ──────────────────────
  getVisitantes() { return this.get<any[]>('/visitantes'); }
  registrarVisitante(data: any) { return this.post('/visitantes', data); }

  // ── Assembleias ─────────────────────
  getAssembleias() { return this.get<any[]>('/assembleias'); }
  criarAssembleia(data: any) { return this.post('/assembleias', data); }
  votar(id: string, voto: string) { return this.post(`/assembleias/${id}/votar`, { voto }); }

  // ── Achados ─────────────────────────
  getAchados() { return this.get<any[]>('/achados'); }
  criarAchado(data: any) { return this.post('/achados', data); }

  // ── Mural ────────────────────────────
  getMural() { return this.get<any[]>('/mural'); }
  criarRecado(data: any) { return this.post('/mural', data); }

  // ── Manutenções ─────────────────────
  getManutencoes() { return this.get<any[]>('/manutencoes'); }
  criarManutencao(data: any) { return this.post('/manutencoes', data); }
  atualizarManutencao(id: string, status: string) { return this.patch(`/manutencoes/${id}/status`, { status }); }

  // ── Notificações ─────────────────────
  getNotificacoes() { return this.get<any[]>('/notificacoes'); }
  marcarLida(id: string) { return this.patch(`/notificacoes/${id}/lida`, {}); }

  // ── Gerencial ───────────────────────
  getDashboardGerencial() { return this.get<any>('/gerencial/dashboard'); }
  getCondominios() { return this.get<any[]>('/gerencial/condominios'); }
  criarCondominio(data: any) { return this.post('/gerencial/condominios', data); }
  bloquearCondominio(id: string, bloqueado: boolean) { return this.patch(`/gerencial/condominios/${id}/bloquear`, { bloqueado }); }
  estenderTrial(id: string, dias: number) { return this.patch(`/gerencial/condominios/${id}/trial`, { dias }); }
  getUsuariosGerencial() { return this.get<any[]>('/gerencial/usuarios'); }
  bloquearUsuario(id: string, bloqueado: boolean) { return this.patch(`/gerencial/usuarios/${id}/bloquear`, { bloqueado }); }
}
