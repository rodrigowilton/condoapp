import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ChangeDetectorRef } from '@angular/core';
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

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.podeRegistrar = ['sindico', 'porteiro', 'gerencial'].includes(this.auth.perfil); this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getEncomendas().subscribe({ next: (d) => { this.encomendas = d; this.filtrar(); this.carregando = false; this.cdr.detectChanges(); }, error: () => { this.carregando = false; } });
  }

  filtrar() { this.encomendasFiltradas = this.encomendas.filter(e => e.status === this.filtro); }
  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novaEncomenda = { apartamento: '', prateleira: '', remetente: '', descricao: '' }; }

  async salvarEncomenda() {
    if (!this.novaEncomenda.apartamento || !this.novaEncomenda.prateleira) { this.mostrarToast('Apartamento e prateleira obrigatorios', 'warning'); return; }
    this.api.getMoradores().subscribe({
      next: (moradores: any[]) => {
        const morador = moradores.find((m: any) => m.apartamento === this.novaEncomenda.apartamento);
        this.api.registrarEncomenda({ morador_id: morador?.id || null, ...this.novaEncomenda }).subscribe({
          next: () => { this.mostrarToast('Encomenda registrada!', 'success'); this.fecharFormulario(); this.carregar(); },
          error: () => this.mostrarToast('Erro ao registrar', 'danger')
        });
      },
      error: () => {
        this.api.registrarEncomenda({ morador_id: null, ...this.novaEncomenda }).subscribe({
          next: () => { this.mostrarToast('Encomenda registrada!', 'success'); this.fecharFormulario(); this.carregar(); },
          error: () => this.mostrarToast('Erro ao registrar', 'danger')
        });
      }
    });
  }

  confirmarRetirada(encomenda: any) {
    if (confirm('Confirmar retirada da encomenda?')) {
      this.api.retirarEncomenda(encomenda.id).subscribe({
        next: () => { this.mostrarToast('Retirada confirmada!', 'success'); this.carregar(); },
        error: () => this.mostrarToast('Erro ao confirmar retirada', 'danger')
      });
    }
  }

  deletar(e: any) {
    if (confirm('Excluir esta encomenda?')) {
      this.api.deletarEncomenda(e.id).subscribe({
        next: () => { this.mostrarToast('Encomenda excluida!', 'medium'); this.carregar(); },
        error: () => this.mostrarToast('Erro ao excluir', 'danger')
      });
    }
  }

  async mostrarToast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
