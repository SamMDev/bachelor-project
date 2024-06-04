import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {MatDrawer} from '@angular/material/sidenav';

@Component({
  selector: 'app-sidebar-window',
  templateUrl: './sidebar-window.component.html',
  styleUrl: './sidebar-window.component.scss'
})
export class SidebarWindowComponent {
  @ViewChild(MatDrawer) drawer: MatDrawer;

  @Input() editMode: boolean;
  @Input() loading: boolean;
  @Input() set opened(opened: boolean) {
    this.drawer?.toggle(opened);
  }
  @Input() editable: boolean = true;
  @Input() deletable: boolean = true;

  // no-edit mode actions
  @Output() editClicked = new EventEmitter();
  @Output() closeClicked = new EventEmitter();
  @Output() deleteClicked = new EventEmitter();
  // edit mode actions
  @Output() cancelClicked = new EventEmitter();
  @Output() saveClicked = new EventEmitter();

}
