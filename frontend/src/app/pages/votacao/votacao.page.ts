import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-votacao',
  templateUrl: './votacao.page.html',
  styleUrls: ['./votacao.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class VotacaoPage implements OnInit {
  assembleias: any[] = [];
  carregando = false;
  formularioAberto = false;
  ehSindico = false;
  novaAssembleia = { titulo: '', descricao: '', data_limite: '' };

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() { this.ehSindico = ['sindico', 'gerencial'].includes(this.auth.perfil); this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getAssembleias().subscribe({
      next: (d) => { this.assembleias = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  votar(id: string, voto: string) {
    this.api.votar(id, voto).subscribe({
      next: () => { this.toast('Voto registrado!', 'success'); this.carregar(); },
      error: () => this.toast('Erro ao votar', 'danger')
    });
  }

  encerrar(id: string) {
    if (confirm('Encerrar esta votacao?')) {
      this.api.encerrarAssembleia(id).subscribe({
        next: () => { this.toast('Encerrada!', 'medium'); this.carregar(); },
        error: () => this.toast('Erro ao encerrar', 'danger')
      });
    }
  }

  deletar(id: string) {
    if (confirm('Excluir esta votacao?')) {
      this.api.deletarAssembleia(id).subscribe({
        next: () => { this.toast('Removido!', 'medium'); this.carregar(); },
        error: () => this.toast('Erro ao excluir', 'danger')
      });
    }
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novaAssembleia = { titulo: '', descricao: '', data_limite: '' }; }

  salvar() {
    if (!this.novaAssembleia.titulo || !this.novaAssembleia.data_limite) { this.toast('Titulo e prazo obrigatorios', 'warning'); return; }
    this.api.criarAssembleia(this.novaAssembleia).subscribe({
      next: () => { this.toast('Votacao aberta!', 'success'); this.fecharFormulario(); this.carregar(); },
      error: () => this.toast('Erro ao criar', 'danger')
    });
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
