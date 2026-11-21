import type { AccountTreeNode } from '../../accounts.types';
import { getLevelBadgeClass } from '../../accounts.utils';

interface AccountTreeNodeItemProps {
  node: AccountTreeNode;
  depth: number;
  expandedCodes: Set<string>;
  onToggleExpand: (code: string) => void;
  onDelete: (node: AccountTreeNode) => void;
  onSelectParentForNew: (parentCode: string) => void;
}

export function AccountTreeNodeItem({
  node,
  depth,
  expandedCodes,
  onToggleExpand,
  onDelete,
  onSelectParentForNew,
}: AccountTreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedCodes.has(node.code);
  const canHaveChildren = node.level !== 'SUBCUENTA';

  return (
    <li
      className={`account-node account-node--depth-${depth} ${
        isExpanded ? 'account-node--expanded' : ''
      }`}
    >
      <div className="account-node__content">
        <button
          type="button"
          className={`account-node__toggle ${hasChildren ? '' : 'account-node__toggle--empty'}`}
          onClick={() => hasChildren && onToggleExpand(node.code)}
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-label={
            hasChildren
              ? `${isExpanded ? 'Colapsar' : 'Expandir'} cuenta ${node.code}`
              : undefined
          }
          disabled={!hasChildren}
        >
          {hasChildren ? (
            <span className={`account-node__chevron ${isExpanded ? 'account-node__chevron--open' : ''}`}>
              ▶
            </span>
          ) : (
            <span className="account-node__dot" />
          )}
        </button>

        <div
          className="account-node__info"
          onClick={() => hasChildren && onToggleExpand(node.code)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (hasChildren) {
                e.preventDefault();
                onToggleExpand(node.code);
              }
            }
          }}
        >
          <span className={`account-badge ${getLevelBadgeClass(node.level)}`}>
            {node.level}
          </span>

          <span className="account-node__code">{node.code}</span>
          <span className="account-node__name">{node.name}</span>

          {node.nature && (
            <span
              className={`nature-badge ${
                node.nature === 'DEBITO' ? 'nature-badge--debito' : 'nature-badge--credito'
              }`}
              title={`Naturaleza: ${node.nature}`}
            >
              {node.nature}
            </span>
          )}

          {hasChildren && (
            <span className="account-node__counter">
              {node.children.length} {node.children.length === 1 ? 'hijo' : 'hijos'}
            </span>
          )}
        </div>

        <div className="account-node__actions">
          {canHaveChildren && (
            <button
              type="button"
              className="account-node__btn account-node__btn--add"
              onClick={() => onSelectParentForNew(node.code)}
              title={`Añadir cuenta hija bajo ${node.code}`}
              aria-label={`Añadir cuenta hija bajo ${node.code}`}
            >
              <span className="account-node__btn-icon">+</span>
              <span className="account-node__btn-label">Hijo</span>
            </button>
          )}

          <button
            type="button"
            className="account-node__btn account-node__btn--delete"
            onClick={() => onDelete(node)}
            title={`Eliminar cuenta ${node.code} - ${node.name}`}
            aria-label={`Eliminar cuenta ${node.code} - ${node.name}`}
          >
            <svg
              className="account-node__trash-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <ul className="account-node__children" role="group">
          {node.children.map((child) => (
            <AccountTreeNodeItem
              key={child.code}
              node={child}
              depth={depth + 1}
              expandedCodes={expandedCodes}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              onSelectParentForNew={onSelectParentForNew}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

