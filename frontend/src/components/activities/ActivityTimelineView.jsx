import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ActivityModal from './ActivityModal';
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../../services/api';

const SAMPLE_ACTIVITIES = [
  {
    id: 'act-1',
    type: 'call',
    outcome: 'Demo confirmed for Thursday 2 PM with Procurement Team',
    notes: 'Discussed CloudScale enterprise multi-region deployment. Client is very enthusiastic about SOC2 compliance features.',
    occurred_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'act-2',
    type: 'stage_change',
    outcome: 'Deal stage advanced to Negotiation',
    notes: 'Opportunity "Hyperion Logistics — Fleet Management" moved from Proposal to Negotiation.',
    occurred_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'act-3',
    type: 'email',
    outcome: 'Contract terms redline returned with legal approvals',
    notes: 'Sent formal master services agreement (MSA) and order form to FinPulse Systems VP of Finance.',
    occurred_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'act-4',
    type: 'conversion',
    outcome: 'Inbound Lead converted into Contact and Deal',
    notes: 'Marcus Vance from Hyperion Logistics successfully converted to client account.',
    occurred_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'act-5',
    type: 'meeting',
    outcome: 'Executive architecture presentation with VP Engineering',
    notes: 'Presented technical topology and security isolation boundaries for NextGen Robotics deployment.',
    occurred_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export default function ActivityTimelineView() {
  const [activities, setActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchActivitiesList = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (typeFilter !== 'all') params.type = typeFilter;
      const res = await getActivities(params);
      if (res && Array.isArray(res)) {
        if (res.length === 0 && typeFilter === 'all' && !search) {
          setActivities(SAMPLE_ACTIVITIES);
        } else {
          setActivities(res);
        }
      } else {
        setActivities(SAMPLE_ACTIVITIES);
      }
    } catch {
      setActivities(SAMPLE_ACTIVITIES);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchActivitiesList();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchActivitiesList]);

  const handleSaveActivity = async (formData) => {
    if (activityToEdit) {
      try {
        const updated = await updateActivity(activityToEdit.id, formData);
        setActivities((prev) =>
          prev.map((a) => (a.id === activityToEdit.id ? { ...a, ...updated } : a))
        );
        showFeedback('Activity updated');
      } catch {
        setActivities((prev) =>
          prev.map((a) => (a.id === activityToEdit.id ? { ...a, ...formData } : a))
        );
        showFeedback('Activity updated locally');
      }
    } else {
      try {
        const created = await createActivity(formData);
        setActivities((prev) => [created, ...prev]);
        showFeedback('Activity logged successfully');
      } catch {
        const dummy = {
          id: `act-${Date.now()}`,
          ...formData,
          occurred_at: new Date().toISOString(),
        };
        setActivities((prev) => [dummy, ...prev]);
        showFeedback('Activity logged locally');
      }
    }
  };

  const handleDeleteActivity = async (id) => {
    try {
      await deleteActivity(id);
    } catch {
      // quiet
    }
    setActivities((prev) => prev.filter((a) => a.id !== id));
    showFeedback('Activity removed');
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const getActivityVisuals = (type) => {
    switch (type) {
      case 'call':
        return { icon: Phone, color: 'var(--accent-primary)', label: 'Call Log' };
      case 'meeting':
        return { icon: Calendar, color: 'var(--semantic-warning-fg)', label: 'Meeting' };
      case 'email':
        return { icon: Mail, color: 'var(--semantic-info-fg)', label: 'Email' };
      case 'stage_change':
        return { icon: TrendingUp, color: 'var(--semantic-success-fg)', label: 'Pipeline Move' };
      case 'conversion':
        return { icon: Sparkles, color: 'var(--accent-hover)', label: 'Conversion' };
      default:
        return { icon: FileText, color: 'var(--text-secondary)', label: 'Note' };
    }
  };

  // Client search filter
  const filteredActivities = activities.filter((act) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const matchesOutcome = act.outcome?.toLowerCase().includes(q);
    const matchesNotes = act.notes?.toLowerCase().includes(q);
    return matchesOutcome || matchesNotes;
  });

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Title & Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Activity Timeline
            </h1>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              {activities.length} Events
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Unified audit stream of customer communications, team meetings, stage advances, and conversions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {feedbackMsg && (
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '500' }}>
              {feedbackMsg}
            </span>
          )}
          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={fetchActivitiesList}
            title="Refresh activity timeline"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setActivityToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Log Interaction
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '6px',
            border: '1px solid var(--border-default)',
            padding: '2px',
          }}
        >
          {[
            { id: 'all', label: 'All Interactions' },
            { id: 'call', label: 'Calls' },
            { id: 'meeting', label: 'Meetings' },
            { id: 'email', label: 'Emails' },
            { id: 'note', label: 'Notes' },
          ].map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '450',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ maxWidth: '320px', width: '100%' }}>
          <Input
            placeholder="Search notes and outcomes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {isLoading ? (
          <div
            style={{
              padding: '36px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
            }}
          >
            Loading activity trail...
          </div>
        ) : filteredActivities.length === 0 ? (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '6px',
              border: '1px solid var(--border-default)',
            }}
          >
            No activities found matching your criteria.
          </div>
        ) : (
          filteredActivities.map((act) => {
            const visuals = getActivityVisuals(act.type);
            const Icon = visuals.icon;
            const timeStr = act.occurred_at
              ? new Date(act.occurred_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently';

            return (
              <div
                key={act.id}
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  transition: 'border-color 120ms ease',
                }}
              >
                {/* Left Type Icon Bubble */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: visuals.color,
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '2px 7px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--bg-canvas)',
                          color: visuals.color,
                          border: '1px solid var(--border-subtle)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {visuals.label}
                      </span>
                      {act.outcome && (
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {act.outcome}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {timeStr}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivityToEdit(act);
                          setIsModalOpen(true);
                        }}
                        title="Edit Activity"
                        style={{
                          padding: '4px',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this activity entry?')) {
                            handleDeleteActivity(act.id);
                          }
                        }}
                        title="Delete Activity"
                        style={{
                          padding: '4px',
                          borderRadius: '4px',
                          color: 'var(--text-muted)',
                          backgroundColor: 'transparent',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--semantic-error-fg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {act.notes && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        marginTop: '6px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {act.notes}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveActivity}
        activity={activityToEdit}
      />
    </div>
  );
}
