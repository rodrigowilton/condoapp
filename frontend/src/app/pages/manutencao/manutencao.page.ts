import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manutencao',
  templateUrl: './manutencao.page.html',
  styleUrls: ['./manutencao.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ManutencaoPage implements OnInit {
  chamados: any[] = [];
  carregando = false;
  formularioAberto = false;
  ehSindico = false;
  novoChamado = { titulo: '', descricao: '', local: '' };

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() { this.ehSindico = ['sindico', 'gerencial'].includes(this.auth.perfil); this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getManutencoes().subscribe({
      next: (d) => { this.chamados = d.filter((c: any) => c.status !== 'concluido'); this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novoChamado = { titulo: '', descricao: '', local: '' }; }

  salvar() {
    if (!this.novoChamado.titulo) { this.toast('Titulo obrigatorio', 'warning'); return; }
    this.api.criarManutencao(this.novoChamado).subscribe({
      next: () => { this.toast('Chamado aberto!', 'success'); this.fecharFormulario(); this.carregar(); },
      error: () => this.toast('Erro ao abrir chamado', 'danger')
    });
  }

  atualizarStatus(id: string, status: string) {
    this.api.atualizarManutencao(id, status).subscribe({
      next: () => { this.toast('Status atualizado!', 'success'); this.carregar(); },
      error: () => this.toast('Erro ao atualizar', 'danger')
    });
  }

  deletar(id: string) {
    if (confirm('Excluir este chamado?')) {
      this.api.deletarManutencao(id).subscribe({
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
