import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink],
  template: `
    <section class="page-head">
      <h1>Acceso denegado</h1>
      <p>No tienes permisos para acceder a esta seccion.</p>
      <a routerLink="/">Volver al inicio</a>
    </section>
  `
})
export class ForbiddenComponent {}
