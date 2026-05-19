import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

/**
 * Wire shape returned by `/api/v1/tags` endpoints. Mirrors server-side
 * `TagDto` (see `server/src/main/java/com/stock/dto/tag/TagDto.java`).
 *
 * <p>{@code userId} is a Long on the server but arrives as a JSON number
 * — the frontend store keys on `string` everywhere (`ITag.id`) and
 * doesn't expose owner ids in the UI, so we don't bother re-stringifying.
 */
export interface TagApiDto {
  id: string;
  name: string;
  parentId: string | null;
  color: string | null;
  system: boolean;
  userId: number | null;
  createdAt: string;
}

/** Body of `POST /api/v1/tags`. */
export interface TagCreateRequest {
  name: string;
  parentId?: string;
  color?: string;
}

/** Body of `PUT /api/v1/tags/{id}`. Every field optional; null is "unchanged". */
export interface TagUpdateRequest {
  name?: string;
  parentId?: string;
  color?: string;
}

/**
 * Thin REST client for the M2 Tags API. Owns nothing except HTTP
 * verbs — {@link TagsService} handles store hydration + localStorage
 * cache + reducer dispatch.
 *
 * <p>Split from `TagsService` so future {@code TagsEffects} (NgRx)
 * can consume the wire surface without dragging the store dependency.
 */
@Injectable({ providedIn: 'root' })
export class TagsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/tags`;

  list(): Observable<TagApiDto[]> {
    return this.http.get<TagApiDto[]>(this.url);
  }

  create(body: TagCreateRequest): Observable<TagApiDto> {
    return this.http.post<TagApiDto>(this.url, body);
  }

  update(id: string, body: TagUpdateRequest): Observable<TagApiDto> {
    return this.http.put<TagApiDto>(`${this.url}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
