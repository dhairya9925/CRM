import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  DollarSign,
  CheckSquare,
  BarChart3,
  LogOut,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ activeNav = 'overview', onSelectNav }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: '14' },
    { id: 'contacts', label: 'Contacts', icon: UserCheck },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'deals', label: 'Deals & Pipeline', icon: DollarSign },
    { id: 'tasks', label: 'Tasks & Activities', icon: CheckSquare, badge: '5' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <aside
      style={{
        width: '232px',
        minWidth: '232px',
        height: '100vh',
        backgroundColor: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '5px',
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
              fontSize: '16px',
              color: 'var(--accent-primary)',
            }}
          >
            A
          </span>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Apex CRM
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Enterprise Workspace
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div
        style={{
          flex: 1,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '4px 10px 8px',
          }}
        >
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNav && onSelectNav(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '5px',
                fontSize: '13px',
                fontWeight: isActive ? '600' : '450',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                transition: 'all 120ms ease',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon
                  size={17}
                  color={isActive ? 'var(--accent-primary)' : 'var(--text-muted)'}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '11px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom User Profile & Sign Out */}
      <div
        style={{
          padding: '14px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-sidebar)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <Avatar name={user?.full_name || 'User'} size={32} />
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.full_name || 'CRM User'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  color: user?.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-muted)',
                  textTransform: 'capitalize',
                  fontWeight: '500',
                }}
              >
                {user?.role ? user.role.replace('_', ' ') : 'User'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Sign out of Apex CRM"
          style={{
            padding: '7px',
            borderRadius: '4px',
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            border: '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--semantic-error-fg)';
            e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
