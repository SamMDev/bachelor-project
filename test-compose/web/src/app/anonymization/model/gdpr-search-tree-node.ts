import {GdprTableNode} from '../../model/gdpr-table-node';


export interface GdprSearchTreeNode {
  uuid: string;
  parentUuid: string;
  parent: GdprSearchTreeNode;

  isDataNode: boolean;
  isSelected: boolean;
  dataId: any;
  data: Record<string, any>;

  node?: GdprTableNode;

  children: GdprSearchTreeNode[];
}
