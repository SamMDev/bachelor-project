import {GdprTableNode} from './model/gdpr-table-node';


export const searchTreeDFS = (rootNode: GdprTableNode, searchPredicate: (node: GdprTableNode) => boolean): GdprTableNode | null => {
  if (!rootNode || !searchPredicate) {
    throw Error();
  }

  const stack = [rootNode];
  while (stack.length > 0) {
    const node = stack.pop();

    if (searchPredicate(node)) {
      return node;
    }

    node.childNodes?.forEach(n => stack.push(n));
  }

  return null;
}

export const deepCopyNode = (node: GdprTableNode): GdprTableNode | null => {
  if (!node) {
    return null;
  }

  // deep copy non-cycle fields
  const copy = JSON.parse(JSON.stringify({
    ...node,
    parentNode: null,
    childNodes: null,
  } as GdprTableNode)) as GdprTableNode;

  // deep copy child nodes
  copy.childNodes = node.childNodes?.map(cn => deepCopyNode(cn));
  // set them this copy as parent
  copy.childNodes?.forEach(cn => cn.parentNode = copy);

  return copy;
}
