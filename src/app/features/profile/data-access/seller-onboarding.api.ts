import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/http/api-client/api-client.service';
import { ConvertirVendedorRequest, VendedorResponse } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class SellerOnboardingApi {
  private readonly api = inject(ApiClient);

  activate(payload: ConvertirVendedorRequest): Observable<VendedorResponse> {
    return this.api.post<VendedorResponse>('/usuarios/convertir-vendedor', payload);
  }
}
