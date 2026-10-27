import React, { useState, useEffect } from 'react';
import { X, Building2, Globe, Phone, MapPin, Users, DollarSign, Edit3, Trash2, Calendar, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';
import { getCompanyContacts, getCompanyDeals } from '../../services/api';

export default function CompanyDrawer({
  company,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !company?.id) return;

    let isMounted = true;
    async function fetchRelations() {
      setIsLoadingDetails(true);
      try {
        const [contactsRes, dealsRes] = await Promise.allSettled([
          getCompanyContacts(company.id),
          getCompanyDeals(company.id),
        ]);
        if (isMounted) {
          if (contactsRes.status === 'fulfilled' && Array.isArray(contactsRes.value)) {
            setContacts(contactsRes.value);
          } else {
            setContacts([]);
          }
          if (dealsRes.status === 'fulfilled' && Array.isArray(dealsRes.value)) {
            setDeals(dealsRes.value);
          } else {
            setDeals([]);
          }
        }
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    }

    fetchRelations();
    return () => {
      isMounted = false;
    };
  }, [isOpen, company?.id]);

  if (!isOpen || !company) return null;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${company.name}?`)) return;
    try {
      setIsDeleting(true);
      await onDelete(company.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = company.created_at
    ? new Date(company.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(2px)',
        zIndex: 55,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            backgroundColor: 'var(--bg-surface)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '6px',
                backgroundColor: 'var(--accent-muted)',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Building2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {company.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {company.industry || 'Enterprise Account'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(company);
              }}
              title="Edit Company"
              style={{
                padding: '7px',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <Edit3 size={15} />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete Company"
              style={{
                padding: '7px',
                borderRadius: '4px',
                color: 'var(--semantic-error-fg)',
                backgroundColor: 'var(--semantic-error-bg)',
                border: '1px solid rgba(213, 141, 131, 0.2)',
              }}
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                backgroundColor: 'transparent',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Details Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Website</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {company.website ? (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                  >
                    <span>{company.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-disabled)' }}>—</span>
                )}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Direct Phone</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {company.phone || <span style={{ color: 'var(--text-disabled)' }}>—</span>}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {company.address || <span style={{ color: 'var(--text-disabled)' }}>—</span>}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Established In CRM</div>
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {formattedDate}
              </div>
            </div>
          </div>

          {/* Associated Contacts */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Associated Contacts ({contacts.length})
                </h4>
              </div>
            </div>

            {isLoadingDetails ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Loading contacts...
              </div>
            ) : contacts.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                No contacts currently linked to this organization.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar name={contact.full_name || `${contact.first_name} ${contact.last_name}`} size={28} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '550', color: 'var(--text-primary)' }}>
                          {contact.full_name || `${contact.first_name} ${contact.last_name}`}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {contact.email || contact.phone || 'No direct communication info'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Associated Deals */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={16} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Pipeline Deals ({deals.length})
                </h4>
              </div>
            </div>

            {deals.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                No active sales opportunities for this account.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {deals.map((deal) => (
                  <div
                    key={deal.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '550', color: 'var(--text-primary)' }}>
                        {deal.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '600', marginTop: '2px' }}>
                        ${Number(deal.value || 0).toLocaleString()}
                      </div>
                    </div>
                    <StatusBadge status={deal.stage} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
