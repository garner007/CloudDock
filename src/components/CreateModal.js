import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * CreateModal — generic create/edit form modal.
 *
 * Props:
 *   title       {string}   Modal heading
 *   open        {bool}     Show/hide
 *   onClose     {fn}       Called to close
 *   onSubmit    {fn}       Called with form values object
 *   loading     {bool}     Disable submit and show spinner
 *   fields      {Array}    [{ name, label, type, required, placeholder, options, defaultValue, validate, helpText }]
 *   submitLabel {string}   Submit button text (default "Create")
 */
export default function CreateModal({
  title,
  open,
  onClose,
  onSubmit,
  loading,
  fields = [],
  submitLabel = 'Create',
}) {
  const buildDefaults = useCallback(() => {
    const defaults = {};
    fields.forEach(f => {
      if (f.defaultValue !== undefined) {
        defaults[f.name] = f.defaultValue;
      } else if (f.type === 'select' && f.options?.length) {
        defaults[f.name] = f.options[0];
      } else {
        defaults[f.name] = '';
      }
    });
    return defaults;
  }, [fields]);

  const [values, setValues] = useState(buildDefaults);
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  // Reset form and focus first input when modal opens
  useEffect(() => {
    if (open) {
      setValues(buildDefaults());
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [open, buildDefaults]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateField = (field) => {
    const val = values[field.name];
    if (field.required && (!val || !String(val).trim())) {
      return `${field.label} is required`;
    }
    if (field.validate) {
      return field.validate(val);
    }
    return null;
  };

  const handleBlur = (field) => {
    const err = validateField(field);
    if (err) setErrors(prev => ({ ...prev, [field.name]: err }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all fields
    const newErrors = {};
    let hasError = false;
    fields.forEach(f => {
      const err = validateField(f);
      if (err) { newErrors[f.name] = err; hasError = true; }
    });
    setErrors(newErrors);
    if (hasError) return;
    onSubmit?.(values);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-modal-title"
      >
        <div className="modal-header">
          <span id="create-modal-title" className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((field, i) => (
              <div className="form-group" key={field.name}>
                <label className="form-label" htmlFor={`cm-${field.name}`}>
                  {field.label}
                  {field.required && <span style={{ color: 'var(--aws-red)', marginLeft: 4 }}>*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    id={`cm-${field.name}`}
                    className="input"
                    style={{ width: '100%' }}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    ref={i === 0 ? firstInputRef : undefined}
                  >
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={`cm-${field.name}`}
                    className="input"
                    style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    placeholder={field.placeholder}
                    ref={i === 0 ? firstInputRef : undefined}
                  />
                ) : (
                  <input
                    id={`cm-${field.name}`}
                    type={field.type || 'text'}
                    className="input"
                    style={{ width: '100%' }}
                    value={values[field.name] || ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    onBlur={() => handleBlur(field)}
                    placeholder={field.placeholder}
                    ref={i === 0 ? firstInputRef : undefined}
                  />
                )}

                {errors[field.name] && (
                  <div style={{ color: 'var(--aws-red)', fontSize: 12, marginTop: 4 }}>
                    {errors[field.name]}
                  </div>
                )}
                {field.helpText && !errors[field.name] && (
                  <div style={{ color: 'var(--aws-text-muted)', fontSize: 11, marginTop: 4 }}>
                    {field.helpText}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
