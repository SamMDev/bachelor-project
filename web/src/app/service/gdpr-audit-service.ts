import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GdprAudit} from '../model/gdpr-audit';


@Injectable({
  providedIn: 'root',
})
export class GdprAuditService {
  private static readonly apiPrefix = 'gdpr-audit-api';

  constructor(
    private http: HttpClient,
  ) {
  }

  list(): Observable<GdprAudit[]> {
    return this.http.get<GdprAudit[]>(`${GdprAuditService.apiPrefix}`);
  }
}
