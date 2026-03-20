import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-moradores',
  templateUrl: './moradores.page.html',
  styleUrls: ['./moradores.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class MoradoresPage implements OnInit {
  moradores: any[] = [];
  carregando = false;
  formularioAberto = false;
  editando: any = null;
  podeEditar = false;
  homeUrl = '/#/sindico/home';
  form = { nome: '', email: '', senha: '', apartamento: '', bloco: '', telefone: '' };

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() {
    const perfil = this.auth.perfil;
    this.podeEditar = ['sindico', 'gerencial'].includes(perfil);
    this.homeUrl = `/#/${perfil}/home`;
    this.carregar();
  }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getMoradores().subscribe({
      next: (d) => { this.moradores = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  abrirFormulario() { this.editando = null; this.form = { nome: '', email: '', senha: '', apartamento: '', bloco: '', telefone: '' }; this.formularioAberto = true; }

  abrirEdicao(m: any) {
    this.editando = m;
    this.form = { nome: m.nome, email: m.email, senha: '', apartamento: m.apartamento, bloco: m.bloco || '', telefone: m.telefone || '' };
    this.formularioAberto = true;
  }

  fecharFormulario() { this.formularioAberto = false; this.editando = null; }

  salvar() {
    if (!this.form.nome || !this.form.apartamento) { this.toast('Nome e apartamento obrigatorios', 'warning'); return; }
    if (this.editando) {
      this.api.editarMorador(this.editando.id, this.form).subscribe({
        next: () => { this.toast('Morador atualizado!', 'success'); this.fecharFormulario(); this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    } else {
      if (!this.form.email || !this.form.senha) { this.toast('Email e senha obrigatorios', 'warning'); return; }
      this.api.post('/auth/moradores', { ...this.form, perfil: 'morador' }).subscribe({
        next: () => { this.toast('Morador cadastrado!', 'success'); this.fecharFormulario(); this.carregar(); },
        error: (err: any) => this.toast(err.error?.erro || 'Erro ao cadastrar', 'danger')
      });
    }
  }

  deletar(m: any) {
    if (confirm('Excluir morador ' + m.nome + '?')) {
      this.api.deletarMorador(m.id).subscribe({
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
