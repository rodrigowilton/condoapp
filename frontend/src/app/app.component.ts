import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  template: `<ion-app><router-outlet></router-outlet></ion-app>`,
  standalone: true,
  imports: [IonApp, RouterOutlet],
})
export class AppComponent {}
