import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ColumnMetadata} from '../model/column-metadata';

@Injectable({
  providedIn: 'root',
})
export class DbMetadataService {

  private static readonly apiPrefix = 'db-metadata-api';

  constructor(
    private http: HttpClient,
  ) {
  }


  listColumns(): Observable<ColumnMetadata[]> {
    return this.http.get<ColumnMetadata[]>(`${DbMetadataService.apiPrefix}/columns`);
  }


}
