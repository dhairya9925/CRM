import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Calendar,
  Tag,
  CheckCircle2,
  ArrowRight,
  Edit3,
  Trash2,
  Activity,
  User,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import { getLeadActivities } from '../../services/api';

export default function LeadDrawer({
  lead,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onOpenConvert,
  onStatusChange,
}) {
  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !lead?.id) return;

    let isMounted = true;
    async function loadActivities() {
      setIsLoadingActivities(true);
      try {
        const res = await getLeadActivities(lead.id).catch(() => []);
        if (isMounted) {
          setActivities(Array.isArray(res) ? res : []);
        }
      } finally {
        if (isMounted) setIsLoadingActivities(false);
      }
    }

    loadActivities();
    return () => {
      isMounted = false;
    };
  }, [isOpen, lead?.id]);

  if (!isOpen || !lead) return null;

  const fullName = lead.full_name || `${lead.first_name} ${lead.last_name}`;

  const handleStatusSelect = async (newStatus) => {
    try {
      setIsUpdatingStatus(true);
      await onStatusChange(lead.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove lead ${fullName}?`)) return;
    try {
      setIsDeleting(true);
      await onDelete(lead.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {fullName}
                </h2>
                {lead.is_converted && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--semantic-success-bg)',
                      color: 'var(--semantic-success-fg)',
                      border: '1px solid var(--semantic-success-fg)33',
                    }}
                  >
                    Converted
                  </span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {lead.company_name || lead.company || 'Prospective Lead'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(lead);
              }}
              title="Edit Lead"
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
              title="Delete Lead"
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Conversion Action Box */}
          {!lead.is_converted ? (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--accent-muted)',
                borderRadius: '6px',
                border: '1px solid var(--accent-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }}>
                  Ready for Conversion?
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Promote lead into an active Contact and pipeline Deal.
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => {
                  onClose();
                  onOpenConvert(lead);
                }}
              >
                Convert Lead
              </Button>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--semantic-success-bg)',
                borderRadius: '6px',
                border: '1px solid var(--semantic-success-fg)33',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <CheckCircle2 size={18} color="var(--semantic-success-fg)" />
              <div style={{ fontSize: '12px', color: 'var(--semantic-success-fg)' }}>
                This lead has been successfully converted into an active Contact and Pipeline Deal.
              </div>
            </div>
          )}

          {/* Status & Stage Selector */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Pipeline Status
              </div>
              <div style={{ marginTop: '4px' }}>
                <StatusBadge status={lead.status} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Change:</span>
              <select
                value={lead.status}
                disabled={isUpdatingStatus}
                onChange={(e) => handleStatusSelect(e.target.value)}
                style={{
                  height: '32px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '4px',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                  padding: '0 8px',
                }}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          {/* Lead Information Card */}
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
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                      {lead.email}
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
                  {lead.phone || <span style={{ color: 'var(--text-disabled)' }}>No phone registered</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Building2 size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Company</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {lead.company_name || lead.company || 'Not Specified'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Tag size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Acquisition Channel</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                  {(lead.source || 'website').replace(/_/g, ' ')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Created At</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Activities Timeline */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Activity size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Activity Audit Trail
              </h4>
            </div>

            {isLoadingActivities ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                Loading activity history...
              </div>
            ) : activities.length === 0 ? (
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
                Lead record initialized. No further outreach events recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '5px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {act.title || act.type}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {act.description && (
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {act.description}
                      </p>
                    )}
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
