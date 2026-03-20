import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home-porteiro',
  templateUrl: './home-porteiro.page.html',
  styleUrls: ['./home-porteiro.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HomePorteiroPage implements OnInit, OnDestroy {
  nomeUsuario = '';
  nomeCondominio = '';

  // Contadores
  visitantesNoLocal = 0;
  visitantesHoje = 0;
  encomendasAguardando = 0;

  // Listas
  visitantesAtivos: any[] = [];
  encomendasPendentes: any[] = [];
  avisos: any[] = [];

  // Moradores
  moradores: any[] = [];
  moradoresFiltrados: any[] = [];
  buscaMorador = '';
  modalMoradores = false;

  carregando = true;
  horaAtual = '';
  turno = '';

  // Modal visitante
  modalVisitante = false;
  novoVisitante: any = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };
  salvandoVisitante = false;

  // Modal encomenda
  modalEncomenda = false;
  novaEncomenda: any = { apartamento: '', prateleira: '', remetente: '', descricao: '' };
  salvandoEncomenda = false;

  private timer: any;

  constructor(private auth: AuthService, private api: ApiService, private router: Router) {}

  ngOnInit() {
    const u = this.auth.usuario;
    this.nomeUsuario = u?.nome || 'Porteiro';
    this.nomeCondominio = (u as any)?.condominio_nome || '';
    this.atualizarHora();
    this.timer = setInterval(() => this.atualizarHora(), 60000);
    this.carregar();
  }

  ngOnDestroy() { clearInterval(this.timer); }

  ionViewWillEnter() { this.carregar(); }

  atualizarHora() {
    const now = new Date();
    const h = now.getHours();
    this.horaAtual = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    if (h >= 6 && h < 14) this.turno = 'Turno Manha';
    else if (h >= 14 && h < 22) this.turno = 'Turno Tarde';
    else this.turno = 'Turno Noite';
  }

  carregar() {
    this.carregando = true;
    const hoje = new Date().toDateString();

    this.api.getVisitantes().subscribe({
      next: (d: any[]) => {
        this.visitantesAtivos = d.filter(v => v.status === 'autorizado').slice(0, 4);
        this.visitantesNoLocal = d.filter(v => v.status === 'autorizado').length;
        this.visitantesHoje = d.filter(v => new Date(v.entrada_em).toDateString() === hoje).length;
      }
    });

    this.api.getEncomendas().subscribe({
      next: (d: any[]) => {
        this.encomendasPendentes = d.filter(e => e.status === 'aguardando').slice(0, 4);
        this.encomendasAguardando = d.filter(e => e.status === 'aguardando').length;
      }
    });

    this.api.getAvisos().subscribe({
      next: (d: any[]) => {
        this.avisos = d.slice(0, 3);
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });

    this.api.getMoradores().subscribe({
      next: (d: any[]) => {
        this.moradores = d;
        this.moradoresFiltrados = d;
      }
    });
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }

  // ── Busca moradores ──
  abrirMoradores() {
    this.buscaMorador = '';
    this.moradoresFiltrados = this.moradores;
    this.modalMoradores = true;
  }

  buscarMorador() {
    const termo = this.buscaMorador.toLowerCase().trim();
    if (!termo) {
      this.moradoresFiltrados = this.moradores;
      return;
    }
    this.moradoresFiltrados = this.moradores.filter(m =>
      m.nome?.toLowerCase().includes(termo) ||
      m.apartamento?.toLowerCase().includes(termo) ||
      m.bloco?.toLowerCase().includes(termo)
    );
  }

  // ── Visitante ──
  salvarVisitante() {
    if (!this.novoVisitante.nome || !this.novoVisitante.apartamento) return;
    this.salvandoVisitante = true;
    this.api.registrarVisitante(this.novoVisitante).subscribe({
      next: () => { this.salvandoVisitante = false; this.modalVisitante = false; this.carregar(); },
      error: () => { this.salvandoVisitante = false; }
    });
  }

  registrarSaida(id: string) {
    this.api.atualizarStatusVisitante(id, 'saiu').subscribe({ next: () => this.carregar() });
  }

  // ── Encomenda ──
  salvarEncomenda() {
    if (!this.novaEncomenda.apartamento || !this.novaEncomenda.prateleira) return;
    this.salvandoEncomenda = true;
    this.api.registrarEncomenda(this.novaEncomenda).subscribe({
      next: () => { this.salvandoEncomenda = false; this.modalEncomenda = false; this.carregar(); },
      error: () => { this.salvandoEncomenda = false; }
    });
  }

  confirmarRetirada(id: string) {
    this.api.retirarEncomenda(id).subscribe({ next: () => this.carregar() });
  }

  ir(pagina: string) { this.router.navigate(['/porteiro/' + pagina]); }
  logout() { this.auth.logout(); this.router.navigate(['/login']); }
}
