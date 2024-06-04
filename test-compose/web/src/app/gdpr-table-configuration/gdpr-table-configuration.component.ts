import {Component, HostListener, OnDestroy, OnInit} from '@angular/core';
import {ColDef, GridApi, GridReadyEvent} from 'ag-grid-community';
import {combineLatest, Observable, Subject, takeUntil} from 'rxjs';
import * as GdprSelector from '../store/gdpr-module.selector';
import {Store} from '@ngrx/store';
import * as GdprStore from '../store/gdpr-module.reducer';
import * as GdprAction from '../store/gdpr-module.actions';
import {GdprRootNodeGrid} from '../model/gdpr-root-node-grid';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {GdprTableNode} from '../model/gdpr-table-node';
import {MatDialog} from '@angular/material/dialog';
import {NodeDialogComponent} from './node-dialog/node-dialog.component';
import {NodeDialogData} from './node-dialog/model/node-dialog-data';
import {NodeDialogType} from './node-dialog/model/node-dialog-type';
import {Operator} from '../model/operator';
import {ConfirmationDialogComponent} from '../confirmation-dialog/confirmation-dialog.component';
import {GdprData} from '../model/gdpr-data';


@Component({
  selector: 'app-gdpr-table-configuration',
  templateUrl: './gdpr-table-configuration.component.html',
  styleUrl: './gdpr-table-configuration.component.scss'
})
export class GdprTableConfigurationComponent implements OnInit, OnDestroy {
  treeControl = new NestedTreeControl<GdprTableNode>(node => node.childNodes);
  dataSource = new MatTreeNestedDataSource<GdprTableNode>();

  api: GridApi;
  editMode: boolean;
  destroy$ = new Subject();
  loading$: Observable<boolean>;

  dataTypes: GdprData[];

  // detail
  relationsTree: GdprTableNode;

  rowData: GdprRootNodeGrid[];
  readonly defaultColDef: ColDef = {
    filter: true,
  }
  readonly colDefs: ColDef[] = [
    {
      headerName: 'Názov',
      field: "label",
    },
    {
      headerName: 'Schéma',
      field: "schemaName",
    },
    {
      headerName: 'Tabuľka',
      field: "tableName",
    },

  ];

  constructor(
    private store: Store<GdprStore.State>,
    public dialog: MatDialog,
  ) {
  }

  hasChild = (node: GdprTableNode) => node.childNodes != null && node.childNodes.length > 0;

  ngOnInit(): void {

    combineLatest([
      this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)),
    ]).subscribe(([dataTypes]) => {
      this.dataTypes = dataTypes;
    });

    this.loading$ = this.store.select(GdprSelector.selectLoading).pipe(takeUntil(this.destroy$));

    this.store.select(GdprSelector.selectEditMode).pipe(takeUntil(this.destroy$)).subscribe(editMode => {
      this.editMode = editMode;
    });

    this.store.select(GdprSelector.selectRelationsTree).pipe(takeUntil(this.destroy$)).subscribe(tree => {
      this.relationsTree = tree;
      if (!this.relationsTree) {
        return;
      }

      this.dataSource.data = [this.relationsTree];
      this.treeControl.dataNodes = this.dataSource.data;
      this.treeControl.expandAll();

      if (!this.relationsTree.id) {
        // new relation tree, dialog for creating root
        const dialogRef = this.dialog.open(NodeDialogComponent, {
          data: {
            dialogType: NodeDialogType.CREATE_ROOT,
            node: {
              id: null,
              label: 'Nový zdroj',
              childNodes: [],
            }
          } as NodeDialogData,
          width: '95%',
          height: '70%',
        });
        dialogRef.afterClosed().subscribe(result => {
          if (!result) {
            this.store.dispatch(GdprAction.cancelAddRelationsTreeClicked());
          } else {
            this.store.dispatch(GdprAction.createNewRoot({tree: result}));
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();

    this.store.dispatch(GdprAction.onExitDetailPage());
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.api?.sizeColumnsToFit();
  }

  gridReady(event: GridReadyEvent) {
    this.api = event.api;

    this.api.sizeColumnsToFit();

    this.api.showLoadingOverlay();
    this.store.select(GdprSelector.selectRootNodesGrid).pipe(takeUntil(this.destroy$)).subscribe(gridData => {
      this.rowData = JSON.parse(JSON.stringify(gridData ?? null));
    });
  }

  onRowSelected(event: any) {
    if (event.node.selected) {
      const data: GdprTableNode = event.data;
      this.store.dispatch(GdprAction.loadRelationTree({rootNodeId: data.id}));
    }
  }


  editClicked() {
    this.store.dispatch(GdprAction.editModeEnabled());
  }

  deleteClicked() {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        header: 'Odstránenie konfigurácie',
        content: 'Si si istý, že chceš odstrániť celý konfiguračný strom?',
      },
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.store.dispatch(GdprAction.removeRoot({id: this.relationsTree.id}));
      }
    });
  }

  closeClicked() {
    this.api.deselectAll();
    this.relationsTree = null;
  }

  onAddNode(node: GdprTableNode) {
    const dialogRef = this.dialog.open(NodeDialogComponent, {
      data: {
        dialogType: NodeDialogType.ADD_NODE,
        node: {
          id: null,
          parentNode: node,
          conditionsOperator: Operator.AND,
        },
      } as NodeDialogData,
      width: '95%',
      height: '70%',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      this.store.dispatch(GdprAction.addNewNode({data: result}));
    });
  }

  onDeleteNode(node: GdprTableNode) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        header: 'Odstránenie uzlu z konfigurácie',
        content: 'Si si istý, že chceš odstrániť uzol? Bude odstránený tento uzol a všetky jeho dcérske uzly',
      },
    });

    dialogRef.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.store.dispatch(GdprAction.removeNode({id: node.id}));
      }
    });
  }

  onEditNode(node: GdprTableNode) {
    const dialogRef = this.dialog.open(NodeDialogComponent, {
      data: {
        dialogType: NodeDialogType.EDIT_NODE,
        node: node,
      } as NodeDialogData,
      width: '95%',
      height: '70%',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return
      }

      this.store.dispatch(GdprAction.editNode({data: result}));
    });
  }

  onPreviewNode(node: GdprTableNode) {
    const dialogRef = this.dialog.open(NodeDialogComponent, {
      data: {
        dialogType: NodeDialogType.PREVIEW,
        node: node,
      } as NodeDialogData,
      width: '95%',
      height: '70%',
    });

    dialogRef.afterClosed().subscribe(result => {
    });
  }

  cancelClicked() {
    if (this.relationsTree.id) {
      // cancel edit existing
      this.store.dispatch(GdprAction.cancelEditMode());
    } else {
      // cancel adding new
      this.store.dispatch(GdprAction.cancelAddRelationsTreeClicked());
    }
  }

  saveClicked() {
    this.store.dispatch(GdprAction.cancelEditMode());
  }

  addClicked() {
    this.store.dispatch(GdprAction.addRelationsTreeClicked());
  }
}
