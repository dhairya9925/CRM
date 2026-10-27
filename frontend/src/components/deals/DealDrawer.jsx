import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Building2,
  UserCheck,
  Calendar,
  Edit3,
  Trash2,
  Activity,
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { getDealActivities, getCompany, getContact } from '../../services/api';

const PIPELINE_STAGES = [
  { id: 'qualification', label: 'Qualification' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'won', label: 'Closed Won' },
  { id: 'lost', label: 'Closed Lost' },
];

export default function DealDrawer({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStageChange,
}) {
  const [activities, setActivities] = useState([]);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !deal?.id) return;

    let isMounted = true;
    async function loadExtra() {
      setIsLoadingDetails(true);
      try {
        const promises = [getDealActivities(deal.id).catch(() => [])];
        if (deal.company_id) {
          promises.push(getCompany(deal.company_id).catch(() => null));
        }
        if (deal.contact_id) {
          promises.push(getContact(deal.contact_id).catch(() => null));
        }

        const [actRes, compRes, contRes] = await Promise.all(promises);
        if (isMounted) {
          setActivities(Array.isArray(actRes) ? actRes : []);
          if (compRes?.name) setCompanyName(compRes.name);
          else setCompanyName('');
          if (contRes?.full_name || contRes?.first_name) {
            setContactName(contRes.full_name || `${contRes.first_name} ${contRes.last_name}`);
          } else {
            setContactName('');
          }
        }
      } finally {
        if (isMounted) setIsLoadingDetails(false);
      }
    }

    loadExtra();
    return () => {
      isMounted = false;
    };
  }, [isOpen, deal]);

  if (!isOpen || !deal) return null;

  const currentStageIndex = PIPELINE_STAGES.findIndex((s) => s.id === deal.stage);

  const handleStageSelect = async (newStage) => {
    try {
      setIsUpdatingStage(true);
      await onStageChange(deal.id, newStage);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove deal "${deal.name}"?`)) return;
    try {
      setIsDeleting(true);
      await onDelete(deal.id);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const formattedDate = deal.expected_close_date
    ? new Date(deal.expected_close_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not set';

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
              <DollarSign size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {deal.name}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {companyName || deal.company_name || 'Enterprise Opportunity'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(deal);
              }}
              title="Edit Deal"
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
              title="Delete Deal"
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
          {/* Prominent Value Banner */}
          <div
            style={{
              padding: '20px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Estimated Contract Value
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--accent-primary)',
                  letterSpacing: '-0.02em',
                  marginTop: '4px',
                }}
                className="tabular-nums"
              >
                ${Number(deal.value || 0).toLocaleString()}
              </div>
            </div>
            <StatusBadge status={deal.stage} size="md" />
          </div>

          {/* Pipeline Stage Progression Stepper */}
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Pipeline Stage Progression
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px',
                backgroundColor: 'var(--bg-canvas)',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {PIPELINE_STAGES.map((st, idx) => {
                const isCurrent = deal.stage === st.id;
                const isPast = idx < currentStageIndex;
                return (
                  <button
                    key={st.id}
                    type="button"
                    disabled={isUpdatingStage}
                    onClick={() => handleStageSelect(st.id)}
                    style={{
                      padding: '8px 4px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: isCurrent ? '650' : '450',
                      textAlign: 'center',
                      backgroundColor: isCurrent
                        ? 'var(--accent-primary)'
                        : isPast
                        ? 'var(--accent-muted)'
                        : 'transparent',
                      color: isCurrent
                        ? 'var(--text-on-accent)'
                        : isPast
                        ? 'var(--accent-primary)'
                        : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 120ms ease',
                    }}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deal Metadata */}
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
              <Building2 size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Corporate Account</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {companyName || deal.company_name || 'Independent / Not Assigned'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Key Stakeholder Contact</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {contactName || deal.contact_name || 'No Direct Contact Linked'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={16} color="var(--accent-primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Close Date</div>
                <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>

          {/* Activities Audit */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Activity size={16} color="var(--accent-primary)" />
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pipeline Activity Trail
              </h4>
            </div>

            {isLoadingDetails ? (
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
                Opportunity initiated. No stage movement conflicts or logs recorded.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
