// src/app/pages/home-sindico/home-sindico.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home-sindico',
  templateUrl: './home-sindico.page.html',
  styleUrls: ['./home-sindico.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HomeSindicoPage implements OnInit {
  reservas: any[] = [];
  totalMoradores = 0;
  reservasPendentes = 0;
  chamadosAbertos = 0;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() { this.carregar(); }

  carregar() {
    this.api.getReservas().subscribe(data => {
      this.reservas = data.filter((r: any) => r.status === 'pendente');
      this.reservasPendentes = this.reservas.length;
    });

    this.api.getManutencoes().subscribe(data => {
      this.chamadosAbertos = data.filter((m: any) => m.status === 'aberto').length;
    });
  }

  aprovarReserva(id: string, status: string) {
    this.api.atualizarReserva(id, status).subscribe(() => this.carregar());
  }

  ir(pagina: string) { this.router.navigate([`/sindico/${pagina}`]); }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }

  refresh(event: any) {
    this.carregar();
    setTimeout(() => event.target.complete(), 1000);
  }
}
