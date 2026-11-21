import { useMemo, useState } from 'react';
import type { AccountTreeNode } from '../../accounts.types';
import { collectAllCodes, filterTree } from '../../accounts.utils';
import { AccountTreeNodeItem } from './AccountTreeNodeItem';
import './AccountTree.css';

interface AccountTreeProps {
  nodes: AccountTreeNode[];
  loading: boolean;
  onDeleteAccount: (node: AccountTreeNode) => void;
  onSelectParentForNew: (parentCode: string) => void;
  onRefresh: () => void;
}

export function AccountTree({
  nodes,
  loading,
  onDeleteAccount,
  onSelectParentForNew,
  onRefresh,
}: AccountTreeProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(() => new Set());

  // Árbol filtrado por búsqueda
  const filteredNodes = useMemo(() => {
    return filterTree(nodes, searchTerm);
  }, [nodes, searchTerm]);

  // Si hay búsqueda activa, expandir automáticamente los nodos que coincidan
  const effectiveExpandedCodes = useMemo(() => {
    if (searchTerm.trim()) {
      return new Set(collectAllCodes(filteredNodes));
    }
    return expandedCodes;
  }, [searchTerm, filteredNodes, expandedCodes]);

  const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = collectAllCodes(nodes);
    setExpandedCodes(new Set(all));
  };

  const collapseAll = () => {
    setExpandedCodes(new Set());
  };

  return (
    <div className="account-tree-card">
      <div className="account-tree-card__header">
        <div className="account-tree-card__title-box">
          <h2 className="account-tree-card__title">Catálogo Jerárquico de Cuentas</h2>
          <span className="account-tree-card__count">
            {nodes.length} {nodes.length === 1 ? 'Clase raíz' : 'Clases raíz'}
          </span>
        </div>

        <div className="account-tree-card__controls">
          <button
            type="button"
            className="tree-btn tree-btn--secondary"
            onClick={expandAll}
            title="Expandir todas las ramas del catálogo"
          >
            Expandir todo
          </button>
          <button
            type="button"
            className="tree-btn tree-btn--secondary"
            onClick={collapseAll}
            title="Colapsar todas las ramas"
          >
            Colapsar todo
          </button>
          <button
            type="button"
            className="tree-btn tree-btn--icon"
            onClick={onRefresh}
            disabled={loading}
            title="Recargar catálogo"
            aria-label="Recargar catálogo"
          >
            <span className={`refresh-icon ${loading ? 'refresh-icon--spinning' : ''}`}>
              ↻
            </span>
          </button>
        </div>
      </div>

      <div className="account-tree-card__search">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          className="search-input"
          placeholder="Buscar por código (ej. 1105) o nombre (ej. Caja)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="clear-search-btn"
            onClick={() => setSearchTerm('')}
            aria-label="Limpiar búsqueda"
          >
            ✕
          </button>
        )}
      </div>

      <div className="account-tree-card__body">
        {loading && nodes.length === 0 ? (
          <div className="tree-state tree-state--loading">
            <div className="spinner" />
            <p>Cargando catálogo contable...</p>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="tree-state tree-state--empty">
            <span className="tree-state__icon">📂</span>
            {searchTerm ? (
              <>
                <p className="tree-state__title">No se encontraron cuentas</p>
                <p className="tree-state__desc">
                  No hay cuentas que coincidan con &ldquo;{searchTerm}&rdquo;. Intenta otra búsqueda.
                </p>
              </>
            ) : (
              <>
                <p className="tree-state__title">El catálogo está vacío</p>
                <p className="tree-state__desc">
                  Comienza creando la primera Clase contable (ej. 1 - ACTIVO, 2 - PASIVO) en el formulario.
                </p>
              </>
            )}
          </div>
        ) : (
          <ul className="account-tree-list" role="tree">
            {filteredNodes.map((node) => (
              <AccountTreeNodeItem
                key={node.code}
                node={node}
                depth={0}
                expandedCodes={effectiveExpandedCodes}
                onToggleExpand={toggleExpand}
                onDelete={onDeleteAccount}
                onSelectParentForNew={onSelectParentForNew}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

