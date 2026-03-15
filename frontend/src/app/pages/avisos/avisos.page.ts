// src/app/pages/avisos/avisos.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos.page.html',
  styleUrls: ['./avisos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AvisosPage implements OnInit {
  avisos: any[] = [];
  carregando = false;
  formularioAberto = false;
  ehSindico = false;
  novoAviso = { titulo: '', conteudo: '', urgente: false, fixado: false };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.ehSindico = ['sindico', 'gerencial'].includes(this.auth.perfil);
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getAvisos().subscribe({
      next: (data) => { this.avisos = data; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() {
    this.formularioAberto = false;
    this.novoAviso = { titulo: '', conteudo: '', urgente: false, fixado: false };
  }

  salvar() {
    if (!this.novoAviso.titulo || !this.novoAviso.conteudo) {
      this.toast('Título e conteúdo são obrigatórios', 'warning');
      return;
    }
    this.api.criarAviso(this.novoAviso).subscribe({
      next: () => {
        this.toast('✅ Aviso publicado para todos os moradores!', 'success');
        this.fecharFormulario();
        this.carregar();
      },
      error: () => this.toast('Erro ao publicar aviso', 'danger')
    });
  }

  async confirmarDelete(aviso: any) {
    const alert = await this.alertCtrl.create({
      header: 'Remover Aviso',
      message: `Remover o aviso "${aviso.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover', role: 'destructive',
          handler: () => {
            this.api.deletarAviso(aviso.id).subscribe({
              next: () => { this.toast('Aviso removido', 'medium'); this.carregar(); }
            });
          }
        }
      ]
    });
    alert.present();
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
