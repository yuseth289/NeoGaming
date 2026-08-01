import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NeoToastComponent } from './shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NeoToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
