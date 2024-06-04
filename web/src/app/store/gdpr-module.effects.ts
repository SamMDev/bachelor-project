import {Injectable} from '@angular/core';
import {of} from "rxjs";
import {catchError, map, mergeMap} from "rxjs/operators";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import * as GdprActions from './gdpr-module.actions';
import {DbMetadataService} from '../service/db-metadata-service';
import {GdprDataService} from '../service/gdpr-data-service';
import {Store} from '@ngrx/store';
import * as GdprStore from './gdpr-module.reducer';
import {NotificationService} from '../notifications/notification-service';
import {NotificationMessage} from '../notifications/notification-message';
import {GdprRelationsService} from '../service/gdpr-relations-service';
import {GdprAnonymizationService} from '../service/gdpr-anonymization-service';
import {GdprAuditService} from '../service/gdpr-audit-service';

@Injectable()
export class GdprModuleEffects {

  constructor(
    private actions$: Actions,
    private dbMetadataService: DbMetadataService,
    private gdprDataService: GdprDataService,
    private gdprRelationsService: GdprRelationsService,
    private store: Store<GdprStore.State>,
    private notificationService: NotificationService,
    private gdprAnonymizationService: GdprAnonymizationService,
    private gdprAuditService: GdprAuditService,
  ) {

  }

  loadAllColumns$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.loadAllColumns),
    mergeMap(() => this.dbMetadataService.listColumns().pipe(
      map(res => {
        return GdprActions.loadAllColumnsSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.loadAllColumnsFailure({error: error}))
      })
    ))
  ));

  loadGdprData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.loadGdprData),
    mergeMap(() => this.gdprDataService.list().pipe(
      map(res => {
        return GdprActions.loadGdprDataSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.loadGdprDataFailure({error: error}))
      })
    ))
  ));

  createGdprData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.createGdprData),
    mergeMap((action) => this.gdprDataService.createGdprData(action.data).pipe(
      map(data => {
        this.notificationService.success(NotificationMessage.CREATE_SUCCESS);
        return GdprActions.createGdprDataSuccess({ data })
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.CREATE_FAILURE);
        return of(GdprActions.createGdprDataFailure({ error }))
      })
    ))
  ));

  updateGdprData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.updateGdprData),
    mergeMap((action) => this.gdprDataService.updateGdprData(action.data).pipe(
      map(data => {
        this.notificationService.success(NotificationMessage.UPDATE_SUCCESS);
        return GdprActions.updateGdprDataSuccess({ data })
      }),
      catchError(error => {
        this.notificationService.success(NotificationMessage.UPDATE_FAILURE);
        return of(GdprActions.updateGdprDataFailure({ error }))
      })
    ))
  ));

  deleteGdprData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.deleteGdprData),
    mergeMap((action) => this.gdprDataService.deleteGdprData(action.id).pipe(
      map(() => {
        this.notificationService.success(NotificationMessage.DELETE_SUCCESS);
        return GdprActions.deleteGdprDataSuccess({ id: action.id })
      }),
      catchError(error => {
        this.notificationService.success(NotificationMessage.DELETE_FAILURE);
        return of(GdprActions.deleteGdprDataFailure({ error }))
      })
    ))
  ));

  listRootNodesGridData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.listRootNodesGridData),
    mergeMap(() => this.gdprRelationsService.listRootNodesGridData().pipe(
      map(res => {
        return GdprActions.listRootNodesGridDataSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.listRootNodesGridDataFailure({error: error}))
      })
    ))
  ));

  loadRelationsTree$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.loadRelationTree),
    mergeMap((action) => this.gdprRelationsService.loadRelationTree(action.rootNodeId).pipe(
      map(res => {
        return GdprActions.loadRelationTreeSuccess({tree: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.loadRelationTreeFailure({error: error}))
      })
    ))
  ));

  createNewRoot$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.createNewRoot),
    mergeMap((action) => this.gdprRelationsService.createNewTree(action.tree).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.CREATE_SUCCESS);
        return GdprActions.createNewRootSuccess({tree: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.CREATE_FAILURE);
        return of(GdprActions.createNewRootFailure({error: error}))
      })
    ))
  ));

  editNode$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.editNode),
    mergeMap((action) => this.gdprRelationsService.editNode(action.data).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.CREATE_SUCCESS);
        return GdprActions.editNodeSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.CREATE_FAILURE);
        return of(GdprActions.editNodeFailure({error: error}))
      })
    ))
  ));

  removeNode$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.removeNode),
    mergeMap((action) => this.gdprRelationsService.removeNode(action.id).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.DELETE_SUCCESS);
        return GdprActions.removeNodeSuccess({id: action.id});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.DELETE_FAILURE);
        return of(GdprActions.removeNodeFailure({error: error}))
      })
    ))
  ));

  removeRoot$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.removeRoot),
    mergeMap((action) => this.gdprRelationsService.removeNode(action.id).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.DELETE_SUCCESS);
        return GdprActions.removeRootSuccess({id: action.id});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.DELETE_FAILURE);
        return of(GdprActions.removeRootFailure({error: error}))
      })
    ))
  ));

  addNewNode$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.addNewNode),
    mergeMap((action) => this.gdprRelationsService.addNewNode(action.data).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.CREATE_SUCCESS);
        return GdprActions.addNewNodeSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.CREATE_FAILURE);
        return of(GdprActions.addNewNodeFailure({error: error}))
      })
    ))
  ));

  searchData$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.searchData),
    mergeMap((action) => this.gdprAnonymizationService.searchData(action.request).pipe(
      map(res => {
        return GdprActions.searchDataSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.searchDataFailure({error: error}))
      })
    ))
  ));

  anonymize$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.anonymize),
    mergeMap((action) => this.gdprAnonymizationService.anonymize(action.searchTreeCriteria, action.chosenData).pipe(
      map(res => {
        this.notificationService.success(NotificationMessage.UPDATE_SUCCESS);
        return GdprActions.anonymizeSuccess();
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.UPDATE_FAILURE);
        return of(GdprActions.anonymizeFailure({error: error}))
      })
    ))
  ));

  listAudit$ = createEffect(() => this.actions$.pipe(
    ofType(GdprActions.listAudit),
    mergeMap((action) => this.gdprAuditService.list().pipe(
      map(res => {
        return GdprActions.listAuditSuccess({data: res});
      }),
      catchError(error => {
        this.notificationService.failure(NotificationMessage.LOAD_FAILURE);
        return of(GdprActions.listAuditFailure({error: error}))
      })
    ))
  ));
}
