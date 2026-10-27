import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import OverviewDashboard from './components/dashboard/OverviewDashboard';
import AddLeadModal from './components/dashboard/AddLeadModal';
import { INITIAL_LEADS } from './data/leadsData';

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeNav, setActiveNav] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [leads, setLeads] = useState(INITIAL_LEADS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Subtle restrained loading state per FRONTEND_DESIGN.md
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-canvas)',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'serif',
              fontWeight: '700',
              fontSize: '18px',
              color: 'var(--accent-primary)',
            }}
          >
            A
          </span>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
          Loading Apex CRM...
        </span>
      </div>
    );
  }

  // Unauthenticated: Show Login / Registration View
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleAddLead = (newLead) => {
    setLeads([newLead, ...leads]);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
      }}
    >
      {/* Navigation Sidebar (232px wide persistent shell) */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} />

      {/* Main Application Workspace */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: 'var(--bg-canvas)',
        }}
      >
        <Topbar
          onOpenNewLead={() => setIsModalOpen(true)}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeNav === 'overview' && (
            <OverviewDashboard
              leads={leads}
              onAddLeadClick={() => setIsModalOpen(true)}
            />
          )}

          {activeNav !== 'overview' && (
            <div style={{ padding: '36px 28px', maxWidth: '800px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {activeNav.charAt(0).toUpperCase() + activeNav.slice(1)}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                This section is under active management. Navigate to <strong>Overview</strong> for real-time CRM intelligence and leads management.
              </p>
            </div>
          )}
        </main>

        {/* Lead Creation Dialog */}
        <AddLeadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddLead={handleAddLead}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
