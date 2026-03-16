import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-mural',
  templateUrl: './mural.page.html',
  styleUrls: ['./mural.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class MuralPage implements OnInit {
  recados: any[] = [];
  carregando = false;
  formularioAberto = false;
  novoRecado = { titulo: '', conteudo: '', categoria: 'geral' };

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getMural().subscribe({
      next: (d) => { this.recados = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  salvar() {
    if (!this.novoRecado.conteudo) { this.toast('Conteudo obrigatorio', 'warning'); return; }
    this.api.criarRecado(this.novoRecado).subscribe({
      next: () => { this.toast('Publicado!', 'success'); this.formularioAberto = false; this.novoRecado = { titulo: '', conteudo: '', categoria: 'geral' }; this.carregar(); },
      error: () => this.toast('Erro ao publicar', 'danger')
    });
  }

  deletar(id: string) {
    if (confirm('Excluir este recado?')) {
      this.api.deletarRecado(id).subscribe({
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
