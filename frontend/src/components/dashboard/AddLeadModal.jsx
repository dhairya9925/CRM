import React, { useState } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function AddLeadModal({ isOpen, onClose, onAddLead }) {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [status, setStatus] = useState('new');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) {
      setError('Contact Name and Company are required.');
      return;
    }

    onAddLead({
      id: `lead-${Date.now()}`,
      name: name.trim(),
      company: company.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: phone.trim() || '+1 (555) 019-2831',
      dealValue: Number(dealValue) || 15000,
      status,
      owner: 'Current User',
      createdAt: 'Just now',
    });

    // Reset and close
    setName('');
    setCompany('');
    setEmail('');
    setPhone('');
    setDealValue('');
    setStatus('new');
    setError('');
    onClose();
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
        zIndex: 50,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
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
              Add New Lead
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Capture a prospective client in the CRM pipeline
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
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                backgroundColor: 'var(--semantic-error-bg)',
                color: 'var(--semantic-error-fg)',
                fontSize: '12px',
              }}
            >
              {error}
            </div>
          )}

          <Input
            label="Contact Full Name"
            placeholder="e.g. Eleanor Vance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Company / Organization"
            placeholder="e.g. Horizon Labs"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. eleanor@horizon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+1 (555) 012-3456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Estimated Value ($)"
              type="number"
              placeholder="25000"
              value={dealValue}
              onChange={(e) => setDealValue(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '550', color: 'var(--text-secondary)' }}>
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '5px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  padding: '0 10px',
                }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
              </select>
            </div>
          </div>

          {/* Footer Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '14px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <Button variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
