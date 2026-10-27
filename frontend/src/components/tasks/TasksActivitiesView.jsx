import React, { useState } from 'react';
import { CheckSquare, Activity } from 'lucide-react';
import TasksView from './TasksView';
import ActivityTimelineView from '../activities/ActivityTimelineView';

export default function TasksActivitiesView() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'activities'

  return (
    <div>
      {/* Subnav Pill Header */}
      <div
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-canvas)',
          padding: '12px 32px 0',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'tasks' ? '600' : '450',
            color: activeTab === 'tasks' ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'tasks' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: 0,
            transition: 'all 120ms ease',
          }}
        >
          <CheckSquare size={16} color={activeTab === 'tasks' ? 'var(--accent-primary)' : 'currentColor'} />
          <span>Tasks & Reminders</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'activities' ? '600' : '450',
            color: activeTab === 'activities' ? 'var(--text-primary)' : 'var(--text-muted)',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'activities' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: 0,
            transition: 'all 120ms ease',
          }}
        >
          <Activity size={16} color={activeTab === 'activities' ? 'var(--accent-primary)' : 'currentColor'} />
          <span>Activity Timeline Feed</span>
        </button>
      </div>

      {activeTab === 'tasks' ? <TasksView /> : <ActivityTimelineView />}
    </div>
  );
}
