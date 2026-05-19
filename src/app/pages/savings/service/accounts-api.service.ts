import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AccountTypeV2, SyncStatus } from '../../../domain/account-v2.domain';

/**
 * Wire shape returned by `/api/v1/accounts`. Mirror of server-side
 * `AccountV2Dto`. {@code id} comes as a JSON number (DB BIGINT) but the
 * frontend stringifies it everywhere (consistent with holding/tag ids).
 */
export interface AccountApiDto {
  id: number;
  accountNumber: string | null;
  accountType: AccountTypeV2;
  provider: string | null;
  lastSyncedAt: string | null;
  syncStatus: SyncStatus | null;
  currency: string | null;
  /** ISO 3166-1 alpha-2. Frontend-only until the backend column lands. */
  jurisdiction?: string | null;
}

/** Body of `POST /api/v1/accounts`. */
export interface AccountCreateRequest {
  accountType: AccountTypeV2;
  accountNumber?: string;
  provider?: string;
  currency?: string;
  /** ISO 3166-1 alpha-2 (frontend-only field for Stats Task 3). */
  jurisdiction?: string;
}

/** Body of `PUT /api/v1/accounts/{id}` — every field optional, server applies non-null. */
export interface AccountUpdateRequest {
  accountType?: AccountTypeV2;
  accountNumber?: string;
  provider?: string;
  currency?: string;
  syncStatus?: SyncStatus;
  /** ISO 3166-1 alpha-2 (frontend-only until backend column lands). */
  jurisdiction?: string;
}

/**
 * Thin REST client for the M2 PR6 Accounts API. Split from
 * {@link AccountsService} so any future effects/import flows can
 * consume the wire surface without dragging the store + cache.
 */
@Injectable({ providedIn: 'root' })
export class AccountsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/accounts`;

  list(): Observable<AccountApiDto[]> {
    return this.http.get<AccountApiDto[]>(this.url);
  }

  create(body: AccountCreateRequest): Observable<AccountApiDto> {
    return this.http.post<AccountApiDto>(this.url, body);
  }

  update(id: string, body: AccountUpdateRequest): Observable<AccountApiDto> {
    return this.http.put<AccountApiDto>(`${this.url}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
