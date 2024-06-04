import {Component, OnDestroy, OnInit} from '@angular/core';
import * as GdprAction from '../store/gdpr-module.actions';
import {Subject, takeUntil, combineLatest, Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import * as GdprStore from '../store/gdpr-module.reducer';
import {AbstractControl, FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import * as GdprSelector from '../store/gdpr-module.selector';
import {GdprRootNodeGrid} from '../model/gdpr-root-node-grid';
import {GdprData} from '../model/gdpr-data';
import {ColumnMetadata} from '../model/column-metadata';
import {ColumnType} from '../model/column-type';
import {GdprColumnView} from '../model/gdpr-column-view';
import {FlatTreeControl, NestedTreeControl} from '@angular/cdk/tree';
import {GdprSearchTreeNode} from './model/gdpr-search-tree-node';
import {MatTreeFlatDataSource, MatTreeFlattener, MatTreeNestedDataSource} from '@angular/material/tree';
import {deepCopyNode, modifyTreeDFS, searchTreeDFS} from '../utils-gdpr-search-tree-node';
import {NotificationService} from '../notifications/notification-service';
import {findGdprDataOfTable} from '../utils';
import {GdprSearchTreeRequest} from './model/gdpr-search-tree-request';
import {
  ConfirmAnonymizationDialogComponent
} from './confirm-anonymization-dialog/confirm-anonymization-dialog.component';

/**
 * Additional wrapper around node for material ui flat tree
 */
interface FlatNode {
  // additional data
  expandable: boolean;
  name: string;
  level: number;
  isCheckboxDisabled: boolean;

  // original node itself
  searchNode: GdprSearchTreeNode;
}

@Component({
  selector: 'app-anonymization',
  templateUrl: './anonymization.component.html',
  styleUrl: './anonymization.component.scss'
})
export class AnonymizationComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  loading$: Observable<boolean>;

  // *********************************************** TREE PROPERTIES ***********************************************//
  searchTreeRequest: GdprSearchTreeRequest;
  searchTree: GdprSearchTreeNode;
  private _transformer = (node: GdprSearchTreeNode, level: number) => {
    if (node.isDataNode) {
      return {
        expandable: node.children?.length > 0,
        name: this.getDataNodeLabel(node),
        level: level,
        isCheckboxDisabled: this.isNodeCheckboxDisabled(node),

        searchNode: node,
      } as FlatNode;
    } else {
      return {
        expandable: node.children?.length > 0,
        name: this.getStructureNodeLabel(node),
        level: level,
        isCheckboxDisabled: true,

        searchNode: node,
      } as FlatNode;
    }
  };
  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable,
  );
  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  // ***************************************************************************************************************//


  formGroup: FormGroup;

  dataTypes: GdprData[];
  dataSources: GdprRootNodeGrid[];

  columnMetadata: ColumnMetadata[];


  dataSourceDataTypes: GdprData[];

  constructor(
    private store: Store<GdprStore.State>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private notificationService: NotificationService,
  ) {
  }


  ngOnInit(): void {

    combineLatest([
      this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)),
      this.store.select(GdprSelector.selectRootNodesGrid).pipe(takeUntil(this.destroy$)),
      this.store.select(GdprSelector.selectColumnsMetadata).pipe(takeUntil(this.destroy$)),
    ]).subscribe(([dataTypes, dataSources, columnMetadata]) => {
      this.dataTypes = dataTypes;
      this.dataSources = dataSources;
      this.columnMetadata = columnMetadata;

      this.createFormGroup();
    });

    this.loading$ = this.store.select(GdprSelector.selectLoading).pipe(takeUntil(this.destroy$));

    this.store.select(GdprSelector.selectSearchResultTree).pipe(takeUntil(this.destroy$)).subscribe(tree => {
      this.searchTree = deepCopyNode(tree);
      if (!tree) {
        return;
      }

      this.dataSource.data = [this.searchTree];
    });
  }

  anonymize() {
    const anySelectedNode = searchTreeDFS(this.searchTree, n => n.isDataNode && n.isSelected);
    if (!anySelectedNode) {
      this.notificationService.warning('Pre spustenie anonymizácie je potrebné vybrať aspoň jeden cieľ');
      return;
    }

    const requestTree = deepCopyNode(this.searchTree);
    modifyTreeDFS(requestTree, null, node => node.parent = null);

    const dialogRef = this.dialog.open(ConfirmAnonymizationDialogComponent, {
      data: {
        requestTree: requestTree,
        searchTreeRequest: this.searchTreeRequest,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.store.dispatch(GdprAction.anonymize({searchTreeCriteria: this.searchTreeRequest, chosenData: requestTree}));
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();

    this.store.dispatch(GdprAction.onExitDetailPage());
  }

  isNodeCheckboxDisabled(node: GdprSearchTreeNode) {
    if (!node.isDataNode) {
      return true;
    }
    if (!node.dataId) {
      return true;
    }

    const parent = node.parent;
    const gdprData = findGdprDataOfTable(this.dataTypes, parent.node.schemaName, parent.node.tableName);
    // const hasGdprData = parent.node.gdprData.some(t => t.columns.some(c => c.tableSchema === parent.node.schemaName && c.tableName === parent.node.tableName));
    return !gdprData || gdprData.length == 0;
  }

  getStructureNodeLabel(node: GdprSearchTreeNode) {
    return `${node.node.label} (${node.node.schemaName}.${node.node.tableName})`;
  }

  getDataNodeLabel(node: GdprSearchTreeNode) {
    const parent = node.parent;
    const parentGdprDataTypes = findGdprDataOfTable(this.dataTypes, parent.node.schemaName, parent.node.tableName);

    let label = `Id záznamu (${parent.node.schemaName}.${parent.node.tableName}.${parent.node.identificationColumnName}): ${node.data[parent.node.identificationColumnName]}, `;
    if (this.isNodeCheckboxDisabled(node)) {
      return label + 'Neobsahuje osobné údaje';
    } else {
      parentGdprDataTypes.forEach(t => {

        const cols = t.columns.filter(c => c.tableSchema === parent.node.schemaName && c.tableName === parent.node.tableName); // only one gdpr data type for one table
        if (cols.length > 0) {
          const col = cols[0];
          label += `${t.name} (${col.columnName}): ${node.data[col.columnName]}, `;
        }
      })

      return label;
    }
  }

  search() {
    if (!this.dataTypesFormArray.controls.some(c => c.get('value').value)) {
      this.notificationService.warning('Je potrebné vyplniť aspoň jeden atribút vyhľadávania fyzickej osoby');
      return;
    }

    this.searchTreeRequest = this.formGroup.getRawValue();
    this.store.dispatch(GdprAction.searchData({request: this.searchTreeRequest}));
  }

  get dataTypesFormArray(): FormArray {
    return this.formGroup.get('dataTypes') as FormArray;
  }

  toFg(control: AbstractControl): FormGroup {
    return control as FormGroup;
  }

  selectNodes(selectValue: boolean) {
    if (!this.searchTree) {
      return;
    }

    modifyTreeDFS(this.searchTree, node => !this.isNodeCheckboxDisabled(node), node => node.isSelected = selectValue);
    this.treeControl.expandAll();
  }

  private createFormGroup() {
    this.formGroup = this.fb.group({
      dataSourceId: [null],

      dataTypes: this.fb.array([]),
    });


    this.formGroup.get('dataSourceId').valueChanges.pipe(takeUntil(this.destroy$)).subscribe(dataSourceId => {
      this.dataSourceDataTypes = null;
      this.searchTree = null;
      if (!dataSourceId) {
        this.formGroup.reset({}, {emitEvent: false, onlySelf: true});
        return;
      }

      const chosenDataSource = this.dataSources.find(c => c.id === dataSourceId);

      this.dataSourceDataTypes = this.dataTypes.filter(dt => dt.columns.some(col => col.tableSchema == chosenDataSource.schemaName && col.tableName == chosenDataSource.tableName));
      const dataTypesFormArray: FormArray = this.dataTypesFormArray;
      dataTypesFormArray.clear();
      this.dataSourceDataTypes.forEach(gdprDataType => {
        const gdprDataTypeCol: GdprColumnView = gdprDataType.columns.filter(c => c.tableSchema == chosenDataSource.schemaName && c.tableName == chosenDataSource.tableName)[0];

        const fg = this.createDataTypeFg();
        fg.patchValue({
          ...gdprDataType,
          columnType: gdprDataTypeCol.dataType,
        });
        dataTypesFormArray.push(fg);
      })
    })
  }

  private createDataTypeFg(): FormGroup {
    return this.fb.group({
      id: [null, [Validators.required]],
      name: [null, [Validators.required]],
      columnType: [null],
      value: [null],
    });
  }


  public readonly ColumnType = ColumnType;
}
