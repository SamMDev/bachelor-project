import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GdprSearchTreeNode} from '../anonymization/model/gdpr-search-tree-node';
import {GdprSearchTreeRequest} from '../anonymization/model/gdpr-search-tree-request';

@Injectable({
  providedIn: 'root',
})
export class GdprAnonymizationService {
  private static readonly apiPrefix = 'gdpr-anonymization-api';

  constructor(
    private http: HttpClient,
  ) {
  }

  searchData(request: any): Observable<GdprSearchTreeNode> {
    return this.http.post<GdprSearchTreeNode>(`${GdprAnonymizationService.apiPrefix}/search`, request);
  }

  anonymize(searchTreeCriteria: GdprSearchTreeRequest, chosenData: GdprSearchTreeNode): Observable<void> {
    return this.http.post<void>(`${GdprAnonymizationService.apiPrefix}/anonymize`, {searchTreeCriteria: searchTreeCriteria, chosenData: chosenData});
  }

  generateAnonymizationQueryPreview(searchTreeCriteria: GdprSearchTreeRequest, chosenData: GdprSearchTreeNode): Observable<string[]> {
    return this.http.post<string[]>(`${GdprAnonymizationService.apiPrefix}/anonymize-preview`, {searchTreeCriteria: searchTreeCriteria, chosenData: chosenData});
  }

  anonymizeAll(gdprDataIds: number[]): Observable<void> {
    return this.http.post<void>(`${GdprAnonymizationService.apiPrefix}/anonymize-all`, gdprDataIds);
  }

  anonymizeAllPreview(gdprDataIds: number[]): Observable<{[key: number]: string[]}> {
    return this.http.post<{[key: number]: string[]}>(`${GdprAnonymizationService.apiPrefix}/anonymize-all-preview`, gdprDataIds);
  }

}
