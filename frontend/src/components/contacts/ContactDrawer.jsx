import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Edit3,
  Trash2,
  Calendar,
  FileText,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';
import { getContactDeals, getContactActivities, getCompany } from '../../services/api';

export default function ContactDrawer({
  contact,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) {
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !contact?.id) return;

    let isMounted = true;
    async function fetchRelations() {
      setIsLoadingDetails(true);
      try {
        const promises = [
          getContactDeals(contact.id).catch(() => []),
          getContactActivities(contact.id).catch(() => []),
        ];

        if (contact.company_id) {
          promises.push(getCompany(contact.company_id).catch(() => null));
        }

        const [dealsRes, activitiesRes, compRes] = await Promise.all(promises);

        if (isMounted) {
          setDeals(Array.isArray(dealsRes) ? dealsRes : []);
          setActivities(Array.isArray(activitiesRes) ? activitiesRes : []);
          if (compRes?.name) {
            setCompanyName(compRes.name);
          } else {
            setCompanyName('');
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
  }, [isOpen, contact]);

  if (!isOpen || !contact) return null;

  const fullName = contact.full_name || `${contact.first_name} ${contact.last_name}`;

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${fullName}?`)) return;
    try {
      setIsDeleting(true);
      await onDelete(contact.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = contact.created_at
    ? new Date(contact.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recently';

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
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Avatar name={fullName} size={42} />
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {fullName}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {companyName || contact.company_name || 'Individual Contact'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(contact);
              }}
              title="Edit Contact"
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
              title="Delete Contact"
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

        {/* Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Contact Details Card */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      {contact.email}
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-disabled)' }}>No email registered</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Phone size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {contact.phone || <span style={{ color: 'var(--text-disabled)' }}>No phone registered</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Organization</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {companyName || contact.company_name || 'Independent / Not Assigned'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Added to CRM</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={15} color="var(--accent-primary)" />
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Relationship Notes
                </h4>
              </div>
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {contact.notes}
              </div>
            </div>
          )}

          {/* Associated Deals */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <DollarSign size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Associated Deals ({deals.length})
              </h4>
            </div>

            {deals.length === 0 ? (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                No active deals linked with this contact.
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
