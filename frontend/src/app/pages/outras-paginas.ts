// ═══════════════════════════════════════════════════
// ARQUIVO DE REFERÊNCIA — páginas restantes
// Cada seção representa um arquivo separado
// ═══════════════════════════════════════════════════

// ──────────────────────────────────────────────────
// FILE: src/app/pages/manutencao/manutencao.page.ts
// ──────────────────────────────────────────────────
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-manutencao',
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start"><ion-back-button></ion-back-button></ion-buttons>
    <ion-title>🔧 Manutenções</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="abrirFormulario()"><ion-icon name="add-outline"></ion-icon></ion-button>
    </ion-buttons>
  </ion-toolbar>
  <ion-toolbar>
    <ion-segment [(ngModel)]="filtro" (ionChange)="filtrar()">
      <ion-segment-button value="aberto"><ion-label>Abertos</ion-label></ion-segment-button>
      <ion-segment-button value="em_andamento"><ion-label>Em andamento</ion-label></ion-segment-button>
      <ion-segment-button value="concluido"><ion-label>Concluídos</ion-label></ion-segment-button>
    </ion-segment>
  </ion-toolbar>
</ion-header>
<ion-content>
  <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
  <div *ngIf="!carregando && chamadosFiltrados.length === 0" class="empty-state">
    <div class="empty-icon">🔧</div><p>Nenhum chamado {{ filtro === 'aberto' ? 'aberto' : filtro === 'em_andamento' ? 'em andamento' : 'concluído' }}</p>
  </div>
  <ion-card *ngFor="let c of chamadosFiltrados">
    <ion-card-header>
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <ion-card-title>{{ c.titulo }}</ion-card-title>
          <ion-card-subtitle>{{ c.solicitante_nome }} — Apto {{ c.apartamento }}</ion-card-subtitle>
        </div>
        <ion-badge [color]="c.status==='aberto'?'danger':c.status==='em_andamento'?'warning':'success'">
          {{ c.status === 'aberto' ? 'Aberto' : c.status === 'em_andamento' ? 'Em andamento' : 'Concluído' }}
        </ion-badge>
      </div>
    </ion-card-header>
    <ion-card-content>
      <p *ngIf="c.descricao">{{ c.descricao }}</p>
      <p *ngIf="c.local"><ion-icon name="location-outline"></ion-icon> {{ c.local }}</p>
      <p><ion-icon name="time-outline"></ion-icon> {{ c.criado_em | date:'dd/MM/yyyy HH:mm' }}</p>
    </ion-card-content>
    <div class="card-actions" *ngIf="ehSindico && c.status !== 'concluido'">
      <ion-button fill="clear" color="warning" size="small" *ngIf="c.status==='aberto'"
        (click)="mudarStatus(c.id,'em_andamento')">Em andamento</ion-button>
      <ion-button fill="clear" color="success" size="small" *ngIf="c.status==='em_andamento'"
        (click)="mudarStatus(c.id,'concluido')">Concluir</ion-button>
    </div>
  </ion-card>
  <ion-modal [isOpen]="formularioAberto" (didDismiss)="fecharFormulario()">
    <ng-template>
      <ion-header><ion-toolbar><ion-title>Novo Chamado</ion-title>
        <ion-buttons slot="end"><ion-button (click)="fecharFormulario()">Cancelar</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-item><ion-label position="floating">Título *</ion-label>
          <ion-input [(ngModel)]="novoChamado.titulo" placeholder="Ex: Lâmpada queimada no corredor"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Local</ion-label>
          <ion-input [(ngModel)]="novoChamado.local" placeholder="Ex: Corredor 2º andar"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Descrição</ion-label>
          <ion-textarea [(ngModel)]="novoChamado.descricao" rows="4"></ion-textarea></ion-item>
        <ion-button expand="block" color="primary" (click)="salvar()" style="margin-top:20px">
          <ion-icon name="send-outline" slot="start"></ion-icon>Abrir Chamado</ion-button>
      </ion-content>
    </ng-template>
  </ion-modal>
