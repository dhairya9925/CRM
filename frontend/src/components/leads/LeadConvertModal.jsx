import React, { useState } from 'react';
import { X, ArrowRight, UserCheck, DollarSign, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function LeadConvertModal({ isOpen, onClose, onConvert, lead }) {
  const [createDeal, setCreateDeal] = useState(true);
  const [dealName, setDealName] = useState(
    lead ? `${lead.company_name || lead.full_name || 'Account'} — Enterprise Contract` : ''
  );
  const [dealValue, setDealValue] = useState(45000);
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      await onConvert(lead.id, {
        create_deal: createDeal,
        deal_name: createDeal ? (dealName.trim() || `${lead.company_name || lead.full_name} Deal`) : null,
        deal_value: createDeal ? Number(dealValue) || 0 : 0,
        expected_close_date: createDeal && expectedCloseDate ? expectedCloseDate : null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to convert lead into contact and deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadName = lead.full_name || `${lead.first_name} ${lead.last_name}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 65,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '5px',
                backgroundColor: 'var(--accent-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Convert Lead
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Transition {leadName} into an active Contact and Deal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              backgroundColor: 'transparent',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                backgroundColor: 'var(--semantic-error-bg)',
                color: 'var(--semantic-error-fg)',
                border: '1px solid rgba(213, 141, 131, 0.25)',
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              padding: '12px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: '600' }}>
              <UserCheck size={16} />
              <span>Contact Record Created Automatically</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              A new verified Contact record will be created for <strong>{leadName}</strong> with email <em>{lead.email || 'N/A'}</em>.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                fontWeight: '550',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={createDeal}
                onChange={(e) => setCreateDeal(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: 'var(--accent-primary)',
                  cursor: 'pointer',
                }}
              />
              <span>Generate active sales opportunity in Pipeline</span>
            </label>

            {createDeal && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '14px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <Input
                  label="Deal Name"
                  placeholder="e.g. Acme Corp — Enterprise Contract"
                  value={dealName}
                  onChange={(e) => setDealName(e.target.value)}
                  required={createDeal}
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Input
                    label="Estimated Deal Value ($)"
                    type="number"
                    min="0"
                    placeholder="45000"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value)}
                  />
                  <Input
                    label="Target Close Date"
                    type="date"
                    value={expectedCloseDate}
                    onChange={(e) => setExpectedCloseDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: '22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '16px',
            }}
          >
            <Button variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting} icon={ArrowRight}>
              Confirm Conversion
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
