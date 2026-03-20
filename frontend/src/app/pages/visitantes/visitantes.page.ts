import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-visitantes',
  templateUrl: './visitantes.page.html',
  styleUrls: ['./visitantes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class VisitantesPage implements OnInit {
  visitantes: any[] = [];
  visitantesFiltrados: any[] = [];
  carregando = false;
  busca = '';
  perfil = '';
  homeUrl = '/#/sindico/home';

  // Permissões
  podeRegistrar = false;  // porteiro, sindico, morador
  podeAutorizar = false;  // porteiro, sindico
  podeDeletar = false;    // sindico, gerencial

  // Modal novo visitante (morador cadastra antecipado)
  modalNovo = false;
  novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };
  salvando = false;

  // Modal autorizar (porteiro completa e autoriza)
  modalAutorizar = false;
  visitanteSelecionado: any = null;
  dadosAutorizacao = { documento: '', placa: '', motivo: '' };
  autorizando = false;

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() {
    this.perfil = this.auth.perfil;
    this.homeUrl = '/#/' + this.perfil + '/home';
    this.podeRegistrar = ['sindico', 'porteiro', 'gerencial', 'morador'].includes(this.perfil);
    this.podeAutorizar = ['sindico', 'porteiro', 'gerencial'].includes(this.perfil);
    this.podeDeletar = ['sindico', 'gerencial'].includes(this.perfil);
    this.carregar();
  }

  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getVisitantes().subscribe({
      next: (d) => { this.visitantes = d; this.filtrar(); this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  filtrar() {
    const b = this.busca.toLowerCase();
    this.visitantesFiltrados = b
      ? this.visitantes.filter(v => v.nome?.toLowerCase().includes(b) || v.placa?.toLowerCase().includes(b) || v.apartamento?.toLowerCase().includes(b))
      : [...this.visitantes];
  }

  get pendentes() { return this.visitantesFiltrados.filter(v => v.status === 'pendente'); }
  get ativos() { return this.visitantesFiltrados.filter(v => v.status === 'autorizado'); }
  get saidos() { return this.visitantesFiltrados.filter(v => v.status === 'saiu'); }

  // ── Novo visitante ──
  abrirNovo() {
    this.novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };
    if (this.perfil === 'morador') {
      this.novoVisitante.apartamento = (this.auth.usuario as any)?.apartamento || '';
    }
    this.modalNovo = true;
  }

  salvar() {
    if (!this.novoVisitante.nome) { this.toast('Nome obrigatorio', 'warning'); return; }
    this.salvando = true;
    this.api.registrarVisitante(this.novoVisitante).subscribe({
      next: () => { this.salvando = false; this.modalNovo = false; this.carregar(); this.toast('Visitante cadastrado!', 'success'); },
      error: () => { this.salvando = false; this.toast('Erro ao cadastrar', 'danger'); }
    });
  }

  // ── Autorizar visitante pendente (porteiro) ──
  abrirAutorizar(v: any) {
    this.visitanteSelecionado = v;
    this.dadosAutorizacao = { documento: v.documento || '', placa: v.placa || '', motivo: v.motivo || '' };
    this.modalAutorizar = true;
  }

  autorizar() {
    this.autorizando = true;
    this.api.autorizarVisitante(this.visitanteSelecionado.id, this.dadosAutorizacao).subscribe({
      next: () => { this.autorizando = false; this.modalAutorizar = false; this.carregar(); this.toast('Visitante autorizado!', 'success'); },
      error: () => { this.autorizando = false; this.toast('Erro ao autorizar', 'danger'); }
    });
  }

  // ── Registrar saída ──
  registrarSaida(id: string) {
    if (confirm('Registrar saida deste visitante?')) {
      this.api.atualizarStatusVisitante(id, 'saiu').subscribe({
        next: () => { this.toast('Saida registrada!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao registrar saida', 'danger')
      });
    }
  }

  deletar(id: string) {
    if (confirm('Excluir este visitante?')) {
      this.api.deletarVisitante(id).subscribe({
        next: () => { this.toast('Removido!', 'medium'); this.carregar(); },
        error: () => this.toast('Erro ao excluir', 'danger')
      });
    }
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
