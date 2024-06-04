import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {GdprAnonymizationService} from '../../service/gdpr-anonymization-service';
import * as GdprSelector from '../../store/gdpr-module.selector';
import {Store} from '@ngrx/store';
import * as GdprStore from '../../store/gdpr-module.reducer';
import {GdprData} from '../../model/gdpr-data';

@Component({
  selector: 'app-anonymization-all-confirm-dialog',
  templateUrl: './anonymization-all-confirm-dialog.component.html',
  styleUrl: './anonymization-all-confirm-dialog.component.scss'
})
export class AnonymizationAllConfirmDialogComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  sqlPreview: {[key: number]: string[]};
  dataTypes: GdprData[];

  constructor(
    public dialogRef: MatDialogRef<AnonymizationAllConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {ids: number[]},
    private service: GdprAnonymizationService,
    private store: Store<GdprStore.State>,
  ) {
  }


  ngOnInit(): void {
    this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataTypes = data;
    });

    this.service.anonymizeAllPreview(this.data.ids).pipe(takeUntil(this.destroy$)).subscribe(res => {
      this.sqlPreview = res;
    });
  }

  getGdprDataById(id: any): GdprData {
    return this.dataTypes?.find(d => d.id == id);
  }

  onClick(result: boolean): void {
    this.dialogRef.close(result);
  }

  ngOnDestroy() {
    this.destroy$.next(null);
    this.destroy$.complete();
  }

  protected readonly Object = Object;
}
