import { useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from '../../../../components/ConfirmDialog';
import { ToastContainer, useToasts } from '../../../../components/Toast';
import { ApiError } from '../../accounts.service';
import type { AccountTreeNode, CreateAccountPayload } from '../../accounts.types';
import { calculateTreeStats } from '../../accounts.utils';
import { useAccounts } from '../../useAccounts';
import { AccountForm } from '../AccountForm/AccountForm';
import { AccountTree } from '../AccountTree/AccountTree';
import './AccountsPage.css';

export function AccountsPage() {
  const { tree, loading, error, loadTree, addAccount, removeAccount } = useAccounts();
  const { toasts, push, remove } = useToasts();

  const [accountToDelete, setAccountToDelete] = useState<AccountTreeNode | null>(null);
  const [selectedParentCode, setSelectedParentCode] = useState<string | null>(null);

  // Cargar catálogo inicial al montar
  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Si hubo error al cargar el catálogo, notificar
  useEffect(() => {
    if (error) {
      push('error', error);
    }
  }, [error, push]);

  // Estadísticas del catálogo
  const stats = useMemo(() => calculateTreeStats(tree), [tree]);

  // Manejar creación de cuenta
  const handleCreateAccount = async (payload: CreateAccountPayload): Promise<boolean> => {
    try {
      const msg = await addAccount(payload);
      push('success', msg);
      return true;
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Error al crear la cuenta';
      push('error', message);
      return false;
    }
  };

  // Manejar inicio de borrado
  const handleDeleteRequest = (node: AccountTreeNode) => {
    setAccountToDelete(node);
  };

  // Confirmar borrado
  const handleConfirmDelete = async () => {
    if (!accountToDelete) return;
    const targetCode = accountToDelete.code;
    const targetName = accountToDelete.name;

    try {
      const msg = await removeAccount(targetCode);
      push('success', msg || `Cuenta "${targetCode} - ${targetName}" eliminada correctamente.`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : `No se pudo eliminar la cuenta "${targetCode}".`;
      push('error', message);
    } finally {
      setAccountToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setAccountToDelete(null);
  };

  const handleSelectParentForNew = (parentCode: string) => {
    setSelectedParentCode(parentCode);
  };

  return (
    <div className="accounts-layout">
      {/* Contenedor de Toasts para notificaciones */}
      <ToastContainer toasts={toasts} onRemove={remove} />

      {/* Diálogo de Confirmación para Borrado */}
      {accountToDelete && (
        <ConfirmDialog
          title={`¿Eliminar cuenta ${accountToDelete.code}?`}
          message={`¿Estás seguro de que deseas eliminar la cuenta "${accountToDelete.code} - ${accountToDelete.name}"? Si tiene cuentas hijas, la operación será rechazada por las reglas contables.`}
          confirmLabel="Eliminar cuenta"
          cancelLabel="Cancelar"
          variant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {/* Barra Superior / Header */}
      <header className="accounts-header">
        <div className="accounts-header__brand">
          <div className="accounts-header__logo">
            <span>H</span>
          </div>
          <div>
            <h1 className="accounts-header__title">HELISA · Plan Único de Cuentas</h1>
            <p className="accounts-header__subtitle">
              Gestor jerárquico de cuentas contables conforme a normatividad PUC
            </p>
          </div>
        </div>
      </header>

      {/* Panel de Estadísticas y Métricas */}
      <section className="stats-bar" aria-label="Estadísticas del catálogo">
        <div className="stat-card">
          <span className="stat-card__label">Total Cuentas</span>
          <span className="stat-card__value">{stats.total}</span>
        </div>
        <div className="stat-card stat-card--clase">
          <span className="stat-card__label">Clases (1 dígito)</span>
          <span className="stat-card__value">{stats.clases}</span>
        </div>
        <div className="stat-card stat-card--grupo">
          <span className="stat-card__label">Grupos (2 dígitos)</span>
          <span className="stat-card__value">{stats.grupos}</span>
        </div>
        <div className="stat-card stat-card--cuenta">
          <span className="stat-card__label">Cuentas (4 dígitos)</span>
          <span className="stat-card__value">{stats.cuentas}</span>
        </div>
        <div className="stat-card stat-card--subcuenta">
          <span className="stat-card__label">Subcuentas (6 dígitos)</span>
          <span className="stat-card__value">{stats.subcuentas}</span>
        </div>
      </section>

      {/* Grid Principal: Árbol Acordeón a la izquierda, Formulario a la derecha */}
      <main className="accounts-main">
        <div className="accounts-main__tree">
          <AccountTree
            nodes={tree}
            loading={loading}
            onDeleteAccount={handleDeleteRequest}
            onSelectParentForNew={handleSelectParentForNew}
            onRefresh={loadTree}
          />
        </div>

        <div className="accounts-main__sidebar">
          <AccountForm
            tree={tree}
            onSubmit={handleCreateAccount}
            selectedParentCode={selectedParentCode}
            onClearSelectedParent={() => setSelectedParentCode(null)}
          />

          <div className="puc-rules-card">
            <h4 className="puc-rules-card__title">Reglas de Negocio PUC</h4>
            <ul className="puc-rules-card__list">
              <li>
                <strong>Clase (1 dígito):</strong> Nivel raíz. Define la naturaleza (Débito o Crédito).
              </li>
              <li>
                <strong>Grupo (2 dígitos):</strong> Requiere que exista la Clase (1er dígito).
              </li>
              <li>
                <strong>Cuenta (4 dígitos):</strong> Requiere que exista el Grupo (primeros 2 dígitos).
              </li>
              <li>
                <strong>Subcuenta (6 dígitos):</strong> Requiere que exista la Cuenta (primeros 4 dígitos).
              </li>
              <li>
                <strong>Eliminación protegida:</strong> No se puede eliminar una cuenta que contenga cuentas hijas.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
