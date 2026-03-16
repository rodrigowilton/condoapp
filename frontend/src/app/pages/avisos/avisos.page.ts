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
  editando: any = null;
  ehSindico = false;
  novoAviso = { titulo: '', conteudo: '', urgente: false, fixado: false };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() { this.ehSindico = ['sindico', 'gerencial'].includes(this.auth.perfil); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getAvisos().subscribe({
      next: (data) => { this.avisos = data; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirFormulario(aviso?: any) {
    if (aviso) {
      this.editando = aviso;
      this.novoAviso = { titulo: aviso.titulo, conteudo: aviso.conteudo, urgente: aviso.urgente, fixado: aviso.fixado };
    } else {
      this.editando = null;
      this.novoAviso = { titulo: '', conteudo: '', urgente: false, fixado: false };
    }
    this.formularioAberto = true;
  }

  fecharFormulario() {
    this.formularioAberto = false;
    this.editando = null;
    this.novoAviso = { titulo: '', conteudo: '', urgente: false, fixado: false };
  }

  salvar() {
    if (!this.novoAviso.titulo || !this.novoAviso.conteudo) { this.toast('Titulo e conteudo sao obrigatorios', 'warning'); return; }
    const op = this.editando
      ? this.api.editarAviso(this.editando.id, this.novoAviso)
      : this.api.criarAviso(this.novoAviso);
    op.subscribe({
      next: () => { this.toast(this.editando ? 'Aviso atualizado!' : 'Aviso publicado!', 'success'); this.fecharFormulario(); this.carregar(); },
      error: () => this.toast('Erro ao salvar aviso', 'danger')
    });
  }

  async confirmarDelete(aviso: any) {
    const alert = await this.alertCtrl.create({
      header: 'Remover Aviso',
      message: 'Remover este aviso?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Remover', role: 'destructive', handler: () => {
          this.api.deletarAviso(aviso.id).subscribe({ next: () => { this.toast('Aviso removido', 'medium'); this.carregar(); } });
        }}
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
