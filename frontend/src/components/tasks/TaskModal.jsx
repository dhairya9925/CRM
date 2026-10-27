import React, { useState, useEffect } from 'react';
import { X, CheckSquare } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { getLeads, getContacts, getDeals } from '../../services/api';

const TASK_TYPES = [
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'call', label: 'Phone Call' },
  { value: 'meeting', label: 'Client Meeting' },
  { value: 'email', label: 'Send Email' },
  { value: 'other', label: 'General Todo' },
];

const PRIORITIES = [
  { value: 'high', label: 'High Priority', color: 'var(--semantic-error-fg)' },
  { value: 'medium', label: 'Medium Priority', color: 'var(--semantic-warning-fg)' },
  { value: 'low', label: 'Low Priority', color: 'var(--text-secondary)' },
];

export default function TaskModal({ isOpen, onClose, onSave, task = null }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('follow_up');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');

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
    async function loadAssociations() {
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
      loadAssociations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setType(task.type || 'follow_up');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setDueDate(task.due_date ? task.due_date.slice(0, 16) : '');
      setLeadId(task.lead_id || '');
      setContactId(task.contact_id || '');
      setDealId(task.deal_id || '');
    } else {
      setTitle('');
      setDescription('');
      setType('follow_up');
      setPriority('medium');
      setStatus('pending');
      const tomorrow = new Date(Date.now() + 86400000);
      tomorrow.setHours(17, 0, 0, 0);
      setDueDate(tomorrow.toISOString().slice(0, 16));
      setLeadId('');
      setContactId('');
      setDealId('');
    }
    setError('');
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        lead_id: leadId || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
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
              <CheckSquare size={17} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {task ? 'Edit Task Reminder' : 'New Task & Follow-up'}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Keep sales deals moving forward with clear action items
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
            <Input
              label="Task Action / Summary"
              placeholder="e.g. Schedule product demo with engineering VP"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Action Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
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
                  {TASK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
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
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Due Date & Time"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
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
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Completed / Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Context Attachment Dropdowns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Link to Opportunity / Deal
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
                  <option value="">None / Independent</option>
                  {dealsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Link to Contact
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
                  <option value="">None / Independent</option>
                  {contactsList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name || `${c.first_name} ${c.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Link to Inbound Lead
                </label>
                <select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
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
                  <option value="">None / Independent</option>
                  {leadsList.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name || `${l.first_name} ${l.last_name}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Detailed Instructions & Brief
              </label>
              <textarea
                rows={2}
                placeholder="Specific agenda, prep items, or background context..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
              {task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
