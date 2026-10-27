import React, { useState, useEffect } from 'react';
import { X, Activity, Phone, Mail, Calendar, FileText } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getLeads, getContacts, getDeals } from '../../services/api';

const ACTIVITY_TYPES = [
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'meeting', label: 'Meeting / Demo', icon: Calendar },
  { value: 'email', label: 'Email Outreach', icon: Mail },
  { value: 'note', label: 'Relationship Note', icon: FileText },
];

export default function ActivityModal({ isOpen, onClose, onSave, activity = null }) {
  const [type, setType] = useState('call');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  // Associations
  const [leadId, setLeadId] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');

  const [leadsList, setLeadsList] = useState([]);
  const [contactsList, setContactsList] = useState([]);
  const [dealsList, setDealsList] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSelects() {
      try {
        const [lRes, cRes, dRes] = await Promise.allSettled([
          getLeads({ page_size: 50 }),
          getContacts({ page_size: 50 }),
          getDeals({ page_size: 50 }),
        ]);
        if (lRes.status === 'fulfilled' && lRes.value?.items) setLeadsList(lRes.value.items);
        if (cRes.status === 'fulfilled' && cRes.value?.items) setContactsList(cRes.value.items);
        if (dRes.status === 'fulfilled') {
          const dl = Array.isArray(dRes.value?.items)
            ? dRes.value.items
            : Array.isArray(dRes.value)
            ? dRes.value
            : [];
          setDealsList(dl);
        }
      } catch {
        // quiet
      }
    }

    if (isOpen) {
      loadSelects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activity) {
      setType(activity.type || 'call');
      setNotes(activity.notes || '');
      setOutcome(activity.outcome || '');
      setLeadId(activity.lead_id || '');
      setContactId(activity.contact_id || '');
      setDealId(activity.deal_id || '');
    } else {
      setType('call');
      setNotes('');
      setOutcome('');
      setLeadId('');
      setContactId('');
      setDealId('');
    }
    setError('');
  }, [activity, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim() && !outcome.trim()) {
      setError('Please provide notes or outcome describing the activity.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        type,
        notes: notes.trim() || null,
        outcome: outcome.trim() || null,
        lead_id: leadId || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record activity.');
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
              <Activity size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {activity ? 'Edit Activity Record' : 'Log Client Interaction'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Document client touchpoints, call summaries, and meeting outcomes
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Activity Type Selection Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Interaction Type
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  padding: '4px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {ACTIVITY_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: isSelected ? '600' : '450',
                        color: isSelected ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                        backgroundColor: isSelected ? 'var(--accent-primary)' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Outcome / Summary"
              placeholder="e.g. Budget approved for Q1, requested contract redline"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Detailed Notes & Discussion Topics
              </label>
              <textarea
                rows={3}
                placeholder="Key takeaways, attendees, follow-up commitments..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  padding: '8px 12px',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Linkage Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Associated Deal
                </label>
                <select
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '5px',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    padding: '0 8px',
                  }}
                >
                  <option value="">None / Not Selected</option>
                  {dealsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Associated Contact
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
                    fontSize: '12px',
                    padding: '0 8px',
                  }}
                >
                  <option value="">None / Not Selected</option>
                  {contactsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || `${c.first_name} ${c.last_name}`}
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
              {activity ? 'Save Changes' : 'Log Activity'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
