import { useCallback, useReducer } from 'react';
import {
  createAccount,
  deleteAccount,
  fetchAccountTree,
} from './accounts.service';
import type { AccountTreeNode, CreateAccountPayload } from './accounts.types';

// ── Estado ────────────────────────────────────────────────────────────────

interface AccountsState {
  tree:    AccountTreeNode[];
  loading: boolean;
  error:   string | null;
}

type AccountsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_OK';    payload: AccountTreeNode[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

function reducer(state: AccountsState, action: AccountsAction): AccountsState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_OK':
      return { tree: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Hook central de la feature de cuentas.
 * Encapsula todo el estado y las operaciones sobre el catálogo.
 */
export function useAccounts() {
  const [state, dispatch] = useReducer(reducer, {
    tree:    [],
    loading: false,
    error:   null,
  });

  const loadTree = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchAccountTree();
      dispatch({ type: 'FETCH_OK', payload: data });
    } catch (err) {
      dispatch({
        type:    'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'Error al cargar el catálogo',
      });
    }
  }, []);

  const addAccount = useCallback(
    async (payload: CreateAccountPayload): Promise<string> => {
      await createAccount(payload);
      await loadTree();                 // Refresca el árbol tras crear
      return 'Cuenta creada exitosamente';
    },
    [loadTree],
  );

  const removeAccount = useCallback(
    async (code: string): Promise<string> => {
      const message = await deleteAccount(code);
      await loadTree();                 // Refresca el árbol tras eliminar
      return message;
    },
    [loadTree],
  );

  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []);

  return {
    tree:         state.tree,
    loading:      state.loading,
    error:        state.error,
    loadTree,
    addAccount,
    removeAccount,
    clearError,
  };
}
