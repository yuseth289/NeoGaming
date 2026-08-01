import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import {
  ActualizarDireccionRequest,
  ActualizarPerfilUsuarioRequest,
  CrearDireccionRequest,
  DireccionUsuarioResponse,
  PerfilUsuarioResponse
} from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly api = inject(ApiClient);

  getProfile(): Observable<PerfilUsuarioResponse> {
    return this.api.get<PerfilUsuarioResponse>('/usuarios/perfil');
  }

  updateProfile(payload: ActualizarPerfilUsuarioRequest): Observable<PerfilUsuarioResponse> {
    return this.api.put<PerfilUsuarioResponse>('/usuarios/perfil', payload);
  }

  getAddresses(): Observable<DireccionUsuarioResponse[]> {
    return this.api.get<DireccionUsuarioResponse[]>('/usuarios/direcciones');
  }

  createAddress(payload: CrearDireccionRequest): Observable<DireccionUsuarioResponse> {
    return this.api.post<DireccionUsuarioResponse>('/usuarios/direcciones', payload);
  }

  updateAddress(id: number, payload: ActualizarDireccionRequest): Observable<DireccionUsuarioResponse> {
    return this.api.put<DireccionUsuarioResponse>(`/usuarios/direcciones/${id}`, payload);
  }

  deleteAddress(id: number): Observable<void> {
    return this.api.delete<void>(`/usuarios/direcciones/${id}`);
  }

  setDefaultAddress(id: number): Observable<DireccionUsuarioResponse> {
    return this.api.patch<DireccionUsuarioResponse>(`/usuarios/direcciones/${id}/principal`, {});
  }
}
