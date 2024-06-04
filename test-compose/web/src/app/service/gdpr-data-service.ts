import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GdprData} from '../model/gdpr-data';

@Injectable({
  providedIn: 'root',
})
export class GdprDataService {

  private static readonly apiPrefix = 'gdpr-data-api';


  constructor(
    private http: HttpClient,
  ) {
  }

  list(): Observable<GdprData[]> {
    return this.http.get<GdprData[]>(`${GdprDataService.apiPrefix}`);
  }


  findForTable(schemaName: string, tableName: string): Observable<GdprData[]> {
    const params = new HttpParams().appendAll({
      schemaName: schemaName,
      tableName: tableName,
    });

    return this.http.get<GdprData[]>(`${GdprDataService.apiPrefix}/table`, {params: params});
  }

  createGdprData(data: GdprData): Observable<GdprData> {
    return this.http.post<GdprData>(`${GdprDataService.apiPrefix}`, data);
  }

  updateGdprData(data: GdprData): Observable<GdprData> {
    return this.http.put<GdprData>(`${GdprDataService.apiPrefix}`, data);
  }

  deleteGdprData(id: number): Observable<void> {
    return this.http.delete<void>(`${GdprDataService.apiPrefix}/${id}`);
  }

}
