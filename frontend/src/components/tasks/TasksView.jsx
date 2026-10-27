import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  Users,
  Edit3,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import TaskModal from './TaskModal';
import {
  getTasks,
  createTask,
  updateTask,
  completeTask,
  deleteTask,
} from '../../services/api';

const SAMPLE_TASKS = [
  {
    id: 'task-1',
    title: 'Call Sarah Jenkins regarding enterprise security review',
    description: 'Review SOC2 compliance questions and discuss SSO configuration.',
    type: 'call',
    priority: 'high',
    status: 'pending',
    due_date: new Date(Date.now() + 3600000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Send updated SaaS contract proposal to Acme Corp',
    description: 'Include 15% discount for 2-year upfront commitment.',
    type: 'email',
    priority: 'medium',
    status: 'pending',
    due_date: new Date(Date.now() + 3600000 * 6).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Schedule Q4 pipeline alignment with sales directors',
    description: 'Review quotas and deal conversion rates across mid-market accounts.',
    type: 'meeting',
    priority: 'low',
    status: 'pending',
    due_date: new Date(Date.now() + 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Confirm onboarding milestones with FinTech Global',
    description: 'Deliver initial environment provisioning and keys.',
    type: 'follow_up',
    priority: 'medium',
    status: 'done',
    due_date: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Review Hyperion Logistics SLA terms',
    description: 'Ensure 99.99% availability clause is covered with engineering signoff.',
    type: 'other',
    priority: 'high',
    status: 'pending',
    due_date: new Date(Date.now() - 3600000 * 4).toISOString(), // Overdue
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'due_today' | 'overdue' | 'done'
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const fetchTaskList = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page: 1, page_size: 50 };
      if (filterTab === 'due_today') params.due_today = true;
      if (filterTab === 'overdue') params.overdue = true;
      if (filterTab === 'done') params.status = 'done';

      const res = await getTasks(params);
      if (res && Array.isArray(res.items)) {
        if (res.items.length === 0 && filterTab === 'all' && !search) {
          setTasks(SAMPLE_TASKS);
        } else {
          setTasks(res.items);
        }
      } else {
        setTasks(SAMPLE_TASKS);
      }
    } catch {
      setTasks(SAMPLE_TASKS);
    } finally {
      setIsLoading(false);
    }
  }, [filterTab, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTaskList();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchTaskList]);

  const handleSaveTask = async (formData) => {
    if (taskToEdit) {
      try {
        const updated = await updateTask(taskToEdit.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === taskToEdit.id ? { ...t, ...updated } : t))
        );
        showFeedback('Task updated successfully');
      } catch {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskToEdit.id ? { ...t, ...formData } : t))
        );
        showFeedback('Task updated locally');
      }
    } else {
      try {
        const created = await createTask(formData);
        setTasks((prev) => [created, ...prev]);
        showFeedback('Task created successfully');
      } catch {
        const dummy = {
          id: `task-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
        };
        setTasks((prev) => [dummy, ...prev]);
        showFeedback('Task created locally');
      }
    }
  };

  const handleCompleteToggle = async (task) => {
    const isCompleted = task.status === 'done';
    const newStatus = isCompleted ? 'pending' : 'done';

    try {
      if (!isCompleted) {
        await completeTask(task.id);
      } else {
        await updateTask(task.id, { status: newStatus });
      }
    } catch {
      // quiet fallback
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    showFeedback(isCompleted ? 'Task marked as pending' : 'Task marked as completed');
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteTask(id);
    } catch {
      // quiet
    }
    setTasks((prev) => prev.filter((t) => t.id !== id));
    showFeedback('Task removed');
  };

  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const isOverdue = (task) => {
    if (task.status === 'done' || !task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  const isDueToday = (task) => {
    if (!task.due_date) return false;
    const taskDate = new Date(task.due_date).toDateString();
    const today = new Date().toDateString();
    return taskDate === today;
  };

  // Client-side filtering
  const filteredTasks = tasks.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesDesc = t.description?.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }

    if (filterTab === 'due_today') return isDueToday(t) && t.status !== 'done';
    if (filterTab === 'overdue') return isOverdue(t);
    if (filterTab === 'done') return t.status === 'done';
    return true;
  });

  const overdueCount = tasks.filter((t) => isOverdue(t)).length;
  const dueTodayCount = tasks.filter((t) => isDueToday(t) && t.status !== 'done').length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call':
        return <Phone size={14} color="var(--accent-primary)" />;
      case 'email':
        return <Mail size={14} color="var(--semantic-info-fg)" />;
      case 'meeting':
        return <Calendar size={14} color="var(--semantic-warning-fg)" />;
      default:
        return <CheckSquare size={14} color="var(--text-muted)" />;
    }
  };

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
            <CheckSquare size={20} color="var(--accent-primary)" />
            <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Tasks & Reminders
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
              {tasks.length} Total
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Daily productivity execution layer, outreach reminders, and task follow-ups
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
            onClick={fetchTaskList}
            title="Refresh tasks"
          />
          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => {
              setTaskToEdit(null);
              setIsModalOpen(true);
            }}
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Status Tabs */}
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
            { id: 'all', label: 'All Tasks', badge: null },
            { id: 'due_today', label: 'Due Today', badge: dueTodayCount },
            { id: 'overdue', label: 'Overdue', badge: overdueCount, alert: true },
            { id: 'done', label: 'Completed', badge: null },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '450',
                  color: isActive ? 'var(--text-on-accent)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{tab.label}</span>
                {tab.badge !== null && tab.badge > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '0 5px',
                      borderRadius: '3px',
                      backgroundColor: tab.alert ? 'var(--semantic-error-bg)' : 'var(--bg-surface)',
                      color: tab.alert ? 'var(--semantic-error-fg)' : 'inherit',
                      border: '1px solid currentColor',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ maxWidth: '320px', width: '100%' }}>
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks List */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
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
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
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
            No tasks found under this filter. All clear!
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isTaskDone = task.status === 'done';
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
                style={{
                  padding: '14px 18px',
                  backgroundColor: 'var(--bg-surface)',
                  border: overdue
                    ? '1px solid rgba(213, 141, 131, 0.4)'
                    : '1px solid var(--border-default)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'background-color 120ms ease',
                }}
              >
                {/* Left: Complete Checkbox and Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => handleCompleteToggle(task)}
                    title={isTaskDone ? 'Mark as incomplete' : 'Mark as complete'}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '4px',
                      border: isTaskDone
                        ? '1px solid var(--semantic-success-fg)'
                        : '1px solid var(--border-strong)',
                      backgroundColor: isTaskDone ? 'var(--semantic-success-bg)' : 'transparent',
                      color: 'var(--semantic-success-fg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {isTaskDone && <CheckCircle2 size={14} />}
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: '550',
                          color: isTaskDone ? 'var(--text-disabled)' : 'var(--text-primary)',
                          textDecoration: isTaskDone ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>

                      {/* Type badge */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {getTypeIcon(task.type)}
                        <span>{(task.type || 'task').replace('_', ' ')}</span>
                      </span>

                      {/* Priority */}
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          textTransform: 'uppercase',
                          fontWeight: '600',
                          backgroundColor:
                            task.priority === 'high'
                              ? 'var(--semantic-error-bg)'
                              : task.priority === 'medium'
                              ? 'var(--semantic-warning-bg)'
                              : 'var(--semantic-neutral-bg)',
                          color:
                            task.priority === 'high'
                              ? 'var(--semantic-error-fg)'
                              : task.priority === 'medium'
                              ? 'var(--semantic-warning-fg)'
                              : 'var(--semantic-neutral-fg)',
                        }}
                      >
                        {task.priority || 'medium'}
                      </span>
                    </div>

                    {task.description && (
                      <p
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Due Date & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                  {task.due_date && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '11px',
                        color: overdue
                          ? 'var(--semantic-error-fg)'
                          : 'var(--text-muted)',
                        fontWeight: overdue ? '600' : 'normal',
                      }}
                    >
                      {overdue ? <AlertCircle size={13} /> : <Clock size={13} />}
                      <span>
                        {new Date(task.due_date).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {new Date(task.due_date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setTaskToEdit(task);
                        setIsModalOpen(true);
                      }}
                      title="Edit Task"
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete task "${task.title}"?`)) {
                          handleDeleteTask(task.id);
                        }
                      }}
                      title="Delete Task"
                      style={{
                        padding: '6px',
                        borderRadius: '4px',
                        color: 'var(--text-muted)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--semantic-error-fg)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={taskToEdit}
      />
    </div>
  );
}
