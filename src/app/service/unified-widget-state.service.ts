import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IWidgetState } from '../domain/widget.domain';
import { MNY_WIDGET_DEFAULT, STOCK_WIDGET_DEFAULT } from '../domain/default-widget-state.domain';


interface CreateResponse {
  name: string
}

interface IWidgetResponse {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UnifiedWidgetStateService {
  static url = 'https://widget-state-default-rtdb.firebaseio.com/widget-state';

  constructor(private http: HttpClient) { }

  public create(): Observable<IWidgetState> {
    return this.http
      .post<CreateResponse>(`${UnifiedWidgetStateService.url}/${MNY_WIDGET_DEFAULT.nameWidget}.json`, MNY_WIDGET_DEFAULT)
      .pipe(
        map(res => {
          return { ...MNY_WIDGET_DEFAULT, id: res.name }
        }));
  }

  public loadState(_nameWidget: string): Observable<IWidgetState> {
    return this.http
      .get<IWidgetState>(`${UnifiedWidgetStateService.url}/${_nameWidget}.json`)
      .pipe(
        map((state: IWidgetResponse) => {
          if (!state) {
            throw new Error(`Unknown namewidget ${_nameWidget}`);
          }
          const id = Object.keys(state)[0];
          const nameWidget = state[id].nameWidget;
          const primary = state[id].primary;
          const work = state[id].work;

          return {
            id,
            nameWidget,
            primary,
            work,
          }}));
  }

  public updateState(widgetState: IWidgetState): Observable<IWidgetState> {
    const id = widgetState.id;
    if (!id) {
      throw new Error('widgetState має містити ідентифікатор (id)');
    }
    const { id: _, ...stateWithoutId } = widgetState;
    return this.http
      .put<any>(`${UnifiedWidgetStateService.url}/${widgetState.nameWidget}/${widgetState.id}.json`, stateWithoutId);
  }
}
