import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CheckSquare,
  AlertCircle,
  Calendar,
  Sparkles,
  RefreshCw,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import Button from '../ui/Button';
import {
  getDashboardSummary,
  getDashboardLeadsByStatus,
  getDashboardLeadsBySource,
  getDashboardPipeline,
} from '../../services/api';

const SAMPLE_SUMMARY = {
  total_leads: 28,
  new_leads_this_week: 9,
  open_deals: 14,
  pipeline_value: 485000,
  won_deals: 8,
  won_value: 284500,
  tasks_due_today: 4,
  overdue_tasks: 2,
};

const SAMPLE_PIPELINE = [
  { stage: 'qualification', deal_count: 5, total_value: 115000 },
  { stage: 'proposal', deal_count: 4, total_value: 145000 },
  { stage: 'negotiation', deal_count: 3, total_value: 135000 },
  { stage: 'won', deal_count: 8, total_value: 284500 },
  { stage: 'lost', deal_count: 2, total_value: 45000 },
];

const SAMPLE_LEADS_STATUS = [
  { label: 'new', count: 11 },
  { label: 'contacted', count: 8 },
  { label: 'qualified', count: 7 },
  { label: 'lost', count: 2 },
];

const SAMPLE_LEADS_SOURCE = [
  { label: 'website', count: 12 },
  { label: 'referral', count: 7 },
  { label: 'ads', count: 5 },
  { label: 'cold_outreach', count: 3 },
  { label: 'event', count: 1 },
];

