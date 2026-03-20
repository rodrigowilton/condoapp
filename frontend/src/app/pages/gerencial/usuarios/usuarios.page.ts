import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class UsuariosPage implements OnInit {
  usuarios: any[] = [];
  condominios: any[] = [];
  carregando = false;
  formularioAberto = false;
  novoUsuario = { nome: '', email: '', senha: '', perfil: 'sindico', condominio_id: '' };
  
  // ✨ NOVAS PROPRIEDADES PARA EDIÇÃO
  editandoAberto = false;
  editando: any = { 
    id: null,
    nome: '', 
    email: '', 
    perfil: '', 
    condominio_id: '' 
  };

  constructor(
    private api: ApiService, 
    private toastCtrl: ToastController, 
    private router: Router
  ) {}

  ngOnInit() { this.carregar(); }
  ionViewWillEnter() { this.carregar(); }

  carregar() {
    this.carregando = true;
    this.api.getUsuariosGerencial().subscribe({ 
      next: (d) => { 
        this.usuarios = d; 
        this.carregando = false; 
      }, 
      error: () => { 
        this.carregando = false; 
      } 
    });
    this.api.getCondominios().subscribe({ 
      next: (d) => { 
        this.condominios = d; 
      } 
    });
  }

  bloquear(u: any) {
    const acao = u.bloqueado ? 'desbloquear' : 'bloquear';
    if (confirm(acao.charAt(0).toUpperCase() + acao.slice(1) + ' ' + u.nome + '?')) {
      this.api.bloquearUsuario(u.id, !u.bloqueado).subscribe({
        next: () => { 
          this.toast('Atualizado!', 'success'); 
          this.carregar(); 
        },
        error: () => this.toast('Erro ao atualizar', 'danger')
      });
    }
  }

  salvar() {
    if (!this.novoUsuario.nome || !this.novoUsuario.email || !this.novoUsuario.senha) {
      this.toast('Preencha todos os campos obrigatorios', 'warning'); 
      return;
    }
    this.api.post('/gerencial/usuarios', this.novoUsuario).subscribe({
      next: () => { 
        this.toast('Usuario criado!', 'success'); 
        this.formularioAberto = false; 
        this.novoUsuario = { nome: '', email: '', senha: '', perfil: 'sindico', condominio_id: '' }; 
        this.carregar(); 
      },
      error: (err: any) => this.toast(err.error?.erro || 'Erro ao criar', 'danger')
    });
  }

  deletar(u: any) {
    if (confirm('Excluir usuario ' + u.nome + '?')) {
      this.api.deletarUsuarioGerencial(u.id).subscribe({
        next: () => { 
          this.toast('Usuario excluido!', 'medium'); 
          this.carregar(); 
        },
        error: () => this.toast('Erro ao excluir', 'danger')
      });
    }
  }

  // ✨ NOVO MÉTODO PARA ABRIR EDIÇÃO
  abrirEdicao(usuario: any) {
    this.editando = { 
      id: usuario.id,
      nome: usuario.nome, 
      email: usuario.email, 
      perfil: usuario.perfil, 
      condominio_id: usuario.condominio_id || '' 
    };
    this.editandoAberto = true;
  }

  // ✨ NOVO MÉTODO PARA SALVAR EDIÇÃO
  salvarEdicao() {
    // TODO: Implementar chamada API para atualizar usuário
    console.log('Salvar edição:', this.editando);
    this.toast('Funcionalidade de edição em desenvolvimento', 'warning');
    this.editandoAberto = false;
    // this.api.put('/gerencial/usuarios/' + this.editando.id, this.editando).subscribe({
    //   next: () => {
    //     this.toast('Usuario atualizado!', 'success');
    //     this.editandoAberto = false;
    //     this.carregar();
    //   },
    //   error: (err) => this.toast(err.error?.erro || 'Erro ao atualizar', 'danger')
    // });
  }

  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ 
      message: msg, 
      duration: 3000, 
      color, 
      position: 'top' 
    });
    t.present();
  }

  refresh(e: any) { 
    this.carregar(); 
    setTimeout(() => e.target.complete(), 1000); 
  }
}
