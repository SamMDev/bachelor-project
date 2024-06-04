import {GdprSearchTreeNode} from './anonymization/model/gdpr-search-tree-node';

export const searchTreeDFS = (rootNode: GdprSearchTreeNode, searchPredicate: (node: GdprSearchTreeNode) => boolean): GdprSearchTreeNode | null => {
  if (!rootNode || !searchPredicate) {
    throw Error();
  }

  const stack = [rootNode];
  while (stack.length > 0) {
    const node = stack.pop();

    if (searchPredicate(node)) {
      return node;
    }

    node.children?.forEach(n => stack.push(n));
  }

  return null;
}

export const modifyTreeDFS = (rootNode: GdprSearchTreeNode, modifyNodePredicate: (node: GdprSearchTreeNode) => boolean, modifyNodeFunction: (node: GdprSearchTreeNode) => void): void => {
  if (!rootNode || !modifyNodeFunction) {
    throw Error();
  }

  const stack = [rootNode];
  while (stack.length > 0) {
    const node = stack.pop();

    if (!modifyNodePredicate || modifyNodePredicate(node)) {
      modifyNodeFunction(node);
    }

    node.children?.forEach(n => stack.push(n));
  }
}

export const deepCopyNode = (node: GdprSearchTreeNode): GdprSearchTreeNode | null => {
  if (!node) {
    return null;
  }

  // deep copy non-cycle fields
  const copy = JSON.parse(JSON.stringify({
    ...node,
    parent: null,
    children: null,
  } as GdprSearchTreeNode)) as GdprSearchTreeNode;

  // deep copy child nodes
  copy.children = node.children?.map(cn => deepCopyNode(cn));
  // set them this copy as parent
  copy.children?.forEach(cn => cn.parent = copy);

  return copy;
}

