import {GdprTableNode} from '../../../model/gdpr-table-node';
import {NodeDialogType} from './node-dialog-type';

export interface NodeDialogData {
  dialogType: NodeDialogType,
  node: GdprTableNode,
}
