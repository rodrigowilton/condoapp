// src/app/pages/home-morador/home-morador.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home-morador',
  templateUrl: './home-morador.page.html',
  styleUrls: ['./home-morador.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class HomeMoradorPage implements OnInit {
  usuario: any;
  avisos: any[] = [];
  encomendasPendentes = 0;
  naoLidas = 0;
  carregando = false;

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.auth.usuario;
    this.carregar();
  }

  carregar() {
    this.carregando = true;

    this.api.getAvisos().subscribe({
      next: (data) => { this.avisos = data; this.carregando = false; },
      error: () => { this.carregando = false; }
    });

    this.api.getEncomendas().subscribe({
      next: (data) => {
        this.encomendasPendentes = data.filter((e: any) => e.status === 'aguardando').length;
      }
    });

    this.api.getNotificacoes().subscribe({
      next: (data) => {
        this.naoLidas = data.filter((n: any) => !n.lida).length;
      }
    });
  }

  ir(pagina: string) {
    this.router.navigate([`/morador/${pagina}`]);
  }

  verNotificacoes() {
    // Abre modal de notificações (próxima etapa)
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  refresh(event: any) {
    this.carregar();
    setTimeout(() => event.target.complete(), 1000);
  }
}
