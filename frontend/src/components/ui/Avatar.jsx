import React from 'react';

export default function Avatar({ name = '', size = 32, src, role }) {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const dimension = `${size}px`;

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        borderRadius: '50%',
        backgroundColor: 'var(--bg-surface-active)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size <= 28 ? '11px' : size <= 36 ? '12px' : '14px',
        fontWeight: '600',
        letterSpacing: '0.02em',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      title={name ? `${name}${role ? ` (${role})` : ''}` : undefined}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}
