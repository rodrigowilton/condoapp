// src/app/pages/votacao/votacao.page.ts
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

  novaAssembleia = {
    titulo: '',
    descricao: '',
    data_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.ehSindico = ['sindico', 'gerencial'].includes(this.auth.perfil);
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getAssembleias().subscribe({
      next: (data) => { this.assembleias = data; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  votar(id: string, voto: string) {
    this.api.votar(id, voto).subscribe({
      next: () => {
        this.toast(`Voto "${voto}" registrado com sucesso!`, 'success');
        this.carregar();
      },
      error: (err) => this.toast(err.error?.erro || 'Erro ao votar', 'danger')
    });
  }

  encerrar(id: string) {
    this.api.patch(`/assembleias/${id}/status`, { status: 'encerrada' }).subscribe({
      next: () => { this.toast('Assembleia encerrada!', 'medium'); this.carregar(); }
    });
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() {
    this.formularioAberto = false;
    this.novaAssembleia = {
      titulo: '', descricao: '',
      data_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  salvar() {
    if (!this.novaAssembleia.titulo) {
      this.toast('Informe o título da pauta', 'warning');
      return;
    }
    this.api.criarAssembleia(this.novaAssembleia).subscribe({
      next: () => {
        this.toast('✅ Votação aberta!', 'success');
        this.fecharFormulario();
        this.carregar();
      },
      error: () => this.toast('Erro ao criar assembleia', 'danger')
    });
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
