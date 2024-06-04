import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {header: string, content: string, confirmationLabel: string, cancelLabel: string}) {
  }

  onConfirmClick() {
    this.dialogRef.close(true);
  }

  onCancelClick() {
    this.dialogRef.close(false);
  }

}
