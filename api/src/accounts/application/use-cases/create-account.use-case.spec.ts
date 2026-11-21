import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DomainError } from '../../domain/errors/account.errors.js';
import { AccountRepository } from '../../domain/repositories/account.repository.js';
import { CreateAccountUseCase } from './create-account.use-case.js';

// ─── Helper: mock completo del repositorio ───────────────────────────────────

function buildMockRepo(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    findByCode: vi.fn(),
    findAll: vi.fn(),
    findChildren: vi.fn(),
    existsByCode: vi.fn().mockResolvedValue(false),
    hasChildren: vi.fn().mockResolvedValue(false),
    save: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn(),
    findRootNature: vi.fn(),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let mockRepo: AccountRepository;

  beforeEach(() => {
    mockRepo = buildMockRepo();
    useCase = new CreateAccountUseCase(mockRepo);
  });

  // ── Creación exitosa ────────────────────────────────────────────────────────

  describe('cuando los datos son válidos', () => {
    it('crea una Clase (1 dígito) con naturaleza DEBITO', async () => {
      const account = await useCase.execute({
        code: '1',
        name: 'Activo',
        nature: 'DEBITO',
      });

      expect(account.code.value).toBe('1');
      expect(account.level).toBe('CLASE');
      expect(account.nature?.value).toBe('DEBITO');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('crea una Clase con naturaleza CREDITO', async () => {
      const account = await useCase.execute({
        code: '2',
        name: 'Pasivo',
        nature: 'CREDITO',
      });

      expect(account.nature?.value).toBe('CREDITO');
      expect(account.level).toBe('CLASE');
    });

    it('crea un Grupo (2 dígitos) si su padre Clase existe', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)  // código "11" no existe aún
        .mockResolvedValueOnce(true);  // padre "1" sí existe

      const account = await useCase.execute({
        code: '11',
        name: 'Disponible',
      });

      expect(account.code.value).toBe('11');
      expect(account.level).toBe('GRUPO');
      expect(account.parentCode).toBe('1');
      expect(mockRepo.save).toHaveBeenCalledOnce();
    });

    it('crea una Cuenta (4 dígitos) si su padre Grupo existe', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)  // "1105" no existe
        .mockResolvedValueOnce(true);  // padre "11" existe

      const account = await useCase.execute({
        code: '1105',
        name: 'Caja',
      });

      expect(account.level).toBe('CUENTA');
      expect(account.parentCode).toBe('11');
    });

    it('crea una Subcuenta (6 dígitos) si su padre Cuenta existe', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)  // "110505" no existe
        .mockResolvedValueOnce(true);  // padre "1105" existe

      const account = await useCase.execute({
        code: '110505',
        name: 'Caja general',
      });

      expect(account.level).toBe('SUBCUENTA');
      expect(account.parentCode).toBe('1105');
    });

    it('no consulta padre cuando la cuenta es Clase', async () => {
      await useCase.execute({ code: '1', name: 'Activo', nature: 'DEBITO' });

      // Solo se llama una vez: para verificar unicidad del código
      expect(mockRepo.existsByCode).toHaveBeenCalledOnce();
      expect(mockRepo.existsByCode).toHaveBeenCalledWith('1');
    });
  });

  // ── Código duplicado ────────────────────────────────────────────────────────

  describe('cuando el código ya existe', () => {
    it('lanza CODE_ALREADY_EXISTS', async () => {
      vi.mocked(mockRepo.existsByCode).mockResolvedValue(true);

      const promise = useCase.execute({ code: '1', name: 'Activo', nature: 'DEBITO' });

      await expect(promise).rejects.toMatchObject({
        code: 'CODE_ALREADY_EXISTS',
      });
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  // ── Padre inexistente ───────────────────────────────────────────────────────

  describe('cuando el padre no existe', () => {
    it('lanza PARENT_NOT_FOUND para un Grupo sin Clase padre', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)  // "11" no existe
        .mockResolvedValueOnce(false); // padre "1" tampoco existe

      const promise = useCase.execute({ code: '11', name: 'Disponible' });

      await expect(promise).rejects.toMatchObject({
        code: 'PARENT_NOT_FOUND',
      });
      expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('lanza PARENT_NOT_FOUND para una Cuenta sin Grupo padre', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      await expect(
        useCase.execute({ code: '1105', name: 'Caja' }),
      ).rejects.toMatchObject({ code: 'PARENT_NOT_FOUND' });
    });

    it('incluye el código del padre faltante en el mensaje de error', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      await expect(
        useCase.execute({ code: '11', name: 'Disponible' }),
      ).rejects.toSatisfy(
        (e: DomainError) => e.message.includes('"1"'),
      );
    });
  });

  // ── Validación de código ────────────────────────────────────────────────────

  describe('cuando el formato del código es inválido', () => {
    const invalidCodes = [
      { code: '12', label: '2 dígitos no forman un nivel válido (sí es Grupo)' },
    ];

    it('lanza INVALID_CODE_FORMAT para código con letras', async () => {
      await expect(
        useCase.execute({ code: 'AB', name: 'Test', nature: 'DEBITO' }),
      ).rejects.toMatchObject({ code: 'INVALID_CODE_FORMAT' });
    });

    it('lanza INVALID_CODE_FORMAT para código con 3 dígitos', async () => {
      await expect(
        useCase.execute({ code: '123', name: 'Test' }),
      ).rejects.toMatchObject({ code: 'INVALID_CODE_FORMAT' });
    });

    it('lanza INVALID_CODE_FORMAT para código con 5 dígitos', async () => {
      await expect(
        useCase.execute({ code: '11055', name: 'Test' }),
      ).rejects.toMatchObject({ code: 'INVALID_CODE_FORMAT' });
    });

    it('lanza INVALID_CODE_FORMAT para código vacío', async () => {
      await expect(
        useCase.execute({ code: '', name: 'Test' }),
      ).rejects.toMatchObject({ code: 'INVALID_CODE_FORMAT' });
    });
  });

  // ── Validación de naturaleza ────────────────────────────────────────────────

  describe('cuando la naturaleza es inválida o está ausente', () => {
    it('lanza CLASS_MUST_HAVE_NATURE si Clase no incluye naturaleza', async () => {
      await expect(
        useCase.execute({ code: '1', name: 'Activo' }),
      ).rejects.toMatchObject({ code: 'CLASS_MUST_HAVE_NATURE' });
    });

    it('lanza INVALID_NATURE si la naturaleza tiene valor desconocido', async () => {
      await expect(
        useCase.execute({ code: '1', name: 'Activo', nature: 'INVALIDA' }),
      ).rejects.toMatchObject({ code: 'INVALID_NATURE' });
    });

    it('lanza NON_CLASS_MUST_NOT_HAVE_NATURE si un Grupo recibe naturaleza', async () => {
      vi.mocked(mockRepo.existsByCode)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      await expect(
        useCase.execute({ code: '11', name: 'Disponible', nature: 'DEBITO' }),
      ).rejects.toMatchObject({ code: 'NON_CLASS_MUST_NOT_HAVE_NATURE' });
    });
  });

  // ── Validación de nombre ────────────────────────────────────────────────────

  describe('cuando el nombre es inválido', () => {
    it('lanza NAME_MUST_NOT_BE_EMPTY para nombre vacío', async () => {
      await expect(
        useCase.execute({ code: '1', name: '', nature: 'DEBITO' }),
      ).rejects.toMatchObject({ code: 'NAME_MUST_NOT_BE_EMPTY' });
    });

    it('lanza NAME_MUST_NOT_BE_EMPTY para nombre solo con espacios', async () => {
      await expect(
        useCase.execute({ code: '1', name: '   ', nature: 'DEBITO' }),
      ).rejects.toMatchObject({ code: 'NAME_MUST_NOT_BE_EMPTY' });
    });
  });
});
