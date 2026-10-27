import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';

export default function OverviewDashboard({ leads = [], onAddLeadClick }) {
  const [dateFilter, setDateFilter] = useState('month');
  const [tableFilter, setTableFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');

  // Sample follow-ups / tasks
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Call Sarah Jenkins regarding enterprise security review', due: 'Today, 2:30 PM', priority: 'high', company: 'Nexus Dynamics', done: false },
    { id: 't2', title: 'Send updated SaaS contract proposal to Acme Corp', due: 'Today, 5:00 PM', priority: 'medium', company: 'Acme Corp', done: false },
    { id: 't3', title: 'Schedule Q4 pipeline alignment with sales directors', due: 'Tomorrow, 10:00 AM', priority: 'low', company: 'Internal', done: false },
    { id: 't4', title: 'Confirm onboarding milestones with FinTech Global', due: 'Oct 29', priority: 'medium', company: 'FinTech Global', done: true },
  ]);

  const toggleTask = (taskId) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
  };

  // Pipeline stages breakdown
  const stages = [
    { name: 'Prospecting', count: 18, value: '$240,000', percentage: 25 },
    { name: 'Qualification', count: 12, value: '$380,000', percentage: 40 },
    { name: 'Proposal Sent', count: 9, value: '$450,000', percentage: 65 },
    { name: 'Negotiation', count: 5, value: '$350,000', percentage: 85 },
    { name: 'Closed Won', count: 14, value: '$284,500', percentage: 100 },
  ];

  // Filter leads for the table
  const filteredLeads = leads.filter((lead) => {
    const matchesFilter = tableFilter === 'all' || lead.status === tableFilter;
    const matchesSearch =
      tableSearch === '' ||
      lead.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      lead.company.toLowerCase().includes(tableSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(tableSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}
          >
            Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time summary of business activity, pipeline velocity, and follow-up priorities.
          </p>
        </div>

        {/* Date Filter & Header Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'quarter', label: 'Quarter' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: dateFilter === tab.id ? '600' : '450',
                  color: dateFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  backgroundColor: dateFilter === tab.id ? 'var(--bg-surface-active)' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button variant="primary" size="sm" onClick={onAddLeadClick}>
            + Create Lead
          </Button>
        </div>
      </div>

      {/* Primary Metrics Grid (4 Metric Blocks per Section 6.1) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
        aria-label="Key Performance Indicators"
      >
        {/* Metric 1: Active Leads */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Active Leads
            </span>
            <span style={{ fontSize: '11px', color: 'var(--semantic-success-fg)', fontWeight: '500' }}>
              +14.2%
            </span>
          </div>
          <div
            className="tabular-nums"
            style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}
          >
            {leads.length + 118}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            42 qualified this period
          </div>
        </div>

        {/* Metric 2: Open Pipeline Value */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Open Pipeline Value
            </span>
            <span style={{ fontSize: '11px', color: 'var(--semantic-success-fg)', fontWeight: '500' }}>
              +8.5%
            </span>
          </div>
          <div
            className="tabular-nums"
            style={{ fontSize: '24px', fontWeight: '600', color: 'var(--accent-primary)' }}
          >
            $1,420,000
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            44 active opportunities
          </div>
        </div>

        {/* Metric 3: Deals Won */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Closed Won Revenue
            </span>
            <span style={{ fontSize: '11px', color: 'var(--semantic-success-fg)', fontWeight: '500' }}>
              +19.1%
            </span>
          </div>
          <div
            className="tabular-nums"
            style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}
          >
            $284,500
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            14 deals closed in {dateFilter}
          </div>
        </div>

        {/* Metric 4: Follow-ups Due */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Follow-ups Due
            </span>
            <span style={{ fontSize: '11px', color: 'var(--semantic-warning-fg)', fontWeight: '500' }}>
              {tasks.filter(t => !t.done).length} Pending
            </span>
          </div>
          <div
            className="tabular-nums"
            style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}
          >
            {tasks.filter(t => !t.done).length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            2 high-priority actions
          </div>
        </div>
      </section>

      {/* Main Workspace Split: Pipeline Stage Breakdown & Tasks Priority */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: '20px',
        }}
      >
        {/* Pipeline Stage Distribution Panel */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Sales Pipeline Stage Distribution
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Stage velocity and potential revenue conversion
              </p>
            </div>
            <span style={{ fontSize: '12px', fontWeight: '550', color: 'var(--text-secondary)' }}>
              Total: $1.70M
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
            {stages.map((stage) => (
              <div key={stage.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                    {stage.name}
                  </span>
                  <div style={{ display: 'flex', gap: '14px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{stage.count} deals</span>
                    <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                      {stage.value}
                    </span>
                  </div>
                </div>
                {/* Horizontal Progress Bar */}
                <div
                  style={{
                    height: '5px',
                    width: '100%',
                    backgroundColor: 'var(--bg-input)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${stage.percentage}%`,
                      backgroundColor:
                        stage.name === 'Closed Won'
                          ? 'var(--semantic-success-fg)'
                          : 'var(--accent-primary)',
                      borderRadius: '2px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks & Activities Requiring Attention */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: '6px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Priority Follow-ups
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Items requiring sales action
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-surface-active)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {tasks.filter(t => !t.done).length} Open
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '5px',
                  backgroundColor: task.done ? 'var(--bg-canvas)' : 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  opacity: task.done ? 0.6 : 1,
                  transition: 'all 120ms ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <CheckCircle2
                    size={16}
                    color={task.done ? 'var(--semantic-success-fg)' : 'var(--border-strong)'}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.done ? 'line-through' : 'none',
                    }}
                  >
                    {task.title}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <span>{task.company}</span>
                    <span>•</span>
                    <span style={{ color: task.priority === 'high' ? 'var(--semantic-error-fg)' : 'var(--text-muted)' }}>
                      {task.due}
                    </span>
                  </div>
                </div>
                <StatusBadge status={task.priority} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Section: Recent Leads Management Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Table Toolbar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Recent Opportunities & Leads
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredLeads.length} active records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Filter Tabs */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-input)',
                borderRadius: '5px',
                border: '1px solid var(--border-default)',
                padding: '2px',
              }}
            >
              {[
                { id: 'all', label: 'All' },
                { id: 'new', label: 'New' },
                { id: 'qualified', label: 'Qualified' },
                { id: 'proposal', label: 'Proposal' },
                { id: 'won', label: 'Won' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTableFilter(tab.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: tableFilter === tab.id ? '600' : '450',
                    color: tableFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    backgroundColor: tableFilter === tab.id ? 'var(--bg-surface-active)' : 'transparent',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* In-table Search */}
            <input
              type="text"
              placeholder="Filter leads..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              style={{
                height: '30px',
                fontSize: '12px',
                width: '160px',
                borderRadius: '4px',
              }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '13px',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-sidebar)',
                }}
              >
                <th style={{ padding: '10px 20px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Contact / Lead</th>
                <th style={{ padding: '10px 16px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Company</th>
                <th style={{ padding: '10px 16px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Status</th>
                <th style={{ padding: '10px 16px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Estimated Value</th>
                <th style={{ padding: '10px 16px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Owner</th>
                <th style={{ padding: '10px 20px', fontWeight: '550', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.03em', textAlign: 'right' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No leads matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      height: '52px',
                      transition: 'background-color 100ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '10px 20px' }}>
                      <div style={{ fontWeight: '550', color: 'var(--text-primary)' }}>{lead.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{lead.email}</div>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>
                      {lead.company}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td
                      className="tabular-nums"
                      style={{ padding: '10px 16px', fontWeight: '600', color: 'var(--text-primary)' }}
                    >
                      ${Number(lead.dealValue).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {lead.owner || 'Alex Rep'}
                    </td>
                    <td
                      className="tabular-nums"
                      style={{ padding: '10px 20px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}
                    >
                      {lead.createdAt || 'Today'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