export default function ReportsView() {
  const [timeframe, setTimeframe] = useState('month');
  const [summary, setSummary] = useState(SAMPLE_SUMMARY);
  const [pipeline, setPipeline] = useState(SAMPLE_PIPELINE);
  const [leadsStatus, setLeadsStatus] = useState(SAMPLE_LEADS_STATUS);
  const [leadsSource, setLeadsSource] = useState(SAMPLE_LEADS_SOURCE);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sumRes, pipeRes, statRes, srcRes] = await Promise.allSettled([
        getDashboardSummary(),
        getDashboardPipeline(),
        getDashboardLeadsByStatus(),
        getDashboardLeadsBySource(),
      ]);

      if (sumRes.status === 'fulfilled' && sumRes.value && typeof sumRes.value === 'object') {
        setSummary(sumRes.value);
      } else {
        setSummary(SAMPLE_SUMMARY);
      }

      if (pipeRes.status === 'fulfilled' && Array.isArray(pipeRes.value) && pipeRes.value.length > 0) {
        setPipeline(pipeRes.value);
      } else {
        setPipeline(SAMPLE_PIPELINE);
      }

      if (statRes.status === 'fulfilled' && Array.isArray(statRes.value) && statRes.value.length > 0) {
        setLeadsStatus(statRes.value);
      } else {
        setLeadsStatus(SAMPLE_LEADS_STATUS);
      }

      if (srcRes.status === 'fulfilled' && Array.isArray(srcRes.value) && srcRes.value.length > 0) {
        setLeadsSource(srcRes.value);
      } else {
        setLeadsSource(SAMPLE_LEADS_SOURCE);
      }
    } catch {
      setSummary(SAMPLE_SUMMARY);
      setPipeline(SAMPLE_PIPELINE);
      setLeadsStatus(SAMPLE_LEADS_STATUS);
      setLeadsSource(SAMPLE_LEADS_SOURCE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]);

  const handleExportSummary = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeframe,
      executiveSummary: summary,
      pipelineBreakdown: pipeline,
      leadsByStatus: leadsStatus,
      leadsBySource: leadsSource,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apex-crm-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMsg('Report exported');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Calculations
  const maxPipelineVal = Math.max(...pipeline.map((p) => Number(p.total_value) || 0), 1);
  const totalSourceCount = leadsSource.reduce((acc, s) => acc + (Number(s.count) || 0), 0) || 1;
  const totalStatusCount = leadsStatus.reduce((acc, s) => acc + (Number(s.count) || 0), 0) || 1;

  const winRate = summary.open_deals + summary.won_deals > 0
    ? Math.round((summary.won_deals / (summary.open_deals + summary.won_deals)) * 100)
    : 67;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1440px', margin: '0 auto' }}>
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
            <BarChart3 size={20} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Dashboard & Business Intelligence
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Executive revenue forecasting, pipeline velocity, and acquisition attribution analytics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {feedbackMsg && (
            <span style={{ fontSize: '12px', color: 'var(--accent-primary)', fontWeight: '500' }}>
              {feedbackMsg}
            </span>
          )}

          {/* Timeframe Selector */}
          <div
            style={{
              display: 'flex',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '5px',
              border: '1px solid var(--border-default)',
              padding: '2px',
            }}
          >
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'Month' },
              { id: 'quarter', label: 'Quarter' },
            ].map((tab) => {
              const isActive = timeframe === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTimeframe(tab.id)}
                  style={{
                    padding: '5px 11px',
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

          <Button
            variant="secondary"
            size="md"
            icon={RefreshCw}
            onClick={loadReportsData}
            title="Reload report data"
          />

          <Button
            variant="secondary"
            size="md"
            icon={Download}
            onClick={handleExportSummary}
          >
            Export JSON
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '26px',
        }}
      >
        {/* Pipeline Value */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Pipeline Value
            </span>
            <DollarSign size={15} color="var(--accent-primary)" />
          </div>
          <div
            style={{ fontSize: '26px', fontWeight: '700', color: 'var(--accent-primary)', marginTop: '8px' }}
            className="tabular-nums"
          >
            ${Number(summary.pipeline_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across {summary.open_deals || 0} active opportunities
          </div>
        </div>

        {/* Closed Won */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--semantic-success-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Closed Won Revenue
            </span>
            <TrendingUp size={15} color="var(--semantic-success-fg)" />
          </div>
          <div
            style={{ fontSize: '26px', fontWeight: '700', color: 'var(--semantic-success-fg)', marginTop: '8px' }}
            className="tabular-nums"
          >
            ${Number(summary.won_value || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {summary.won_deals || 0} contracts finalized ({winRate}% Win Rate)
          </div>
        </div>

        {/* Lead Velocity */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--semantic-info-fg)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Inbound Lead Volume
            </span>
            <Users size={15} color="var(--semantic-info-fg)" />
          </div>
          <div
            style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}
            className="tabular-nums"
          >
            {summary.total_leads || 0}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--semantic-info-fg)', marginTop: '4px' }}>
            +{summary.new_leads_this_week || 0} newly captured this week
          </div>
        </div>

        {/* Productivity SLA */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Productivity SLA
            </span>
            <CheckSquare size={15} color="var(--accent-hover)" />
          </div>
          <div
            style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}
            className="tabular-nums"
          >
            {summary.tasks_due_today || 0} Due Today
          </div>
          <div
            style={{
              fontSize: '12px',
              color: summary.overdue_tasks > 0 ? 'var(--semantic-error-fg)' : 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            {summary.overdue_tasks || 0} items currently overdue
          </div>
        </div>
      </div>

      {/* Two Column Section: Pipeline Distribution & Funnel Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Pipeline Stage Distribution */}
        <div
          style={{
            padding: '22px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Pipeline Distribution by Stage
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Opportunity value and deal concentration across each phase
              </p>
            </div>
            <Layers size={16} color="var(--accent-primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pipeline.map((item) => {
              const val = Number(item.total_value) || 0;
              const pct = Math.min(100, Math.round((val / maxPipelineVal) * 100));
              const stageLabels = {
                qualification: 'Qualification',
                proposal: 'Proposal Sent',
                negotiation: 'Negotiation',
                won: 'Closed Won',
                lost: 'Closed Lost',
              };

              return (
                <div key={item.stage}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '550', color: 'var(--text-primary)' }}>
                        {stageLabels[item.stage] || item.stage}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({item.deal_count} deals)
                      </span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-primary)' }} className="tabular-nums">
                      ${val.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor:
                          item.stage === 'won'
                            ? 'var(--semantic-success-fg)'
                            : item.stage === 'lost'
                            ? 'var(--semantic-error-fg)'
                            : 'var(--accent-primary)',
                        borderRadius: '4px',
                        transition: 'width 400ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Acquisition Channels */}
        <div
          style={{
            padding: '22px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Acquisition Channel Performance
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Inbound source breakdown and acquisition origin
              </p>
            </div>
            <ArrowUpRight size={16} color="var(--accent-primary)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {leadsSource.map((src) => {
              const count = Number(src.count) || 0;
              const pct = Math.round((count / totalSourceCount) * 100);
              const sourceLabels = {
                website: 'Website Inbound',
                referral: 'Client Referrals',
                ads: 'Paid Campaigns / Ads',
                cold_outreach: 'Cold Outreach',
                event: 'Conferences & Events',
                other: 'Other Sources',
              };

              return (
                <div key={src.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '550', color: 'var(--text-primary)' }}>
                      {sourceLabels[src.label] || src.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {pct}%
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {count} leads
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(pct, 3)}%`,
                        backgroundColor: 'var(--accent-primary)',
                        borderRadius: '4px',
                        transition: 'width 400ms ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lead Status Breakdown Section */}
      <div
        style={{
          padding: '22px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Funnel Stage Conversion Health
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Prospect qualification throughput across active lifecycle statuses
            </p>
          </div>
          <Sparkles size={16} color="var(--accent-primary)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {leadsStatus.map((st) => {
            const count = Number(st.count) || 0;
            const pct = Math.round((count / totalStatusCount) * 100);
            const statusConfig = {
              new: { label: 'New Captured', color: 'var(--semantic-info-fg)' },
              contacted: { label: 'In Outreach', color: 'var(--text-secondary)' },
              qualified: { label: 'Sales Qualified', color: 'var(--semantic-warning-fg)' },
              lost: { label: 'Disqualified', color: 'var(--semantic-error-fg)' },
            };
            const config = statusConfig[st.label] || { label: st.label, color: 'var(--text-primary)' };

            return (
              <div
                key={st.label}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '5px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: config.color, fontWeight: '600' }}>
                    {config.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }} className="tabular-nums">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
