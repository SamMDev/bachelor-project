import {ColumnMetadata} from '../model/column-metadata';
import {createReducer, on} from '@ngrx/store';
import * as GdprActions from './gdpr-module.actions';
import {GdprData} from '../model/gdpr-data';
import {GdprRootNodeGrid} from '../model/gdpr-root-node-grid';
import {GdprTableNode} from '../model/gdpr-table-node';
import {deepCopyNode, searchTreeDFS} from '../utils-gdpr-table-node';
import {deepCopyNode as deepCopySearchNode, searchTreeDFS as searchSearchTreeDFS} from '../utils-gdpr-search-tree-node';
import {GdprSearchTreeNode} from '../anonymization/model/gdpr-search-tree-node';
import {GdprAudit} from '../model/gdpr-audit';

export const featureKey = 'gdprModule';

export interface State {
  columnsMetadata: ColumnMetadata[],
  columnMetadataGrouped: { [schema: string]: { [table: string]: string[] } }; // grouped by schema, table and columns
  gdprData: GdprData[],
  gdprDataDetail: GdprData,
  loading: boolean,
  editMode: boolean,
  rootNodes: GdprRootNodeGrid[],
  relationsTree: GdprTableNode,
  searchTreeResult: GdprSearchTreeNode,
  audit: GdprAudit[],
  auditDetail: GdprAudit,
}

export const initState: State = {
  columnsMetadata: undefined,
  columnMetadataGrouped: undefined,
  gdprData: undefined,
  gdprDataDetail: undefined,
  loading: false,
  editMode: false,
  rootNodes: undefined,
  relationsTree: undefined,
  searchTreeResult: undefined,
  audit: undefined,
  auditDetail: undefined,
}

