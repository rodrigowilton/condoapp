import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reservas',
  templateUrl: './reservas.page.html',
  styleUrls: ['./reservas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ReservasPage implements OnInit {
  reservas: any[] = [];
  espacos: any[] = [];
  carregando = false;
  formularioAberto = false;
  novaReserva = { espaco_id: '', data_inicio: '', data_fim: '', observacao: '' };

  constructor(private api: ApiService, private toastCtrl: ToastController) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getReservas().subscribe({ next: (d) => { this.reservas = d; this.carregando = false; }, error: () => { this.carregando = false; } });
    this.api.getEspacos().subscribe({ next: (d) => { this.espacos = d; } });
  }

  salvar() {
    if (!this.novaReserva.espaco_id || !this.novaReserva.data_inicio || !this.novaReserva.data_fim) {
      this.toast('Preencha todos os campos', 'warning'); return;
    }
    this.api.criarReserva(this.novaReserva).subscribe({
      next: () => { this.toast('Reserva solicitada!', 'success'); this.formularioAberto = false; this.carregar(); },
      error: () => this.toast('Erro ao criar reserva', 'danger')
    });
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }

  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}
