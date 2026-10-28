import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  style = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '5px',
    fontWeight: '550',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled ? '0.55' : '1',
    transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const sizeStyles = {
    sm: { height: '30px', padding: '0 10px', fontSize: '12px' },
    md: { height: '36px', padding: '0 14px', fontSize: '13px' },
    lg: { height: '42px', padding: '0 18px', fontSize: '14px' },
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--accent-primary)',
      color: 'var(--text-on-accent)',
      border: '1px solid var(--accent-primary)',
    },
    secondary: {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-default)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid transparent',
    },
    destructive: {
      backgroundColor: 'var(--semantic-error-bg)',
      color: 'var(--semantic-error-fg)',
      border: '1px solid rgba(213, 141, 131, 0.3)',
    },
  };

  const combinedStyles = {
    ...baseStyles,
    ...(sizeStyles[size] || sizeStyles.md),
    ...(variantStyles[variant] || variantStyles.primary),
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      style={combinedStyles}
      className={`btn-component ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      ) : Icon ? (
        <Icon size={16} />
      ) : null}
      {children}
    </button>
  );
}
