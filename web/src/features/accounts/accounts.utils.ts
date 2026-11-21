import type { AccountTreeNode, AccountLevel } from './accounts.types';

export interface TreeStats {
  total:      number;
  clases:     number;
  grupos:     number;
  cuentas:    number;
  subcuentas: number;
}

/**
 * Busca recursivamente un nodo en el árbol por su código.
 */
export function findNodeInTree(
  nodes: AccountTreeNode[],
  code: string,
): AccountTreeNode | null {
  for (const node of nodes) {
    if (node.code === code) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeInTree(node.children, code);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Calcula estadísticas de las cuentas registradas en el catálogo.
 */
export function calculateTreeStats(nodes: AccountTreeNode[]): TreeStats {
  const stats: TreeStats = {
    total:      0,
    clases:     0,
    grupos:     0,
    cuentas:    0,
    subcuentas: 0,
  };

  function traverse(list: AccountTreeNode[]) {
    for (const node of list) {
      stats.total += 1;
      if (node.level === 'CLASE') stats.clases += 1;
      else if (node.level === 'GRUPO') stats.grupos += 1;
      else if (node.level === 'CUENTA') stats.cuentas += 1;
      else if (node.level === 'SUBCUENTA') stats.subcuentas += 1;

      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return stats;
}

/**
 * Filtra el árbol de cuentas por término de búsqueda (código o nombre).
 * Si un hijo coincide, se conservan sus ancestros en el resultado para mantener la jerarquía.
 */
export function filterTree(
  nodes: AccountTreeNode[],
  term: string,
): AccountTreeNode[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return nodes;

  function filterNode(node: AccountTreeNode): AccountTreeNode | null {
    const matchesSelf =
      node.code.toLowerCase().includes(normalized) ||
      node.name.toLowerCase().includes(normalized);

    const filteredChildren = (node.children || [])
      .map(filterNode)
      .filter((child): child is AccountTreeNode => child !== null);

    if (matchesSelf || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  }

  return nodes
    .map(filterNode)
    .filter((node): node is AccountTreeNode => node !== null);
}

/**
 * Recopila todos los códigos de cuentas en el árbol (útil para expandir todo).
 */
export function collectAllCodes(nodes: AccountTreeNode[]): string[] {
  const codes: string[] = [];
  function traverse(list: AccountTreeNode[]) {
    for (const node of list) {
      codes.push(node.code);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }
  traverse(nodes);
  return codes;
}

/**
 * Devuelve la clase CSS correspondiente al nivel de cuenta.
 */
export function getLevelBadgeClass(level: AccountLevel): string {
  switch (level) {
    case 'CLASE':
      return 'badge--clase';
    case 'GRUPO':
      return 'badge--grupo';
    case 'CUENTA':
      return 'badge--cuenta';
    case 'SUBCUENTA':
      return 'badge--subcuenta';
  }
}

