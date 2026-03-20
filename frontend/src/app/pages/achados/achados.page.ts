import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

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
  perfil = '';
  homeUrl = '/#/sindico/home';

  modalNovo = false;
  novoItem = { descricao: '', local_encontrado: '' };
  salvando = false;

  modalBaixa = false;
  itemSelecionado: any = null;
  dadosRetirada = { nome: '', apartamento: '' };
  salvandoBaixa = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.perfil = this.auth.perfil;
    this.homeUrl = '/#/' + this.perfil + '/home';
    this.carregar();
  }

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
    this.salvando = true;
    this.api.criarAchado(this.novoItem).subscribe({
      next: () => {
        this.salvando = false;
        this.modalNovo = false;
        this.novoItem = { descricao: '', local_encontrado: '' };
        this.carregar();
        this.toast('Item registrado!', 'success');
      },
      error: () => { this.salvando = false; this.toast('Erro ao registrar', 'danger'); }
    });
  }

  abrirBaixa(item: any) {
    this.itemSelecionado = item;
    this.dadosRetirada = { nome: '', apartamento: '' };
    this.modalBaixa = true;
  }

  confirmarBaixa() {
    if (!this.dadosRetirada.nome || !this.dadosRetirada.apartamento) {
      this.toast('Informe o nome e apartamento de quem retirou', 'warning');
      return;
    }
    this.salvandoBaixa = true;
    this.api.retirarAchado(this.itemSelecionado.id, {
      retirado_por_nome: this.dadosRetirada.nome,
      retirado_por_apto: this.dadosRetirada.apartamento
    }).subscribe({
      next: () => {
        this.salvandoBaixa = false;
        this.modalBaixa = false;
        this.itemSelecionado = null;
        this.carregar();
        this.toast('Baixa registrada!', 'success');
      },
      error: () => { this.salvandoBaixa = false; this.toast('Erro ao registrar baixa', 'danger'); }
    });
  }

  deletar(id: string) {
    if (confirm('Excluir este item?')) {
      this.api.deletarAchado(id).subscribe({
        next: () => { this.carregar(); this.toast('Removido!', 'medium'); },
        error: () => this.toast('Erro ao excluir', 'danger')
      });
    }
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }

  get podeEditar() {
    return ['sindico', 'gerencial', 'porteiro'].includes(this.perfil);
  }
}
