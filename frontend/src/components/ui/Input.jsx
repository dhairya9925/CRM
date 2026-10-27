import React, { useId } from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  error,
  helperText,
  required = false,
  rightElement,
  style = {},
  className = '',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '12px',
            fontWeight: '550',
            color: 'var(--text-secondary)',
            letterSpacing: '0.01em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            {label}
            {required && <span style={{ color: 'var(--accent-primary)', marginLeft: '4px' }}>*</span>}
          </span>
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          id={inputId}
          type={type}
          style={{
            width: '100%',
            height: '38px',
            padding: rightElement ? '0 38px 0 12px' : '0 12px',
            backgroundColor: 'var(--bg-input)',
            border: `1px solid ${error ? 'var(--semantic-error-fg)' : 'var(--border-default)'}`,
            borderRadius: '5px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 120ms ease',
            ...style,
          }}
          className={className}
          {...props}
        />
        {rightElement && (
          <div
            style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <span style={{ fontSize: '11px', color: 'var(--semantic-error-fg)' }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{helperText}</span>
      ) : null}
    </div>
  );
}
