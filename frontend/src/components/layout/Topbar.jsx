import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import Button from '../ui/Button';
import { checkBackendHealth } from '../../services/api';

export default function Topbar({ onOpenNewLead, onSearch, searchQuery = '', activeNav = 'overview' }) {
  const [backendHealth, setBackendHealth] = useState({ connected: false, checking: true });

  const navLabels = {
    overview: 'Overview',
    leads: 'Leads',
    contacts: 'Contacts',
    companies: 'Companies',
    deals: 'Deals & Pipeline',
    tasks: 'Tasks & Activities',
    reports: 'Reports',
  };

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((res) => {
      if (isMounted) {
        setBackendHealth({ connected: res.connected, checking: false });
      }
    });

    const interval = setInterval(() => {
      checkBackendHealth().then((res) => {
        if (isMounted) {
          setBackendHealth({ connected: res.connected, checking: false });
        }
      });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-canvas)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 15,
      }}
    >
      {/* Context / Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Workspace</span>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: '550' }}>
          {navLabels[activeNav] || 'Overview'}
        </span>
      </div>

      {/* Global Search Bar */}
      <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder="Search leads, deals, contacts..."
          value={searchQuery}
          onChange={(e) => onSearch && onSearch(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            paddingLeft: '32px',
            paddingRight: '12px',
            fontSize: '12px',
            borderRadius: '5px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Right Actions & Live Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Backend & DB Health Indicator */}
        <div
          title={
            backendHealth.checking
              ? 'Checking backend...'
              : backendHealth.connected
              ? 'FastAPI & PostgreSQL Connected'
              : 'Backend Disconnected'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 9px',
            borderRadius: '4px',
            backgroundColor: backendHealth.connected
              ? 'var(--semantic-success-bg)'
              : 'var(--semantic-error-bg)',
            border: `1px solid ${backendHealth.connected ? 'rgba(145, 182, 154, 0.25)' : 'rgba(213, 141, 131, 0.25)'}`,
            fontSize: '11px',
            fontWeight: '500',
            color: backendHealth.connected
              ? 'var(--semantic-success-fg)'
              : 'var(--semantic-error-fg)',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: backendHealth.connected
                ? 'var(--semantic-success-fg)'
                : 'var(--semantic-error-fg)',
            }}
          />
          <span>{backendHealth.connected ? 'API Online' : 'Offline'}</span>
        </div>

        {/* Primary Action Button */}
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={onOpenNewLead}
        >
          Add Lead
        </Button>
      </div>
    </header>
  );
}
