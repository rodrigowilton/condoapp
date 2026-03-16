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
  formularioAberto = false;
  podeRegistrar = false;
  busca = '';
  novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() { this.podeRegistrar = ['sindico', 'porteiro', 'gerencial'].includes(this.auth.perfil); this.carregar(); }
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
    this.visitantesFiltrados = b ? this.visitantes.filter(v =>
      v.nome?.toLowerCase().includes(b) || v.placa?.toLowerCase().includes(b)
    ) : [...this.visitantes];
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' }; }

  salvar() {
    if (!this.novoVisitante.nome) { this.toast('Nome obrigatorio', 'warning'); return; }
    this.api.registrarVisitante(this.novoVisitante).subscribe({
      next: () => { this.toast('Visitante registrado!', 'success'); this.fecharFormulario(); this.carregar(); },
      error: () => this.toast('Erro ao registrar', 'danger')
    });
  }

  registrarSaida(id: string) {
    if (confirm('Registrar saída deste visitante?')) {
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
