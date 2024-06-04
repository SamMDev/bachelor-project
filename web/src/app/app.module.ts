import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatToolbar, MatToolbarRow} from '@angular/material/toolbar';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton, MatMiniFabButton} from '@angular/material/button';
import {MatSidenav, MatSidenavContainer, MatSidenavContent, MatSidenavModule} from '@angular/material/sidenav';
import {MatCheckbox} from '@angular/material/checkbox';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatListItem, MatListModule} from '@angular/material/list';
import {MatCard, MatCardContent} from '@angular/material/card';
import { GdprDataComponent } from './gdpr-data/gdpr-data.component';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {HttpClientModule} from '@angular/common/http';
import {GdprModuleEffects} from './store/gdpr-module.effects';
import {featureKey, reducer} from './store/gdpr-module.reducer';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {AgGridModule} from 'ag-grid-angular';
import { SidebarWindowComponent } from './sidebar-window/sidebar-window.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {NgSelectModule} from '@ng-select/ng-select';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { GdprTableConfigurationComponent } from './gdpr-table-configuration/gdpr-table-configuration.component';
import {
    MatNestedTreeNode,
    MatTree,
    MatTreeNode,
    MatTreeNodeDef,
    MatTreeNodeOutlet, MatTreeNodePadding,
    MatTreeNodeToggle
} from '@angular/material/tree';
import {MatMenu, MatMenuContent, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import { NodeDialogComponent } from './gdpr-table-configuration/node-dialog/node-dialog.component';
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from '@angular/material/dialog';
import { ParentNodeJoinConditionComponent } from './gdpr-table-configuration/node-dialog/parent-node-join-condition/parent-node-join-condition.component';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {CdkDrag, CdkDragHandle} from '@angular/cdk/drag-drop';
import { AnonymizationComponent } from './anonymization/anonymization.component';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {provideNativeDateAdapter} from '@angular/material/core';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ConfirmAnonymizationDialogComponent } from './anonymization/confirm-anonymization-dialog/confirm-anonymization-dialog.component';
import { GdprAuditComponent } from './gdpr-audit/gdpr-audit.component';
import { AnonymizationAllComponent } from './anonymization-all/anonymization-all.component';
import { AnonymizationAllConfirmDialogComponent } from './anonymization-all/anonymization-all-confirm-dialog/anonymization-all-confirm-dialog.component';

const production: boolean = false;

@NgModule({
  declarations: [
    AppComponent,
    GdprDataComponent,
    SidebarWindowComponent,
    GdprTableConfigurationComponent,
    NodeDialogComponent,
    ParentNodeJoinConditionComponent,
    AnonymizationComponent,
    ConfirmationDialogComponent,
    ConfirmAnonymizationDialogComponent,
    GdprAuditComponent,
    AnonymizationAllComponent,
    AnonymizationAllConfirmDialogComponent,
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbar,
        MatToolbarRow,
        MatIcon,
        MatIconButton,
        MatSidenavContainer,
        MatSidenav,
        MatSidenavContent,
        MatCheckbox,
        FormsModule,
        MatSidenavModule,
        MatButton,
        MatListItem,
        MatCard,
        MatCardContent,
        HttpClientModule,
        AgGridModule,
        MatTooltipModule,

        StoreModule.forRoot({}),
        StoreModule.forFeature(featureKey, reducer),
        EffectsModule.forRoot({}),
        EffectsModule.forFeature([
            GdprModuleEffects,
        ]),
        !production ? StoreDevtoolsModule.instrument() : [],
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        NgSelectModule,
        MatListModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTree,
        MatTreeNode,
        MatNestedTreeNode,
        MatTreeNodeToggle,
        MatTreeNodeOutlet,
        MatTreeNodeDef,
        MatMiniFabButton,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger,
        MatMenuContent,
        MatDialogContent,
        MatDialogActions,
        MatDialogTitle,
        MatDialogClose,
        MatButtonToggleGroup,
        MatButtonToggle,
        CdkDrag,
        CdkDragHandle,
        MatDatepickerToggle,
        MatDatepicker,
        MatDatepickerInput,
        MatTreeNodePadding,
    ],
  providers: [
    provideNativeDateAdapter(),
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