export const reducer = createReducer(
  initState,

  on(GdprActions.editModeEnabled, (state: State) => ({
    ...state,
    editMode: true,
  })),
  on(GdprActions.cancelEditMode, (state: State) => ({
    ...state,
    editMode: false,
    gdprDataDetail: JSON.parse(JSON.stringify(state.gdprDataDetail ?? null)),
  })),
  on(GdprActions.loadAllColumnsSuccess, (state, { data }) => {
    const columnMetadataGrouped = data.reduce((acc, { tableSchema, tableName, columnName }) => {
      acc[tableSchema] = acc[tableSchema] || {};
      acc[tableSchema][tableName] = acc[tableSchema][tableName] || [];
      if (!acc[tableSchema][tableName].includes(columnName)) {
        acc[tableSchema][tableName].push(columnName);
      }
      return acc;
    }, {});

    return {
      ...state,
      columnsMetadata: data,
      columnMetadataGrouped,
    };
  }),
  on(GdprActions.loadGdprDataSuccess, (state: State, {data}) => ({
    ...state,
    gdprData: data,
  })),
  on(GdprActions.selectedGdprData, (state: State, {data}) => ({
    ...state,
    gdprDataDetail: data,
  })),
  on(GdprActions.createGdprData, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.createGdprDataSuccess, (state: State, {data}) => ({
    ...state,
    loading: false,
    editMode: false,
    gdprDataDetail: data,
    gdprData: [...state.gdprData, data],
  })),
  on(GdprActions.createGdprDataFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.updateGdprData, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.updateGdprDataSuccess, (state: State, {data}) => ({
    ...state,
    loading: false,
    editMode: false,
    gdprDataDetail: data,
    gdprData: state.gdprData.map(d => d.id === data.id ? data : d),
  })),
  on(GdprActions.updateGdprDataFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.addClickedGdprData, (state: State) => ({
    ...state,
    gdprDataDetail: {} as GdprData,
    editMode: true,
  })),
  on(GdprActions.cancelAddClickedGdprData, (state: State) => ({
    ...state,
    gdprDataDetail: null,
    editMode: false,
  })),
  on(GdprActions.deleteGdprData, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.deleteGdprDataSuccess, (state: State, {id}) => ({
    ...state,
    loading: false,
    gdprDataDetail: null,
    gdprData: state.gdprData.filter(d => d.id !== id),
  })),
  on(GdprActions.deleteGdprDataFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.onExitDetailPage, (state: State) => ({
    ...state,
    loading: false,
    editMode: false,
    gdprDataDetail: null,
    relationsTree: null,
    searchTreeResult: null,
    audit: null,
    auditDetail: null,
  })),


  on(GdprActions.listRootNodesGridDataSuccess, (state: State, {data}) => ({
    ...state,
    rootNodes: data,
  })),
  on(GdprActions.addRelationsTreeClicked, (state: State) => ({
    ...state,
    editMode: true,
    relationsTree: {
      id: null,
      childNodes: [],
    } as GdprTableNode,
  })),
  on(GdprActions.cancelAddRelationsTreeClicked, (state: State) => ({
    ...state,
    relationsTree: null,
    editMode: false,
  })),
  on(GdprActions.loadRelationTree, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.loadRelationTreeSuccess, (state: State, {tree}) => ({
    // traverse tree and for each node that has parent find parent object reference
    ...state,
    loading: false,
    editMode: false,
    relationsTree: deepCopyNode(tree),
  })),
  on(GdprActions.loadRelationTreeFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.createNewRoot, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.createNewRootSuccess, (state: State, {tree}) => ({
    ...state,
    loading: false,
    editMode: false,
    relationsTree: tree,
    rootNodes: [...state.rootNodes, {...tree}],
  })),
  on(GdprActions.createNewRootFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.editNode, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.editNodeSuccess, (state, { data }) => {
    const tree: GdprTableNode = deepCopyNode(state.relationsTree);
    const editedNode = searchTreeDFS(tree, n => n.id === data.id);
    editedNode.label = data.label;
    editedNode.identificationColumnName = data.identificationColumnName;
    editedNode.conditionsOperator = data.conditionsOperator;
    editedNode.joinConditions = data.joinConditions;
    editedNode.tableName = data.tableName;
    editedNode.schemaName = data.schemaName;
    editedNode.childNodes = data.childNodes;

    return {
      ...state,
      loading: false,
      editMode: false,
      relationsTree: tree,
      rootNodes: state.rootNodes.map(n => n.id === data.id ? data : n),
    };
  }),
  on(GdprActions.editNodeFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.removeRoot, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.removeRootSuccess, (state: State, {id}) => ({
    ...state,
    loading: false,
    editMode: false,
    relationsTree: null,
    rootNodes: state.rootNodes.filter(rn => rn.id !== id),
  })),
  on(GdprActions.removeRootFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.removeNode, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.removeNodeSuccess, (state, { id }) => {
    const tree: GdprTableNode = deepCopyNode(state.relationsTree);

    const removedChild = searchTreeDFS(tree, n => n.id === id);
    if (removedChild) {
      const parent = removedChild.parentNode;
      const indexOfRemovedChild = parent.childNodes.findIndex(cn => cn.id === id);
      parent.childNodes.splice(indexOfRemovedChild, 1);
    }

    return {
      ...state,
      loading: false,
      editMode: false,
      relationsTree: tree,
    };
  }),
  on(GdprActions.removeNodeFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.addNewNode, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.addNewNodeSuccess, (state: State, {data}) => {
    const tree: GdprTableNode = deepCopyNode(state.relationsTree);

    const parent: GdprTableNode = searchTreeDFS(tree, p => p.id === data.parentNodeId);
    const newNode: GdprTableNode = deepCopyNode(data);
    newNode.parentNode = parent;
    if (parent.childNodes) {
      parent.childNodes.push(newNode);
    } else {
      parent.childNodes = [newNode];
    }

    return {
      ...state,
      loading: false,
      editMode: false,
      relationsTree: tree,
    };
  }),
  on(GdprActions.addNewNodeFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.searchData, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.searchDataSuccess, (state: State, {data}) => {
    const tree = deepCopySearchNode(data);

    const stack = [tree];
    while (stack.length > 0) {
      const node = stack.pop();
      if (node.parentUuid) {
        node.parent = searchSearchTreeDFS(tree, p => p.uuid === node.parentUuid);
      }

      node.children?.forEach(n => stack.push(n));
    }

    return {
      ...state,
      loading: false,
      searchTreeResult: tree,
    };
  }),
  on(GdprActions.searchDataFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.anonymize, (state: State) => ({
    ...state,
    loading: true,
  })),
  on(GdprActions.anonymizeSuccess, (state: State) => ({
    ...state,
    loading: false,
    searchTreeResult: null,
  })),
  on(GdprActions.anonymizeFailure, (state: State) => ({
    ...state,
    loading: false,
  })),
  on(GdprActions.listAuditSuccess, (state: State, {data}) => ({
    ...state,
    audit: data,
  })),
  on(GdprActions.selectedAuditDetail, (state: State, {detail}) => ({
    ...state,
    auditDetail: detail,
  })),
  on(GdprActions.closedAuditDetail, (state: State) => ({
    ...state,
    auditDetail: null,
  })),

)


