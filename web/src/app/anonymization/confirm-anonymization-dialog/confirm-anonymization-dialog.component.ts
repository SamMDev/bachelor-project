import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {GdprAnonymizationService} from '../../service/gdpr-anonymization-service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {GdprSearchTreeRequest} from '../model/gdpr-search-tree-request';
import {GdprSearchTreeNode} from '../model/gdpr-search-tree-node';

@Component({
  selector: 'app-confirm-anonymization-dialog',
  templateUrl: './confirm-anonymization-dialog.component.html',
  styleUrl: './confirm-anonymization-dialog.component.scss'
})
export class ConfirmAnonymizationDialogComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();

  sqlPreview: string[];

  constructor(
    public dialogRef: MatDialogRef<ConfirmAnonymizationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {requestTree: GdprSearchTreeNode, searchTreeRequest: GdprSearchTreeRequest},
    private service: GdprAnonymizationService,
  ) {
  }

  ngOnInit(): void {
    this.service.generateAnonymizationQueryPreview(this.data.searchTreeRequest, this.data.requestTree).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.sqlPreview = res;
    });
  }

  onClick(result: boolean): void {
    this.dialogRef.close(result);
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

}
