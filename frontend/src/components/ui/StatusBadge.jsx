import React from 'react';

const STATUS_MAP = {
  new: { label: 'New', fg: 'var(--semantic-info-fg)', bg: 'var(--semantic-info-bg)' },
  contacted: { label: 'Contacted', fg: 'var(--text-secondary)', bg: 'var(--semantic-neutral-bg)' },
  qualified: { label: 'Qualified', fg: 'var(--semantic-warning-fg)', bg: 'var(--semantic-warning-bg)' },
  proposal: { label: 'Proposal', fg: 'var(--accent-primary)', bg: 'var(--accent-muted)' },
  negotiation: { label: 'Negotiation', fg: 'var(--accent-hover)', bg: 'var(--accent-muted)' },
  won: { label: 'Won', fg: 'var(--semantic-success-fg)', bg: 'var(--semantic-success-bg)' },
  lost: { label: 'Lost', fg: 'var(--semantic-error-fg)', bg: 'var(--semantic-error-bg)' },
  active: { label: 'Active', fg: 'var(--semantic-success-fg)', bg: 'var(--semantic-success-bg)' },
  inactive: { label: 'Inactive', fg: 'var(--text-disabled)', bg: 'var(--semantic-neutral-bg)' },
  pending: { label: 'Pending', fg: 'var(--semantic-warning-fg)', bg: 'var(--semantic-warning-bg)' },
  high: { label: 'High Priority', fg: 'var(--semantic-error-fg)', bg: 'var(--semantic-error-bg)' },
  medium: { label: 'Medium', fg: 'var(--semantic-warning-fg)', bg: 'var(--semantic-warning-bg)' },
  low: { label: 'Low', fg: 'var(--text-secondary)', bg: 'var(--semantic-neutral-bg)' },
};

export default function StatusBadge({ status = 'new', customLabel, size = 'sm' }) {
  const normalizedKey = String(status).toLowerCase().replace(/[\s_-]+/g, '');
  const config = STATUS_MAP[normalizedKey] || {
    label: customLabel || status,
    fg: 'var(--text-secondary)',
    bg: 'var(--semantic-neutral-bg)',
  };

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '2px 7px' : '4px 10px',
        borderRadius: '4px',
        fontSize: isSmall ? '11px' : '12px',
        fontWeight: '550',
        lineHeight: '1.2',
        color: config.fg,
        backgroundColor: config.bg,
        border: `1px solid ${config.fg}22`,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
      }}
    >
      {customLabel || config.label}
    </span>
  );
}
