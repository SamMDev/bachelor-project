import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GdprDataComponent} from './gdpr-data/gdpr-data.component';
import {GdprTableConfigurationComponent} from './gdpr-table-configuration/gdpr-table-configuration.component';
import {AnonymizationComponent} from './anonymization/anonymization.component';
import {GdprAuditComponent} from './gdpr-audit/gdpr-audit.component';
import {AnonymizationAllComponent} from './anonymization-all/anonymization-all.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'gdpr-data',
  },
  {
    path: 'gdpr-data',
    component: GdprDataComponent,
  },
  {
    path: 'relations',
    component: GdprTableConfigurationComponent,
  },
  {
    path: 'anonymization',
    component: AnonymizationComponent,
  },
  {
    path: 'anonymization-all',
    component: AnonymizationAllComponent,
  },
  {
    path: 'audit',
    component: GdprAuditComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
