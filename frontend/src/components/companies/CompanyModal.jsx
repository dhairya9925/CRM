import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const INDUSTRIES = [
  'Technology & Software',
  'Financial Services',
  'Healthcare & Life Sciences',
  'Manufacturing & Industrial',
  'Retail & E-commerce',
  'Consulting & Professional Services',
  'Media & Telecommunications',
  'Real Estate & Construction',
  'Energy & Utilities',
  'Other',
];

export default function CompanyModal({ isOpen, onClose, onSave, company = null }) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setName(company.name || '');
      setWebsite(company.website || '');
      setIndustry(company.industry || '');
      setPhone(company.phone || '');
      setAddress(company.address || '');
    } else {
      setName('');
      setWebsite('');
      setIndustry('');
      setPhone('');
      setAddress('');
    }
    setError('');
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave({
        name: name.trim(),
        website: website.trim() || null,
        industry: industry || null,
        phone: phone.trim() || null,
        address: address.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save company.');
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
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '8px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
              {company ? 'Edit Company' : 'New Company Record'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {company ? 'Update corporate profile and directory data' : 'Register an organization account into the CRM'}
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
              label="Company Legal / Trading Name"
              placeholder="e.g. Acme Corporation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Corporate Website"
              placeholder="e.g. https://acme.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                Industry Sector
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
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
                <option value="">Select industry vertical...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Input
                label="Direct Phone"
                placeholder="+1 (555) 012-3456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Input
                label="HQ Location / City"
                placeholder="San Francisco, CA"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
              {company ? 'Save Changes' : 'Create Company'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
