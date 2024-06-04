import {AfterViewInit, Component, OnInit} from '@angular/core';
import {State, Store} from '@ngrx/store';
import * as GdprStore from './store/gdpr-module.reducer';
import * as GdprActions from './store/gdpr-module.actions';
import * as GdprSelector from './store/gdpr-module.selector';
import * as GdprAction from './store/gdpr-module.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit {

  currentTabLabel: string = 'Typy osobných údajov';

  constructor(
    private store: Store<GdprStore.State>,
  ) {
  }

  onTabSelected(tabLabel: string) {
    this.currentTabLabel = tabLabel;
  }

  ngOnInit() {
    this.store.dispatch(GdprActions.loadAllColumns());
    this.store.dispatch(GdprAction.loadGdprData());
    this.store.dispatch(GdprAction.listRootNodesGridData());
  }

  ngAfterViewInit() {
  }
}
