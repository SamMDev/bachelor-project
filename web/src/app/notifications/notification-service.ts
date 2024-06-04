import {Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NotificationMessage} from './notification-message';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  success(message: string | NotificationMessage): void {
    this.snackBar.open(message, 'Zavrieť', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  failure(message: string | NotificationMessage): void {
    this.snackBar.open(message, 'Zavrieť', {
      duration: 3000,
      panelClass: ['failure-snackbar']
    });
  }

  warning(message: string | NotificationMessage): void {
    this.snackBar.open(message, 'Zavrieť', {
      duration: 3000,
      panelClass: ['warning-snackbar']
    });
  }
}
