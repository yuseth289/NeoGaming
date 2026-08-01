import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Gamepad2, Instagram, LucideAngularModule, Send, Twitter, Youtube } from 'lucide-angular';
import { NeoButtonComponent, NeoInputComponent } from '../../../shared/ui';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, LucideAngularModule, NeoInputComponent, NeoButtonComponent],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  protected readonly icons = {
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube,
    discord: Gamepad2,
    send: Send,
  };

  protected submitNewsletter(event: Event): void {
    event.preventDefault();
    // TODO: conectar el newsletter al backend cuando exista el contrato.
  }
}
