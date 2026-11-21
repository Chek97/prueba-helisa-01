import { useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { AccountTreeNode, CreateAccountPayload, NatureType } from '../../accounts.types';
import { deriveParentCode, getLevelLabel, validateCodeFormat } from '../../accounts.types';
import { findNodeInTree } from '../../accounts.utils';
import './AccountForm.css';

interface AccountFormProps {
  tree: AccountTreeNode[];
  onSubmit: (payload: CreateAccountPayload) => Promise<boolean>;
  selectedParentCode?: string | null;
  onClearSelectedParent?: () => void;
}

export function AccountForm({
  tree,
  onSubmit,
  selectedParentCode,
  onClearSelectedParent,
}: AccountFormProps) {
  const codeInputId = useId();
  const nameInputId = useId();

  const [code, setCode] = useState(selectedParentCode ?? '');
  const [name, setName] = useState('');
  const [nature, setNature] = useState<NatureType>('DEBITO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedError, setSubmittedError] = useState<string | null>(null);

  // Ajustar estado durante render cuando cambia selectedParentCode (patrón recomendado de React)
  const [prevParent, setPrevParent] = useState(selectedParentCode);
  if (selectedParentCode !== prevParent) {
    setPrevParent(selectedParentCode);
    if (selectedParentCode) {
      setCode(selectedParentCode);
      setSubmittedError(null);
    }
  }

  // Validación de formato en tiempo real
  const codeValidation = useMemo(() => {
    if (!code) return null;
    return validateCodeFormat(code);
  }, [code]);

  // Nivel detectado
  const detectedLevel = useMemo(() => {
    return getLevelLabel(code);
  }, [code]);

  // Padre derivado
  const parentCode = useMemo(() => {
    return deriveParentCode(code);
  }, [code]);

  // Comprobar si el padre existe en el catálogo actual
  const parentNode = useMemo(() => {
    if (!parentCode) return null;
    return findNodeInTree(tree, parentCode);
  }, [tree, parentCode]);

  // Naturaleza heredada para cuentas no-Clase
  const inheritedNature = useMemo(() => {
    if (detectedLevel === 'CLASE') return null;
    if (parentNode) return parentNode.nature;
    // Si no está el padre directo pero existe la Clase raíz
    const rootClassCode = code.slice(0, 1);
    const rootClass = findNodeInTree(tree, rootClassCode);
    return rootClass?.nature ?? null;
  }, [detectedLevel, parentNode, tree, code]);

  // Estado de validación general para habilitar / confirmar antes de enviar
  const isCodeFormatValid = codeValidation?.valid === true;
  const isNameValid = name.trim().length > 0;
  const isParentRequirementMet =
    detectedLevel === 'CLASE' || (Boolean(parentCode) && Boolean(parentNode));

  const canSubmit =
    isCodeFormatValid &&
    isNameValid &&
    isParentRequirementMet &&
    !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmittedError(null);

    // 1. Confirmación de formato de código
    const formatCheck = validateCodeFormat(code);
    if (!formatCheck.valid) {
      setSubmittedError(formatCheck.reason);
      return;
    }

    // 2. Confirmación de nombre no vacío
    if (!name.trim()) {
      setSubmittedError('El nombre de la cuenta no puede estar vacío.');
      return;
    }

    // 3. Confirmación de existencia del padre (regla de negocio fundamental)
    if (detectedLevel !== 'CLASE') {
      if (!parentCode || !parentNode) {
        setSubmittedError(
          `Regla de negocio no cumplida: El padre con código "${parentCode}" no existe en el catálogo. No se puede crear la cuenta.`,
        );
        return;
      }
    }

    // 4. Preparar payload
    const payload: CreateAccountPayload = {
      code: code.trim(),
      name: name.trim(),
      ...(detectedLevel === 'CLASE' ? { nature } : {}),
    };

    setIsSubmitting(true);
    try {
      const ok = await onSubmit(payload);
      if (ok) {
        // Limpiar formulario tras éxito
        setCode('');
        setName('');
        setNature('DEBITO');
        setSubmittedError(null);
        if (onClearSelectedParent) onClearSelectedParent();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setName('');
    setNature('DEBITO');
    setSubmittedError(null);
    if (onClearSelectedParent) onClearSelectedParent();
  };

  return (
    <div className="account-form-card">
      <div className="account-form-card__header">
        <h3 className="account-form-card__title">Nueva Cuenta Contable</h3>
        <p className="account-form-card__subtitle">
          Agrega una cuenta respetando la jerarquía del Plan Único de Cuentas (PUC).
        </p>
      </div>

      {selectedParentCode && (
        <div className="account-form__parent-banner">
          <span>
            Creando cuenta bajo el padre: <strong>{selectedParentCode}</strong>
          </span>
          <button
            type="button"
            className="account-form__parent-banner-btn"
            onClick={onClearSelectedParent}
          >
            Quitar
          </button>
        </div>
      )}

      <form className="account-form" onSubmit={handleSubmit} noValidate>
        {/* Campo Código */}
        <div className="form-group">
          <label htmlFor={codeInputId} className="form-label">
            Código Contable <span className="form-required">*</span>
          </label>
          <div className="form-input-wrapper">
            <input
              id={codeInputId}
              type="text"
              className={`form-input form-input--code ${
                code && !isCodeFormatValid ? 'form-input--error' : ''
              } ${code && isCodeFormatValid ? 'form-input--success' : ''}`}
              placeholder="Ej: 1, 11, 1105 o 110505"
              value={code}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCode(clean);
                setSubmittedError(null);
              }}
              autoComplete="off"
              disabled={isSubmitting}
            />
            {detectedLevel && (
              <span className={`form-level-badge badge--${detectedLevel.toLowerCase()}`}>
                {detectedLevel} ({code.length} {code.length === 1 ? 'dígito' : 'dígitos'})
              </span>
            )}
          </div>

          {/* Validación interactiva de código */}
          {code && !isCodeFormatValid && codeValidation && (
            <p className="form-feedback form-feedback--error">
              {codeValidation.reason}
            </p>
          )}

          {/* Confirmación y comprobación de regla de negocio del padre */}
          {code && isCodeFormatValid && (
            <div className="form-parent-feedback">
              {detectedLevel === 'CLASE' ? (
                <p className="form-feedback form-feedback--info">
                  ✓ Cuenta raíz (Clase). No requiere cuenta padre.
                </p>
              ) : parentNode ? (
                <p className="form-feedback form-feedback--success">
                  ✓ Padre válido: <strong>{parentNode.code} - {parentNode.name}</strong>{' '}
                  ({parentNode.level})
                </p>
              ) : (
                <p className="form-feedback form-feedback--warning">
                  ⚠ El padre con código <strong>{parentCode}</strong> no existe en el catálogo.
                  Debe crearlo antes de guardar esta cuenta.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Campo Nombre */}
        <div className="form-group">
          <label htmlFor={nameInputId} className="form-label">
            Nombre de la Cuenta <span className="form-required">*</span>
          </label>
          <input
            id={nameInputId}
            type="text"
            className="form-input"
            placeholder="Ej: DISPONIBLE, CAJA, CAJA GENERAL"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSubmittedError(null);
            }}
            disabled={isSubmitting}
            maxLength={100}
          />
        </div>

        {/* Campo Naturaleza */}
        {detectedLevel === 'CLASE' ? (
          <div className="form-group">
            <span className="form-label">
              Naturaleza Contable <span className="form-required">*</span>
            </span>
            <div className="form-radio-group">
              <label
                className={`form-radio-card ${
                  nature === 'DEBITO' ? 'form-radio-card--selected-debito' : ''
                }`}
              >
                <input
                  type="radio"
                  name="nature"
                  value="DEBITO"
                  checked={nature === 'DEBITO'}
                  onChange={() => setNature('DEBITO')}
                  disabled={isSubmitting}
                />
                <div className="form-radio-card__content">
                  <span className="form-radio-card__title">DÉBITO</span>
                  <span className="form-radio-card__desc">Aumenta por el Débito (Activo, Gastos, Costos)</span>
                </div>
              </label>

              <label
                className={`form-radio-card ${
                  nature === 'CREDITO' ? 'form-radio-card--selected-credito' : ''
                }`}
              >
                <input
                  type="radio"
                  name="nature"
                  value="CREDITO"
                  checked={nature === 'CREDITO'}
                  onChange={() => setNature('CREDITO')}
                  disabled={isSubmitting}
                />
                <div className="form-radio-card__content">
                  <span className="form-radio-card__title">CRÉDITO</span>
                  <span className="form-radio-card__desc">Aumenta por el Crédito (Pasivo, Patrimonio, Ingresos)</span>
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="form-group form-group--readonly">
            <span className="form-label">Naturaleza Heredada</span>
            <div className="form-inherited-nature">
              <span className="form-inherited-nature__icon">ℹ</span>
              <span>
                Hereda la naturaleza de la Clase raíz:{' '}
                <strong>{inheritedNature ?? 'Determinada por la clase raíz'}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Mensaje de error si la validación previa falló */}
        {submittedError && (
          <div className="form-alert form-alert--error" role="alert">
            <span className="form-alert__icon">✕</span>
            <span>{submittedError}</span>
          </div>
        )}

        {/* Botones de acción */}
        <div className="form-actions">
          <button
            type="button"
            className="form-btn form-btn--secondary"
            onClick={handleReset}
            disabled={isSubmitting || (!code && !name)}
          >
            Limpiar
          </button>

          <button
            type="submit"
            className="form-btn form-btn--primary"
            disabled={!canSubmit}
            title={
              !isParentRequirementMet
                ? 'El padre debe existir en el catálogo antes de guardar'
                : undefined
            }
          >
            {isSubmitting ? (
              <>
                <span className="btn-spinner" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>+ Crear Cuenta</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
