import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;
  constructor(private http: HttpClient, private auth: AuthService) {}
  private headers(): HttpHeaders { return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` }); }
  get<T>(path: string): Observable<T> { return this.http.get<T>(`${this.base}${path}`, { headers: this.headers() }); }
  post<T>(path: string, body: any): Observable<T> { return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers() }); }
  patch<T>(path: string, body: any): Observable<T> { return this.http.patch<T>(`${this.base}${path}`, body, { headers: this.headers() }); }
  delete<T>(path: string): Observable<T> { return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers() }); }

  getAvisos() { return this.get<any[]>('/avisos'); }
  criarAviso(data: any) { return this.post<any>('/avisos', data); }
  editarAviso(id: string, data: any) { return this.patch<any>(`/avisos/${id}`, data); }
  deletarAviso(id: string) { return this.delete<any>(`/avisos/${id}`); }

  getEncomendas() { return this.get<any[]>('/encomendas'); }
  registrarEncomenda(data: any) { return this.post<any>('/encomendas', data); }
  retirarEncomenda(id: string) { return this.patch<any>(`/encomendas/${id}/retirar`, {}); }
  deletarEncomenda(id: string) { return this.delete<any>(`/encomendas/${id}`); }

  getEspacos() { return this.get<any[]>('/espacos'); }
  criarEspaco(data: any) { return this.post<any>('/espacos', data); }
  deletarEspaco(id: string) { return this.delete<any>(`/espacos/${id}`); }

  getReservas() { return this.get<any[]>('/reservas'); }
  criarReserva(data: any) { return this.post<any>('/reservas', data); }
  atualizarReserva(id: string, status: string) { return this.patch<any>(`/reservas/${id}/status`, { status }); }
  deletarReserva(id: string) { return this.delete<any>(`/reservas/${id}`); }

  getVisitantes() { return this.get<any[]>('/visitantes'); }
  registrarVisitante(data: any) { return this.post<any>('/visitantes', data); }
  autorizarVisitante(id: string, dados: any) { return this.patch<any>(`/visitantes/${id}/autorizar`, dados); }
  atualizarStatusVisitante(id: string, status: string) { return this.patch<any>(`/visitantes/${id}/status`, { status }); }
  deletarVisitante(id: string) { return this.delete<any>(`/visitantes/${id}`); }

  getAssembleias() { return this.get<any[]>('/assembleias'); }
  criarAssembleia(data: any) { return this.post<any>('/assembleias', data); }
  encerrarAssembleia(id: string) { return this.patch<any>(`/assembleias/${id}/encerrar`, {}); }
  deletarAssembleia(id: string) { return this.delete<any>(`/assembleias/${id}`); }
  votar(id: string, voto: string) { return this.post<any>(`/assembleias/${id}/votar`, { voto }); }

  getAchados() { return this.get<any[]>('/achados'); }
  criarAchado(data: any) { return this.post<any>('/achados', data); }
  retirarAchado(id: string, dados?: any) { return this.patch<any>(`/achados/${id}/retirar`, dados || {}); }
  deletarAchado(id: string) { return this.delete<any>(`/achados/${id}`); }

  getMural() { return this.get<any[]>('/mural'); }
  criarRecado(data: any) { return this.post<any>('/mural', data); }
  editarRecado(id: string, data: any) { return this.patch<any>(`/mural/${id}`, data); }
  deletarRecado(id: string) { return this.delete<any>(`/mural/${id}`); }

  getManutencoes() { return this.get<any[]>('/manutencoes'); }
  criarManutencao(data: any) { return this.post<any>('/manutencoes', data); }
  editarManutencao(id: string, data: any) { return this.patch<any>(`/manutencoes/${id}`, data); }
  atualizarManutencao(id: string, status: string) { return this.patch<any>(`/manutencoes/${id}/status`, { status }); }
  deletarManutencao(id: string) { return this.delete<any>(`/manutencoes/${id}`); }

  getMoradores() { return this.get<any[]>('/moradores'); }
  editarMorador(id: string, data: any) { return this.patch<any>(`/moradores/${id}`, data); }
  deletarMorador(id: string) { return this.delete<any>(`/moradores/${id}`); }

  getNotificacoes() { return this.get<any[]>('/notificacoes'); }
  marcarLida(id: string) { return this.patch<any>(`/notificacoes/${id}/lida`, {}); }

  getDashboardGerencial() { return this.get<any>('/gerencial/dashboard'); }
  getCondominios() { return this.get<any[]>('/gerencial/condominios'); }
  criarCondominio(data: any) { return this.post<any>('/gerencial/condominios', data); }
  bloquearCondominio(id: string, bloqueado: boolean) { return this.patch<any>(`/gerencial/condominios/${id}/bloquear`, { bloqueado }); }
  estenderTrial(id: string, dias: number) { return this.patch<any>(`/gerencial/condominios/${id}/trial`, { dias }); }
  semVencimento(id: string) { return this.patch<any>(`/gerencial/condominios/${id}/sem-vencimento`, {}); }
  editarCondominio(id: string, data: any) { return this.patch<any>(`/gerencial/condominios/${id}/editar`, data); }
  criarSindicoCondominio(id: string, data: any) { return this.post<any>(`/gerencial/condominios/${id}/sindico`, data); }
  getUsuariosGerencial() { return this.get<any[]>('/gerencial/usuarios'); }
  deletarUsuarioGerencial(id: string) { return this.delete<any>(`/gerencial/usuarios/${id}`); }
  bloquearUsuario(id: string, bloqueado: boolean) { return this.patch<any>(`/gerencial/usuarios/${id}/bloquear`, { bloqueado }); }
  deletarCondominio(id: string) { return this.delete<any>(`/gerencial/condominios/${id}`); }
}
