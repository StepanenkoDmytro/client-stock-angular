import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Wire shape returned by `/api/v1/holdings` endpoints. Mirrors
 * server-side `HoldingDto`. Subset for now — the frontend stays on its
 * client-side `IHolding` shape for store state; only fields needed for
 * dispatch round-trip through this DTO.
 */
export interface HoldingApiDto {
  id: string;
  instrumentId: string;
  accountId: number | null;
  accountName: string | null;
  accountKind: string | null;
  lockMeta: unknown;
  openedAt: string | null;
  quantity: number;
  averageBuyPrice: number;
  currency: string | null;
  tagIds: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body of `PUT /api/v1/holdings/{id}` — every field optional, server applies non-null. */
export interface HoldingUpdateRequest {
  quantity?: number;
  averageBuyPrice?: number;
  currency?: string;
  accountId?: number;
  notes?: string;
}

/** Body of `POST /api/v1/holdings/{id}/top-up` — both fields required. */
export interface HoldingTopUpRequest {
  addQuantity: number;
  addBuyPrice: number;
}

/** Body of `POST /api/v1/holdings`. */
export interface HoldingCreateRequest {
  instrumentId: string;
  quantity: number;
  averageBuyPrice: number;
  currency?: string;
  openedAt?: string;
  notes?: string;
  accountId?: number;
}

/**
 * Thin REST client for the M2 Holdings API. Owns nothing except HTTP
 * verbs — the broader {@link HoldingService} handles localStorage + store
 * dispatch + seed.
 *
 * <p>Split from `HoldingService` so consumers that only need the wire
 * surface (effects, future imports/exports) don't drag the seed code +
 * Store dependency.
 */
@Injectable({ providedIn: 'root' })
export class HoldingApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/holdings`;

  list(): Observable<HoldingApiDto[]> {
    return this.http.get<HoldingApiDto[]>(this.url);
  }

  create(body: HoldingCreateRequest): Observable<HoldingApiDto> {
    return this.http.post<HoldingApiDto>(this.url, body);
  }

  update(id: string, body: HoldingUpdateRequest): Observable<HoldingApiDto> {
    return this.http.put<HoldingApiDto>(`${this.url}/${id}`, body);
  }

  topUp(id: string, body: HoldingTopUpRequest): Observable<HoldingApiDto> {
    return this.http.post<HoldingApiDto>(`${this.url}/${id}/top-up`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
