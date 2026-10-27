import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getCompanies, getContacts } from '../../services/api';

const STAGES = [
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Closed Won' },
  { value: 'lost', label: 'Closed Lost' },
];

export default function DealModal({ isOpen, onClose, onSave, deal = null }) {
  const [name, setName] = useState('');
  const [value, setValue] = useState(25000);
  const [stage, setStage] = useState('qualification');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');

  const [companiesList, setCompaniesList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSelectOptions() {
      try {
        const [compRes, contRes] = await Promise.allSettled([
          getCompanies({ page_size: 100 }),
          getContacts({ page_size: 100 }),
        ]);
        if (compRes.status === 'fulfilled' && compRes.value?.items) {
          setCompaniesList(compRes.value.items);
        }
        if (contRes.status === 'fulfilled' && contRes.value?.items) {
          setContactsList(contRes.value.items);
        }
      } catch {
        // quiet
      }
    }
    if (isOpen) {
      loadSelectOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (deal) {
      setName(deal.name || '');
      setValue(deal.value !== undefined ? deal.value : 25000);
      setStage(deal.stage || 'qualification');
      setExpectedCloseDate(deal.expected_close_date || '');
      setCompanyId(deal.company_id || '');
      setContactId(deal.contact_id || '');
    } else {
      setName('');
      setValue(25000);
      setStage('qualification');
      setExpectedCloseDate(
        new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
      );
      setCompanyId('');
      setContactId('');
    }
    setError('');
  }, [deal, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Opportunity name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        value: Number(value) || 0,
        stage,
        expected_close_date: expectedCloseDate || null,
        company_id: companyId || null,
        contact_id: contactId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save deal opportunity.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        zIndex: 60,
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
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              {deal ? 'Edit Deal Opportunity' : 'New Sales Opportunity'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {deal ? 'Update pipeline stage, deal valuation, and timeline' : 'Create an active contract or sale in the pipeline'}
            </p>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input
              label="Deal / Opportunity Name"
              placeholder="e.g. Global ERP Integration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Contract Value ($ USD)"
                type="number"
                min="0"
                placeholder="50000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Pipeline Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '5px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    padding: '0 10px',
                  }}
                >
                  {STAGES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Input
              label="Expected Close Date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Associated Company
                </label>
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '5px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    padding: '0 10px',
                  }}
                >
                  <option value="">None / Not Selected</option>
                  {companiesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Primary Contact
                </label>
                <select
                  value={contactId}
                  onChange={(e) => setContactId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '5px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    padding: '0 10px',
                  }}
                >
                  <option value="">None / Not Selected</option>
                  {contactsList.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.full_name || `${ct.first_name} ${ct.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting}>
              {deal ? 'Save Changes' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