</ion-content>`,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ManutencaoPage implements OnInit {
  chamados: any[] = [];
  chamadosFiltrados: any[] = [];
  carregando = false;
  formularioAberto = false;
  ehSindico = false;
  filtro = 'aberto';
  novoChamado = { titulo: '', local: '', descricao: '' };

  constructor(private api: ApiService, private auth: AuthService, private toastCtrl: ToastController) {}

  ngOnInit() {
    this.ehSindico = ['sindico','gerencial'].includes(this.auth.perfil);
    this.carregar();
  }
  carregar() {
    this.api.getManutencoes().subscribe({ next: (d) => { this.chamados = d; this.filtrar(); } });
  }
  filtrar() { this.chamadosFiltrados = this.chamados.filter(c => c.status === this.filtro); }
  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novoChamado = { titulo:'', local:'', descricao:'' }; }
  salvar() {
    if (!this.novoChamado.titulo) { this.toast('Título é obrigatório', 'warning'); return; }
    this.api.criarManutencao(this.novoChamado).subscribe({
      next: () => { this.toast('✅ Chamado aberto!', 'success'); this.fecharFormulario(); this.carregar(); }
    });
  }
  mudarStatus(id: string, status: string) {
    this.api.atualizarManutencao(id, status).subscribe({ next: () => { this.toast('Status atualizado!', 'success'); this.carregar(); } });
  }
  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 3000, color, position: 'top' });
    t.present();
  }
  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 1000); }
}


// ──────────────────────────────────────────────────
// FILE: src/app/pages/achados/achados.page.ts
// ──────────────────────────────────────────────────
@Component({
  selector: 'app-achados',
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start"><ion-back-button></ion-back-button></ion-buttons>
    <ion-title>🔍 Achados & Perdidos</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="abrirFormulario()"><ion-icon name="add-outline"></ion-icon></ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>
<ion-content>
  <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
  <div *ngIf="itens.length === 0" class="empty-state"><div class="empty-icon">🔍</div><p>Nenhum item registrado</p></div>
  <ion-card *ngFor="let item of itens">
    <ion-card-header>
      <div style="display:flex;justify-content:space-between">
        <ion-card-title>{{ item.descricao }}</ion-card-title>
        <ion-badge [color]="item.status==='disponivel'?'warning':'success'">
          {{ item.status === 'disponivel' ? 'Disponível' : 'Retirado' }}
        </ion-badge>
      </div>
      <ion-card-subtitle>Registrado por {{ item.registrado_nome }} · {{ item.criado_em | date:'dd/MM HH:mm' }}</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <p *ngIf="item.local_encontrado"><ion-icon name="location-outline"></ion-icon> {{ item.local_encontrado }}</p>
    </ion-card-content>
  </ion-card>
  <ion-modal [isOpen]="formularioAberto" (didDismiss)="fecharFormulario()">
    <ng-template>
      <ion-header><ion-toolbar><ion-title>Registrar Item</ion-title>
        <ion-buttons slot="end"><ion-button (click)="fecharFormulario()">Cancelar</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-item><ion-label position="floating">Descrição do item *</ion-label>
          <ion-input [(ngModel)]="novoItem.descricao" placeholder="Ex: Chave com chaveiro azul"></ion-input></ion-item>
        <ion-item><ion-label position="floating">Onde foi encontrado</ion-label>
          <ion-input [(ngModel)]="novoItem.local_encontrado" placeholder="Ex: Elevador, hall de entrada"></ion-input></ion-item>
        <ion-button expand="block" color="primary" (click)="salvar()" style="margin-top:20px">Registrar</ion-button>
      </ion-content>
    </ng-template>
  </ion-modal>
</ion-content>`,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class AchadosPage implements OnInit {
  itens: any[] = [];
  formularioAberto = false;
  novoItem = { descricao: '', local_encontrado: '' };
  constructor(private api: ApiService, private toastCtrl: ToastController) {}
  ngOnInit() { this.carregar(); }
  carregar() { this.api.getAchados().subscribe({ next: (d) => this.itens = d }); }
  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novoItem = { descricao:'', local_encontrado:'' }; }
  salvar() {
    if (!this.novoItem.descricao) return;
    this.api.criarAchado(this.novoItem).subscribe({
      next: () => { this.fecharFormulario(); this.carregar(); }
    });
  }
  async toast(msg: string, color: string) {
    const t = await this.toastCtrl.create({ message: msg, duration: 2500, color, position: 'top' });
    t.present();
  }
  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 800); }
}


