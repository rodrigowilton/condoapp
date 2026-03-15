// src/app/pages/visitantes/visitantes.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-visitantes',
  templateUrl: './visitantes.page.html',
  styleUrls: ['./visitantes.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class VisitantesPage implements OnInit {
  visitantes: any[] = [];
  visitantesFiltrados: any[] = [];
  carregando = false;
  formularioAberto = false;
  podeRegistrar = false;
  busca = '';

  novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.podeRegistrar = ['sindico', 'porteiro', 'gerencial'].includes(this.auth.perfil);
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.getVisitantes().subscribe({
      next: (data) => { this.visitantes = data; this.filtrar(); this.carregando = false; },
      error: () => { this.carregando = false; }
    });
  }

  filtrar() {
    const b = this.busca.toLowerCase();
    this.visitantesFiltrados = b
      ? this.visitantes.filter(v =>
          v.nome?.toLowerCase().includes(b) ||
          v.placa?.toLowerCase().includes(b) ||
          v.documento?.toLowerCase().includes(b)
        )
      : [...this.visitantes];
  }

  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() {
    this.formularioAberto = false;
    this.novoVisitante = { nome: '', apartamento: '', documento: '', placa: '', motivo: '' };
  }

  salvar() {
    if (!this.novoVisitante.nome || !this.novoVisitante.apartamento) {
      this.toast('Nome e apartamento são obrigatórios', 'warning');
      return;
    }
    this.api.registrarVisitante(this.novoVisitante).subscribe({
      next: () => {
        this.toast('✅ Visitante registrado!', 'success');
        this.fecharFormulario();
        this.carregar();
      },
      error: (err) => this.toast(err.error?.erro || 'Erro ao registrar', 'danger')
    });
  }

  registrarSaida(id: string) {
    this.api.patch(`/visitantes/${id}/saida`, {}).subscribe({
      next: () => { this.toast('Saída registrada!', 'medium'); this.carregar(); }
    });
  }

  getCorStatus(status: string): string {
    const cores: any = { autorizado: 'success', aguardando: 'warning', recusado: 'danger', saiu: 'medium' };
    return cores[status] || 'medium';
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
