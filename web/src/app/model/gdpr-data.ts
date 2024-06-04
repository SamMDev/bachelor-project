import {GdprColumnView} from './gdpr-column-view';

export interface GdprData {
  id: number;
  name: string;
  created: Date;
  defaultValue: string;
  columns: GdprColumnView[];
}
