import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-achados',
  templateUrl: './achados.page.html',
  styleUrls: ['./achados.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AchadosPage implements OnInit {
  itens: any[] = [];
  carregando = false;
  formularioAberto = false;
  novoItem = { descricao: '', local_encontrado: '' };

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getAchados().subscribe({
      next: (d) => { this.itens = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  salvar() {
    if (!this.novoItem.descricao) { this.toast('Descricao obrigatoria', 'warning'); return; }
    this.api.criarAchado(this.novoItem).subscribe({
      next: () => { this.toast('Item registrado!', 'success'); this.formularioAberto = false; this.novoItem = { descricao: '', local_encontrado: '' }; this.carregar(); },
      error: () => this.toast('Erro ao registrar', 'danger')
    });
  }

  retirar(id: string) {
    if (confirm('Marcar como retirado?')) {
      this.api.retirarAchado(id).subscribe({
        next: () => { this.toast('Marcado como retirado!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    }
  }

  deletar(id: string) {
    if (confirm('Excluir este item?')) {
      this.api.deletarAchado(id).subscribe({
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
