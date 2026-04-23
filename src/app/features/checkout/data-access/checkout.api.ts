import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ConfirmacionPedidoResponse,
  IniciarCheckoutResponse,
  ProcesarPagoResponse
} from '../../../core/models/api.models';

export interface GuardarEnvioPayload {
  pedidoId: number;
  direccionEnvio: {
    nombreCompleto: string;
    correoElectronico: string;
    telefono: string;
    direccion: string;
    apartamentoInterior: string | null;
    ciudad: string;
    estadoRegion: string;
    codigoPostal: string;
    pais: string;
    referenciaEntrega: string | null;
  };
  mismaDireccionFacturacion: boolean;
}

export interface ProcesarPagoPayload {
  pedidoId: number;
  metodoPago: {
    tipoPago: string;
    nombreTitular?: string;
    numeroTarjeta?: string;
    fechaVencimiento?: string;
    cvv?: string;
  };
  simularFallo: boolean;
}

@Injectable({ providedIn: 'root' })
export class CheckoutApi {
  private readonly api = inject(ApiClient);

  start(): Observable<IniciarCheckoutResponse> {
    return this.api.post<IniciarCheckoutResponse>('/checkout', {});
  }

  saveShipping(payload: GuardarEnvioPayload): Observable<IniciarCheckoutResponse> {
    return this.api.post<IniciarCheckoutResponse>('/checkout/envio', payload);
  }

  pay(payload: ProcesarPagoPayload): Observable<ProcesarPagoResponse> {
    return this.api.post<ProcesarPagoResponse>('/checkout/pago', payload);
  }

  getConfirmation(orderNumber: string): Observable<ConfirmacionPedidoResponse> {
    return this.api.get<ConfirmacionPedidoResponse>(`/checkout/confirmacion/${orderNumber}`);
  }
}
