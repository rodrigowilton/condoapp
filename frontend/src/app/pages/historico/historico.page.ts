import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-historico',
  templateUrl: './historico.page.html',
  styleUrls: ['./historico.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class HistoricoPage implements OnInit {
  aba = 'manutencoes';
  carregando = false;
  manutencoes: any[] = [];
  encomendas: any[] = [];
  visitantes: any[] = [];
  reservas: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getManutencoes().subscribe({ next: (d) => { this.manutencoes = d.filter((m: any) => m.status === 'concluido'); this.carregando = false; } });
    this.api.getEncomendas().subscribe({ next: (d) => { this.encomendas = d.filter((e: any) => e.status === 'retirado'); } });
    this.api.getVisitantes().subscribe({ next: (d) => { this.visitantes = d; } });
    this.api.getReservas().subscribe({ next: (d) => { this.reservas = d.filter((r: any) => r.status === 'aprovada' || r.status === 'recusada'); } });
  }
}
