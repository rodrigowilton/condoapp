import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class UsuariosPage implements OnInit {
  usuarios: any[] = [];
  carregando = false;

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getUsuariosGerencial().subscribe({
      next: (d) => { this.usuarios = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  bloquear(u: any) {
    const acao = u.bloqueado ? 'desbloquear' : 'bloquear';
    if (confirm(acao.charAt(0).toUpperCase() + acao.slice(1) + ' ' + u.nome + '?')) {
      this.api.bloquearUsuario(u.id, !u.bloqueado).subscribe({
        next: () => { this.toast('Atualizado!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    }
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
