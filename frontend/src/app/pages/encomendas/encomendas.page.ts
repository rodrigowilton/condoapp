// src/app/pages/encomendas/encomendas.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-encomendas',
  templateUrl: './encomendas.page.html',
  styleUrls: ['./encomendas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class EncomendasPage implements OnInit {
  encomendas: any[] = [];
  encomendasFiltradas: any[] = [];
  filtro = 'aguardando';
  carregando = false;
  formularioAberto = false;
  podeRegistrar = false;

  novaEncomenda = { apartamento: '', prateleira: '', remetente: '', descricao: '' };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const perfil = this.auth.perfil;
    this.podeRegistrar = ['sindico', 'porteiro', 'gerencial'].includes(perfil);
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getEncomendas().subscribe({
      next: (data) => {
        this.encomendas = data;
        this.filtrar();
        this.carregando = false;
      },
      error: () => { this.carregando = false; }
    });
  }

  filtrar() {
    this.encomendasFiltradas = this.encomendas.filter(e => e.status === this.filtro);
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() {
    this.formularioAberto = false;
    this.novaEncomenda = { apartamento: '', prateleira: '', remetente: '', descricao: '' };
  }

  async salvarEncomenda() {
    if (!this.novaEncomenda.apartamento || !this.novaEncomenda.prateleira) {
      this.mostrarToast('Apartamento e prateleira são obrigatórios', 'warning');
      return;
    }

    // Busca morador pelo apartamento (simplificado — em produção use um select)
    this.api.post('/auth/moradores/buscar', { apartamento: this.novaEncomenda.apartamento }).subscribe({
      next: (morador: any) => {
        this.api.registrarEncomenda({
          morador_id: morador.id,
          ...this.novaEncomenda
        }).subscribe({
          next: () => {
            this.mostrarToast('✅ Encomenda registrada! Morador notificado.', 'success');
            this.fecharFormulario();
            this.carregar();
          },
          error: () => this.mostrarToast('Erro ao registrar encomenda', 'danger')
        });
      },
      error: () => this.mostrarToast('Morador não encontrado no apartamento informado', 'warning')
    });
  }

  async confirmarRetirada(encomenda: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Retirada',
      message: `Confirmar retirada da encomenda de ${encomenda.morador_nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: () => {
            this.api.retirarEncomenda(encomenda.id).subscribe({
              next: () => {
                this.mostrarToast('✅ Retirada confirmada!', 'success');
                this.carregar();
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    toast.present();
  }

  refresh(event: any) {
    this.carregar();
    setTimeout(() => event.target.complete(), 1000);
  }
}
