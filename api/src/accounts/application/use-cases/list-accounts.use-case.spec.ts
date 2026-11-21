import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account } from '../../domain/entities/account.entity.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import {
  AccountTreeNode,
  ListAccountsUseCase,
} from './list-accounts.use-case.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAccount(code: string, name: string, nature?: string): Account {
  return Account.reconstitute({ code, name, nature: nature ?? null });
}

function buildMockRepo(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    findByCode: vi.fn(),
    findAll: vi.fn().mockResolvedValue([]),
    findChildren: vi.fn().mockResolvedValue([]),
    existsByCode: vi.fn(),
    hasChildren: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
    findRootNature: vi.fn(),
    ...overrides,
  };
}

/** Busca un nodo en el árbol por código (DFS) */
function findNode(nodes: AccountTreeNode[], code: string): AccountTreeNode | undefined {
  for (const node of nodes) {
    if (node.code === code) return node;
    const found = findNode(node.children, code);
    if (found) return found;
  }
  return undefined;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ListAccountsUseCase', () => {
  let useCase: ListAccountsUseCase;
  let mockRepo: AccountRepository;

  beforeEach(() => {
    mockRepo = buildMockRepo();
    useCase = new ListAccountsUseCase(mockRepo);
  });

  // ── execute() — lista plana ─────────────────────────────────────────────────

  describe('execute()', () => {
    it('devuelve lista vacía cuando no hay cuentas', async () => {
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });

    it('devuelve todas las cuentas cuando no hay filtro', async () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(accounts);

      const result = await useCase.execute();

      expect(result).toHaveLength(2);
    });

    it('filtra por parentCode delegando al repositorio', async () => {
      const children = [makeAccount('11', 'Disponible')];
      vi.mocked(mockRepo.findChildren).mockResolvedValue(children);

      const result = await useCase.execute({ parentCode: '1' });

      expect(mockRepo.findChildren).toHaveBeenCalledWith('1');
      expect(result).toHaveLength(1);
      expect(result[0].code.value).toBe('11');
    });

    it('cuando hay parentCode no llama a findAll', async () => {
      vi.mocked(mockRepo.findChildren).mockResolvedValue([]);

      await useCase.execute({ parentCode: '1' });

      expect(mockRepo.findAll).not.toHaveBeenCalled();
    });

    it('filtra por nivel CLASE', async () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('2', 'Pasivo', 'CREDITO'),
        makeAccount('11', 'Disponible'),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(accounts);

      const result = await useCase.execute({ level: 'CLASE' });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.level === 'CLASE')).toBe(true);
    });

    it('filtra por nivel SUBCUENTA', async () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
        makeAccount('1105', 'Caja'),
        makeAccount('110505', 'Caja general'),
      ];
      vi.mocked(mockRepo.findAll).mockResolvedValue(accounts);

      const result = await useCase.execute({ level: 'SUBCUENTA' });

      expect(result).toHaveLength(1);
      expect(result[0].code.value).toBe('110505');
    });
  });

  // ── executeAsTree() — árbol jerárquico ──────────────────────────────────────

  describe('executeAsTree()', () => {
    it('devuelve arreglo vacío cuando no hay cuentas', async () => {
      const tree = await useCase.executeAsTree();

      expect(tree).toEqual([]);
    });

    it('devuelve una sola Clase sin hijos como nodo raíz hoja', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
      ]);

      const tree = await useCase.executeAsTree();

      expect(tree).toHaveLength(1);
      expect(tree[0].code).toBe('1');
      expect(tree[0].isLeaf).toBe(true);
      expect(tree[0].children).toHaveLength(0);
    });

    it('construye árbol Clase → Grupo correctamente', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ]);

      const tree = await useCase.executeAsTree();

      expect(tree).toHaveLength(1);
      const clase = tree[0];
      expect(clase.code).toBe('1');
      expect(clase.isLeaf).toBe(false);
      expect(clase.children).toHaveLength(1);
      expect(clase.children[0].code).toBe('11');
    });

    it('construye árbol de 4 niveles completo', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
        makeAccount('1105', 'Caja'),
        makeAccount('110505', 'Caja general'),
      ]);

      const tree = await useCase.executeAsTree();

      const clase = tree[0];
      const grupo = clase.children[0];
      const cuenta = grupo.children[0];
      const subcuenta = cuenta.children[0];

      expect(clase.code).toBe('1');
      expect(grupo.code).toBe('11');
      expect(cuenta.code).toBe('1105');
      expect(subcuenta.code).toBe('110505');
      expect(subcuenta.isLeaf).toBe(true);
    });

    it('múltiples Clases generan múltiples raíces', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('2', 'Pasivo', 'CREDITO'),
        makeAccount('3', 'Patrimonio', 'CREDITO'),
      ]);

      const tree = await useCase.executeAsTree();

      expect(tree).toHaveLength(3);
    });

    it('un Grupo con múltiples Cuentas hijo aparece correctamente', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
        makeAccount('1105', 'Caja'),
        makeAccount('1110', 'Bancos'),
      ]);

      const tree = await useCase.executeAsTree();
      const grupo = findNode(tree, '11');

      expect(grupo?.children).toHaveLength(2);
    });
  });

  // ── Propagación de naturaleza ───────────────────────────────────────────────

  describe('propagación de naturaleza', () => {
    it('el Grupo hereda la naturaleza de su Clase', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ]);

      const tree = await useCase.executeAsTree();
      const grupo = findNode(tree, '11');

      expect(grupo?.nature).toBe('DEBITO');
    });

    it('la Subcuenta hereda la naturaleza CREDITO de su Clase raíz', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('2', 'Pasivo', 'CREDITO'),
        makeAccount('21', 'Obligaciones financieras'),
        makeAccount('2105', 'Préstamos bancarios'),
        makeAccount('210505', 'Crédito a corto plazo'),
      ]);

      const tree = await useCase.executeAsTree();
      const subcuenta = findNode(tree, '210505');

      expect(subcuenta?.nature).toBe('CREDITO');
    });

    it('la Clase conserva su naturaleza original', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
      ]);

      const tree = await useCase.executeAsTree();

      expect(tree[0].nature).toBe('DEBITO');
    });

    it('dos Clases con distinta naturaleza propagan de forma independiente', async () => {
      vi.mocked(mockRepo.findAll).mockResolvedValue([
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
        makeAccount('2', 'Pasivo', 'CREDITO'),
        makeAccount('21', 'Obligaciones'),
      ]);

      const tree = await useCase.executeAsTree();
      const grupo1 = findNode(tree, '11');
      const grupo2 = findNode(tree, '21');

      expect(grupo1?.nature).toBe('DEBITO');
      expect(grupo2?.nature).toBe('CREDITO');
    });
  });

  // ── buildTree() — pruebas unitarias del método interno ─────────────────────

  describe('buildTree() — método interno', () => {
    it('marca como isLeaf=false al padre cuando tiene hijos', () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ];

      const tree = useCase.buildTree(accounts);

      expect(tree[0].isLeaf).toBe(false);
    });

    it('marca como isLeaf=true al nodo sin hijos', () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ];

      const tree = useCase.buildTree(accounts);

      expect(tree[0].children[0].isLeaf).toBe(true);
    });

    it('incluye parentCode en cada nodo', () => {
      const accounts = [
        makeAccount('1', 'Activo', 'DEBITO'),
        makeAccount('11', 'Disponible'),
      ];

      const tree = useCase.buildTree(accounts);
      const grupo = tree[0].children[0];

      expect(grupo.parentCode).toBe('1');
    });

    it('las Clases tienen parentCode = null', () => {
      const accounts = [makeAccount('1', 'Activo', 'DEBITO')];

      const tree = useCase.buildTree(accounts);

      expect(tree[0].parentCode).toBeNull();
    });
  });
});
