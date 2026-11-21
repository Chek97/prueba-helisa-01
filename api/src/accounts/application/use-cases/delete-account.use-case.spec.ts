import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { DeleteAccountUseCase } from './delete-account.use-case.js';

// ─── Helper: mock completo del repositorio ───────────────────────────────────

function buildMockRepo(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    findByCode: vi.fn(),
    findAll: vi.fn(),
    findChildren: vi.fn(),
    existsByCode: vi.fn().mockResolvedValue(true),
    hasChildren: vi.fn().mockResolvedValue(false),
    save: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    findRootNature: vi.fn(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;
  let mockRepo: AccountRepository;

  beforeEach(() => {
    mockRepo = buildMockRepo();
    useCase = new DeleteAccountUseCase(mockRepo);
  });

  // ── Eliminación exitosa ─────────────────────────────────────────────────────

  describe('cuando la cuenta existe y no tiene hijas', () => {
    it('elimina una Subcuenta (hoja por definición si no tiene hijas)', async () => {
      await useCase.execute('110505');

      expect(mockRepo.existsByCode).toHaveBeenCalledWith('110505');
      expect(mockRepo.hasChildren).toHaveBeenCalledWith('110505');
      expect(mockRepo.delete).toHaveBeenCalledWith('110505');
    });

    it('elimina una Cuenta sin hijas', async () => {
      await useCase.execute('1105');

      expect(mockRepo.delete).toHaveBeenCalledWith('1105');
    });

    it('elimina una Clase sin hijas', async () => {
      await useCase.execute('1');

      expect(mockRepo.delete).toHaveBeenCalledWith('1');
    });

    it('elimina un Grupo sin hijas', async () => {
      await useCase.execute('11');

      expect(mockRepo.delete).toHaveBeenCalledWith('11');
    });

    it('resuelve sin valor de retorno (void)', async () => {
      const result = await useCase.execute('110505');

      expect(result).toBeUndefined();
    });
  });

  // ── Cuenta inexistente ──────────────────────────────────────────────────────

  describe('cuando la cuenta no existe', () => {
    it('lanza ACCOUNT_NOT_FOUND', async () => {
      vi.mocked(mockRepo.existsByCode).mockResolvedValue(false);

      await expect(useCase.execute('9999')).rejects.toMatchObject({
        code: 'ACCOUNT_NOT_FOUND',
      });
    });

    it('no llama a hasChildren ni a delete', async () => {
      vi.mocked(mockRepo.existsByCode).mockResolvedValue(false);

      await expect(useCase.execute('9999')).rejects.toThrow();

      expect(mockRepo.hasChildren).not.toHaveBeenCalled();
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('incluye el código buscado en el mensaje de error', async () => {
      vi.mocked(mockRepo.existsByCode).mockResolvedValue(false);

      await expect(useCase.execute('1105')).rejects.toSatisfy(
        (e: { message: string }) => e.message.includes('"1105"'),
      );
    });
  });

  // ── Cuenta con hijas ────────────────────────────────────────────────────────

  describe('cuando la cuenta tiene cuentas hijas', () => {
    it('lanza ACCOUNT_HAS_CHILDREN', async () => {
      vi.mocked(mockRepo.hasChildren).mockResolvedValue(true);

      await expect(useCase.execute('11')).rejects.toMatchObject({
        code: 'ACCOUNT_HAS_CHILDREN',
      });
    });

    it('no llama a delete', async () => {
      vi.mocked(mockRepo.hasChildren).mockResolvedValue(true);

      await expect(useCase.execute('11')).rejects.toThrow();

      expect(mockRepo.delete).not.toHaveBeenCalled();
    });

    it('incluye el código de la cuenta en el mensaje de error', async () => {
      vi.mocked(mockRepo.hasChildren).mockResolvedValue(true);

      await expect(useCase.execute('1')).rejects.toSatisfy(
        (e: { message: string }) => e.message.includes('"1"'),
      );
    });

    it('verifica las hijas solo después de confirmar que la cuenta existe', async () => {
      vi.mocked(mockRepo.hasChildren).mockResolvedValue(true);

      await expect(useCase.execute('1')).rejects.toThrow();

      // El orden importa: primero existsByCode, luego hasChildren
      const existsCall = vi.mocked(mockRepo.existsByCode).mock.invocationCallOrder[0];
      const childrenCall = vi.mocked(mockRepo.hasChildren).mock.invocationCallOrder[0];
      expect(existsCall).toBeLessThan(childrenCall);
    });
  });
});
