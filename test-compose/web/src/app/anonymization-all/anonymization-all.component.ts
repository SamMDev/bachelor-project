import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, of, Subject, takeUntil} from 'rxjs';
import {FormBuilder, FormGroup} from '@angular/forms';
import {GdprData} from '../model/gdpr-data';
import {Store} from '@ngrx/store';
import * as GdprStore from '../store/gdpr-module.reducer';
import {MatDialog} from '@angular/material/dialog';
import {NotificationService} from '../notifications/notification-service';
import * as GdprAction from '../store/gdpr-module.actions';
import * as GdprSelector from '../store/gdpr-module.selector';
import {
  AnonymizationAllConfirmDialogComponent
} from './anonymization-all-confirm-dialog/anonymization-all-confirm-dialog.component';
import {GdprAnonymizationService} from '../service/gdpr-anonymization-service';
import {NotificationMessage} from '../notifications/notification-message';
import {catchError} from 'rxjs/operators';

@Component({
  selector: 'app-anonymization-all',
  templateUrl: './anonymization-all.component.html',
  styleUrl: './anonymization-all.component.scss'
})
export class AnonymizationAllComponent implements OnInit, OnDestroy {

  destroy$ = new Subject();
  loading: boolean = false;

  formGroup: FormGroup;
  dataTypes: GdprData[];


  constructor(
    private store: Store<GdprStore.State>,
    private fb: FormBuilder,
    public dialog: MatDialog,
    private notificationService: NotificationService,
    private service: GdprAnonymizationService,
  ) {
    this.createFormGroup();
  }

  ngOnInit(): void {
    this.store.select(GdprSelector.selectGdprData).pipe(takeUntil(this.destroy$)).subscribe(data => {
      this.dataTypes = data;
      this.formGroup.get('gdprDataIds').setValue(data?.map(d => d.id));
    });
  }

  anonymizeAll() {
    const ids: number[] = this.formGroup.get('gdprDataIds').value as number[];
    const dialogRef = this.dialog.open(AnonymizationAllConfirmDialogComponent, {
      data: {
        ids: ids,
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.service.anonymizeAll(ids)
          .pipe(
            takeUntil(this.destroy$),
            catchError((error) => {
              this.notificationService.failure(NotificationMessage.UPDATE_FAILURE);
              this.loading = false;
              return of(null);
            })
          ).subscribe(res => {
            this.loading = false;
            this.notificationService.success(NotificationMessage.UPDATE_SUCCESS);
        });
      }
    });
  }

  private createFormGroup() {
    this.formGroup = this.fb.group({
      gdprDataIds: [[]],
    });
  }



  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();

    this.store.dispatch(GdprAction.onExitDetailPage());
  }


}
