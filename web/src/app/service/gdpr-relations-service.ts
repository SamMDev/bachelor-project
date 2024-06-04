import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {GdprRootNodeGrid} from '../model/gdpr-root-node-grid';
import {GdprTableNode} from '../model/gdpr-table-node';

@Injectable({
  providedIn: 'root',
})
export class GdprRelationsService {
  private static readonly apiPrefix = 'gdpr-relations-api';

  constructor(
    private http: HttpClient,
  ) {
  }


  listRootNodesGridData(): Observable<GdprRootNodeGrid[]> {
    return this.http.get<GdprRootNodeGrid[]>(`${GdprRelationsService.apiPrefix}/roots`);
  }

  loadRelationTree(rootNodeId: number): Observable<GdprTableNode> {
    return this.http.get<GdprTableNode>(`${GdprRelationsService.apiPrefix}/${rootNodeId}`);
  }

  createNewTree(tree: GdprTableNode): Observable<GdprTableNode> {
    return this.http.put<GdprTableNode>(`${GdprRelationsService.apiPrefix}`, tree);
  }

  addNewNode(node: GdprTableNode): Observable<GdprTableNode> {
    return this.http.put<GdprTableNode>(`${GdprRelationsService.apiPrefix}/node`, node);
  }

  editNode(node: GdprTableNode): Observable<GdprTableNode> {
    return this.http.post<GdprTableNode>(`${GdprRelationsService.apiPrefix}/node`, node);
  }

  removeNode(id: number): Observable<any> {
    return this.http.delete<any>(`${GdprRelationsService.apiPrefix}/node/${id}`);
  }


}
