import {createFeatureSelector, createSelector} from '@ngrx/store';
import {featureKey, State} from './gdpr-module.reducer';

const selectFeature = createFeatureSelector<State>(featureKey);


export const selectColumnsMetadata = createSelector(
  selectFeature,
  (state: State) => state.columnsMetadata,
);
export const selectColumnsMetadataGrouped = createSelector(
  selectFeature,
  (state: State) => state.columnMetadataGrouped,
);
export const selectGdprData = createSelector(
  selectFeature,
  (state: State) => state.gdprData,
);
export const selectGdprDataDetail = createSelector(
  selectFeature,
  (state: State) => state.gdprDataDetail,
);
export const selectLoading = createSelector(
  selectFeature,
  (state: State) => state.loading,
);
export const selectEditMode = createSelector(
  selectFeature,
  (state: State) => state.editMode,
);

export const selectRootNodesGrid = createSelector(
  selectFeature,
  (state: State) => state.rootNodes,
);
export const selectRelationsTree = createSelector(
  selectFeature,
  (state: State) => state.relationsTree,
);
export const selectSearchResultTree = createSelector(
  selectFeature,
  (state: State) => state.searchTreeResult,
);
export const selectAudit = createSelector(
  selectFeature,
  (state: State) => state.audit,
);
export const selectAuditDetail = createSelector(
  selectFeature,
  (state: State) => state.auditDetail,
);