// ──────────────────────────────────────────────────
// FILE: src/app/pages/mural/mural.page.ts
// ──────────────────────────────────────────────────
@Component({
  selector: 'app-mural',
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start"><ion-back-button></ion-back-button></ion-buttons>
    <ion-title>💬 Mural de Recados</ion-title>
    <ion-buttons slot="end">
      <ion-button (click)="abrirFormulario()"><ion-icon name="add-outline"></ion-icon></ion-button>
    </ion-buttons>
  </ion-toolbar>
</ion-header>
<ion-content>
  <ion-refresher slot="fixed" (ionRefresh)="refresh($event)"><ion-refresher-content></ion-refresher-content></ion-refresher>
  <div *ngIf="recados.length === 0" class="empty-state"><div class="empty-icon">💬</div><p>Nenhum recado publicado</p></div>
  <ion-card *ngFor="let r of recados">
    <ion-card-header>
      <ion-card-title>{{ r.titulo || 'Recado' }}</ion-card-title>
      <ion-card-subtitle>{{ r.autor_nome }}{{ r.apartamento ? ' — Apto ' + r.apartamento : '' }} · {{ r.criado_em | date:'dd/MM HH:mm' }}</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>{{ r.conteudo }}</ion-card-content>
  </ion-card>
  <ion-modal [isOpen]="formularioAberto" (didDismiss)="fecharFormulario()">
    <ng-template>
      <ion-header><ion-toolbar><ion-title>Novo Recado</ion-title>
        <ion-buttons slot="end"><ion-button (click)="fecharFormulario()">Cancelar</ion-button></ion-buttons>
      </ion-toolbar></ion-header>
      <ion-content class="ion-padding">
        <ion-item><ion-label position="floating">Título</ion-label>
          <ion-input [(ngModel)]="novoRecado.titulo" placeholder="Ex: Vaga de emprego, achado..."></ion-input></ion-item>
        <ion-item>
          <ion-label position="floating">Categoria</ion-label>
          <ion-select [(ngModel)]="novoRecado.categoria">
            <ion-select-option value="geral">Geral</ion-select-option>
            <ion-select-option value="servico">Serviço / Emprego</ion-select-option>
            <ion-select-option value="venda">Venda / Troca</ion-select-option>
            <ion-select-option value="informacao">Informação</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item><ion-label position="floating">Mensagem *</ion-label>
          <ion-textarea [(ngModel)]="novoRecado.conteudo" rows="5"></ion-textarea></ion-item>
        <ion-button expand="block" color="primary" (click)="salvar()" style="margin-top:20px">Publicar</ion-button>
      </ion-content>
    </ng-template>
  </ion-modal>
</ion-content>`,
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class MuralPage implements OnInit {
  recados: any[] = [];
  formularioAberto = false;
  novoRecado = { titulo: '', conteudo: '', categoria: 'geral' };
  constructor(private api: ApiService) {}
  ngOnInit() { this.carregar(); }
  carregar() { this.api.getMural().subscribe({ next: (d) => this.recados = d }); }
  abrirFormulario() { this.formularioAberto = true; }
  fecharFormulario() { this.formularioAberto = false; this.novoRecado = { titulo:'', conteudo:'', categoria:'geral' }; }
  salvar() {
    if (!this.novoRecado.conteudo) return;
    this.api.criarRecado(this.novoRecado).subscribe({
      next: () => { this.fecharFormulario(); this.carregar(); }
    });
  }
  refresh(e: any) { this.carregar(); setTimeout(() => e.target.complete(), 800); }
}
