import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-condominios',
  templateUrl: './condominios.page.html',
  styleUrls: ['./condominios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class CondominiosPage implements OnInit {
  condominios: any[] = [];
  carregando = false;
  formularioAberto = false;
  editandoAberto = false;
  sindicoAberto = false;
  editando: any = {};
  condominioSelecionado: any = null;
  novoSindico = { nome: '', email: '', senha: '' };
  novo = { nome: '', endereco: '', cidade: '', estado: '', sindico_nome: '', sindico_email: '', sindico_senha: '' };

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getCondominios().subscribe({
      next: (d) => { this.condominios = d; this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  bloquear(c: any) {
    const acao = c.bloqueado ? 'desbloquear' : 'bloquear';
    if (confirm(acao.charAt(0).toUpperCase() + acao.slice(1) + ' ' + c.nome + '?')) {
      this.api.bloquearCondominio(c.id, !c.bloqueado).subscribe({
        next: () => { this.toast('Atualizado!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    }
  }

  estender(c: any) {
    if (confirm('Adicionar 30 dias de trial para ' + c.nome + '?')) {
      this.api.estenderTrial(c.id, 30).subscribe({
        next: () => { this.toast('+30 dias adicionados!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao estender', 'danger')
      });
    }
  }

  semVencimento(c: any) {
    if (confirm('Remover vencimento de ' + c.nome + '?')) {
      this.api.semVencimento(c.id).subscribe({
        next: () => { this.toast('Sem vencimento definido!', 'success'); this.carregar(); },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    }
  }

  abrirEdicao(c: any) {
    this.editando = { id: c.id, nome: c.nome, endereco: c.endereco || '', cidade: c.cidade || '', estado: c.estado || '' };
    this.editandoAberto = true;
  }

  salvarEdicao() {
    if (!this.editando.nome) { this.toast('Nome obrigatorio', 'warning'); return; }
    this.api.editarCondominio(this.editando.id, this.editando).subscribe({
      next: () => { this.toast('Condominio atualizado!', 'success'); this.editandoAberto = false; this.carregar(); },
      error: () => this.toast('Erro ao atualizar', 'danger')
    });
  }

  abrirVincularSindico(c: any) {
    this.condominioSelecionado = c;
    this.novoSindico = { nome: '', email: '', senha: '' };
    this.sindicoAberto = true;
  }

  salvarSindico() {
    if (!this.novoSindico.nome || !this.novoSindico.email || !this.novoSindico.senha) {
      this.toast('Preencha todos os campos', 'warning'); return;
    }
    this.api.criarSindicoCondominio(this.condominioSelecionado.id, this.novoSindico).subscribe({
      next: () => { this.toast('Sindico criado e vinculado!', 'success'); this.sindicoAberto = false; this.carregar(); },
      error: (err: any) => this.toast(err.error?.erro || 'Erro ao criar sindico', 'danger')
    });
  }

  salvar() {
    if (!this.novo.nome || !this.novo.sindico_nome || !this.novo.sindico_email || !this.novo.sindico_senha) {
      this.toast('Preencha todos os campos obrigatorios', 'warning'); return;
    }
    this.api.criarCondominio(this.novo).subscribe({
      next: () => { this.toast('Condominio criado!', 'success'); this.formularioAberto = false; this.novo = { nome: '', endereco: '', cidade: '', estado: '', sindico_nome: '', sindico_email: '', sindico_senha: '' }; this.carregar(); },
      error: (err: any) => this.toast(err.error?.erro || 'Erro ao criar', 'danger')
    });
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
