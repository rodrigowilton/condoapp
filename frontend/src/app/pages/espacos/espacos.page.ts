import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-espacos',
  templateUrl: './espacos.page.html',
  styleUrls: ['./espacos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class EspacosPage implements OnInit {
  espacos: any[] = [];
  carregando = false;
  formularioAberto = false;
  editando: any = null;
  form = { nome: '', descricao: '', capacidade: '' };

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getEspacos().subscribe({
      next: (d) => { this.espacos = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirFormulario() {
    this.editando = null;
    this.form = { nome: '', descricao: '', capacidade: '' };
    this.formularioAberto = true;
  }

  abrirEdicao(e: any) {
    this.editando = e;
    this.form = { nome: e.nome, descricao: e.descricao || '', capacidade: e.capacidade || '' };
    this.formularioAberto = true;
  }

  salvar() {
    if (!this.form.nome) { this.toast('Nome obrigatorio', 'warning'); return; }
    if (this.editando) {
      this.api.patch('/espacos/' + this.editando.id, this.form).subscribe({
        next: () => { this.toast('Espaco atualizado!', 'success'); this.formularioAberto = false; this.editando = null; this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    } else {
      this.api.criarEspaco(this.form).subscribe({
        next: () => { this.toast('Espaco criado!', 'success'); this.formularioAberto = false; this.form = { nome: '', descricao: '', capacidade: '' }; this.carregar(); },
        error: () => this.toast('Erro ao criar', 'danger')
      });
    }
  }

  deletar(id: string, nome: string) {
    if (confirm('Excluir espaco ' + nome + '?')) {
      this.api.deletarEspaco(id).subscribe({
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
