import {createAction, props} from '@ngrx/store';
import {ColumnMetadata} from '../model/column-metadata';
import {GdprData} from '../model/gdpr-data';
import {GdprRootNodeGrid} from '../model/gdpr-root-node-grid';
import {GdprTableNode} from '../model/gdpr-table-node';
import {GdprSearchTreeRequest} from '../anonymization/model/gdpr-search-tree-request';
import {GdprSearchTreeNode} from '../anonymization/model/gdpr-search-tree-node';
import {GdprAudit} from '../model/gdpr-audit';


export const loadAllColumns = createAction(
  '[Gdpr data] Load all columns',
);

export const loadAllColumnsSuccess = createAction(
  '[Gdpr data] Load all columns success',
  props<{ data: ColumnMetadata[] }>(),
);

export const loadAllColumnsFailure = createAction(
  '[Gdpr data] Load all columns failure',
  props<{ error: any }>(),
);

export const loadGdprData = createAction(
  '[Gdpr data] Load gdpr data',
);
export const loadGdprDataSuccess = createAction(
  '[Gdpr data] Load gdpr data success',
  props<{ data: GdprData[] }>()
);
export const loadGdprDataFailure = createAction(
  '[Gdpr data] Load gdpr data failure',
  props<{ error: any }>(),
);
export const selectedGdprData = createAction(
  '[Gdpr data] selected gdpr data',
  props<{ data: GdprData }>(),
);
export const createGdprData = createAction(
  '[Gdpr data] Create gdpr data',
  props<{ data: GdprData }>(),
);
export const createGdprDataSuccess = createAction(
  '[Gdpr data] Create gdpr data success',
  props<{ data: GdprData }>(),
);
export const createGdprDataFailure = createAction(
  '[Gdpr data] Create gdpr data failure',
  props<{ error: any }>(),
);

export const updateGdprData = createAction(
  '[Gdpr data] Update gdpr data',
  props<{ data: GdprData }>(),
);
export const updateGdprDataSuccess = createAction(
  '[Gdpr data] Update gdpr data success',
  props<{ data: GdprData }>(),
);
export const updateGdprDataFailure = createAction(
  '[Gdpr data] Update gdpr data failure',
  props<{ error: any }>(),
);
export const editModeEnabled = createAction(
  '[Gdpr data] Edit mode enabled',
);
export const cancelEditMode = createAction(
  '[Gdpr data] Cancel edit mode',
);
export const addClickedGdprData = createAction(
  '[Gdpr data] Add clicked gdpr data'
);
export const cancelAddClickedGdprData = createAction(
  '[Gdpr data] Cancel ddd clicked gdpr data'
);
export const deleteGdprData = createAction(
  '[Gdpr data] Delete gdpr data',
  props<{ id: number }>(),
);
export const deleteGdprDataSuccess = createAction(
  '[Gdpr data] Delete gdpr data success',
  props<{ id: number }>(),
);
export const deleteGdprDataFailure = createAction(
  '[Gdpr data] Delete gdpr data failure',
  props<{ error: any }>(),
);
export const onExitDetailPage = createAction(
  '[Gdpr data] On exit detail page',
);
export const listRootNodesGridData = createAction(
  '[Gdpr relations] List root nodes grid data'
);
export const listRootNodesGridDataSuccess = createAction(
  '[Gdpr relations] List root nodes grid data success',
  props<{ data: GdprRootNodeGrid[] }>(),
);
export const listRootNodesGridDataFailure = createAction(
  '[Gdpr relations] List root nodes grid data failure',
  props<{ error: any }>(),
);
export const loadRelationTree = createAction(
  '[Gdpr relations] Load relation tree',
  props<{ rootNodeId: number }>()
);
export const loadRelationTreeSuccess = createAction(
  '[Gdpr relations] Load relation tree success',
  props<{ tree: GdprTableNode }>()
);
export const loadRelationTreeFailure = createAction(
  '[Gdpr relations] Load relation tree failure',
  props<{ error: any }>(),
);
export const addRelationsTreeClicked = createAction(
  '[Gdpr relations] Add relation tree clicked'
);
export const cancelAddRelationsTreeClicked = createAction(
  '[Gdpr relations] Cancel add relation tree clicked'
);
export const createNewRoot = createAction(
  '[Gdpr relations] Create new root',
  props<{ tree: GdprTableNode }>()
);
export const createNewRootSuccess = createAction(
  '[Gdpr relations] Create new root success',
  props<{ tree: GdprTableNode }>()
);
export const createNewRootFailure = createAction(
  '[Gdpr relations] Create new root failure',
  props<{ error: any }>(),
);
export const editNode = createAction(
  '[Gdpr relations] Edit node',
  props<{ data: GdprTableNode }>()
);
export const editNodeSuccess = createAction(
  '[Gdpr relations] Edit node success',
  props<{ data: GdprTableNode }>()
);
export const editNodeFailure = createAction(
  '[Gdpr relations] Edit node failure',
  props<{ error: any }>(),
);
export const removeNode = createAction(
  '[Gdpr relations] Remove node',
  props<{ id: number }>()
);
export const removeNodeSuccess = createAction(
  '[Gdpr relations] Remove node success',
  props<{ id: number }>()
);
export const removeNodeFailure = createAction(
  '[Gdpr relations] Remove node failure',
  props<{ error: any }>(),
);
export const removeRoot = createAction(
  '[Gdpr relations] Remove root',
  props<{ id: number }>()
);
export const removeRootSuccess = createAction(
  '[Gdpr relations] Remove root success',
  props<{ id: number }>()
);
export const removeRootFailure = createAction(
  '[Gdpr relations] Remove root failure',
  props<{ error: any }>(),
);
export const addNewNode = createAction(
  '[Gdpr relations] Add new node',
  props<{ data: GdprTableNode }>()
);
export const addNewNodeSuccess = createAction(
  '[Gdpr relations] Add new node success',
  props<{ data: GdprTableNode }>()
);
export const addNewNodeFailure = createAction(
  '[Gdpr relations] Add new node failure',
  props<{ error: any }>(),
);

export const searchData = createAction(
  '[Gdpr anonymization] Search data',
  props<{ request: GdprSearchTreeRequest }>()
);
export const searchDataSuccess = createAction(
  '[Gdpr anonymization] Search data success',
  props<{ data: GdprSearchTreeNode }>()
);
export const searchDataFailure = createAction(
  '[Gdpr anonymization] Search data failure',
  props<{ error: any }>(),
);
export const anonymize = createAction(
  '[Gdpr anonymization] Anonymize',
  props<{ searchTreeCriteria: GdprSearchTreeRequest, chosenData: GdprSearchTreeNode }>(),
);
export const anonymizeSuccess = createAction(
  '[Gdpr anonymization] Anonymize success',
);
export const anonymizeFailure = createAction(
  '[Gdpr anonymization] Anonymize failure',
  props<{ error: any }>(),
);
export const listAudit = createAction(
  '[Gdpr audit] List'
);
export const listAuditSuccess = createAction(
  '[Gdpr audit] List success',
  props<{ data: GdprAudit[] }>()
);
export const listAuditFailure = createAction(
  '[Gdpr audit] List failure',
  props<{ error: any }>(),
);
export const selectedAuditDetail = createAction(
  '[Gdpr audit] Selected detail',
  props<{ detail: GdprAudit }>()
);
export const closedAuditDetail = createAction(
  '[Gdpr audit] Closed detail'
);
