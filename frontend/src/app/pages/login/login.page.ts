// src/app/pages/login/login.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class LoginPage {
  email = '';
  senha = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  constructor(private auth: AuthService, private router: Router) {
    // Se já está logado, redireciona
    if (this.auth.estaLogado) this.redirecionar(this.auth.perfil);
  }

  entrar() {
    this.erro = '';
    if (!this.email || !this.senha) {
      this.erro = 'Preencha e-mail e senha';
      return;
    }
    this.carregando = true;

    this.auth.login(this.email, this.senha).subscribe({
      next: (res) => {
        this.carregando = false;
        this.redirecionar(res.usuario.perfil);
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.erro || 'Erro ao fazer login. Verifique sua conexão.';
      }
    });
  }

  private redirecionar(perfil: string) {
    if (perfil === 'gerencial') this.router.navigate(['/gerencial/dashboard']);
    else if (perfil === 'sindico') this.router.navigate(['/sindico/home']);
    else if (perfil === 'porteiro') this.router.navigate(['/porteiro/home']);
    else this.router.navigate(['/morador/home']);
  }
}
