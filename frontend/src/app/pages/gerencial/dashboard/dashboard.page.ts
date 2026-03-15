// src/app/pages/gerencial/dashboard/dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class DashboardPage implements OnInit {
  stats: any = {};
  condominios: any[] = [];
  modalAberto = false;

  novoCondo = {
    nome: '', endereco: '', cidade: '', estado: '',
    sindico_nome: '', sindico_email: '', sindico_senha: ''
  };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.api.getDashboardGerencial().subscribe(d => this.stats = d);
    this.api.getCondominios().subscribe(d => this.condominios = d);
  }

  ir(pagina: string) { this.router.navigate([`/gerencial/${pagina}`]); }

  abrirCriarCondo() { this.modalAberto = true; }
  fecharModal() {
    this.modalAberto = false;
    this.novoCondo = { nome:'', endereco:'', cidade:'', estado:'', sindico_nome:'', sindico_email:'', sindico_senha:'' };
  }

  salvarCondo() {
    if (!this.novoCondo.nome || !this.novoCondo.sindico_nome || !this.novoCondo.sindico_email || !this.novoCondo.sindico_senha) {
      this.toast('Preencha todos os campos obrigatórios (*)', 'warning');
      return;
    }
    this.api.criarCondominio(this.novoCondo).subscribe({
      next: () => {
        this.toast('✅ Condomínio criado com sucesso!', 'success');
        this.fecharModal();
        this.carregar();
      },
      error: (err) => this.toast(err.error?.erro || 'Erro ao criar condomínio', 'danger')
    });
  }

  async toggleBloqueio(condo: any) {
    const acao = condo.bloqueado ? 'desbloquear' : 'bloquear';
    const alert = await this.alertCtrl.create({
      header: `Confirmar`,
      message: `Deseja ${acao} o condomínio "${condo.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: acao.charAt(0).toUpperCase() + acao.slice(1),
          handler: () => {
            this.api.bloquearCondominio(condo.id, !condo.bloqueado).subscribe({
              next: () => { this.toast(`✅ Condomínio ${acao === 'bloquear' ? 'bloqueado' : 'desbloqueado'}!`, 'success'); this.carregar(); },
              error: () => this.toast('Erro ao atualizar', 'danger')
            });
          }
        }
      ]
    });
    alert.present();
  }

  async estenderTrial(condo: any) {
    const alert = await this.alertCtrl.create({
      header: 'Estender Trial',
      message: `Adicionar 30 dias de trial para "${condo.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: '+30 dias',
          handler: () => {
            this.api.estenderTrial(condo.id, 30).subscribe({
              next: () => { this.toast('✅ Trial estendido por 30 dias!', 'success'); this.carregar(); }
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

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
