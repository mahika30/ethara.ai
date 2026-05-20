'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  FolderPlus, 
  Calendar,
  X,
  Loader2,
  Users
} from 'lucide-react';

export default function DashboardClient({ user, projects = [], assignedTasks = [], overdueTasks = [], metrics }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setIsModalOpen(false);
      setName('');
      setDescription('');
      router.refresh(); // Refreshes the server data!
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get project initials for grid avatar
  const getProjectInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            Hello, {user.name} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Here is what's happening with your workspace today.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Create Project
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="dashboard-grid">
        <div className="stat-card" style={{ '--border-color': 'var(--primary)', '--bg-glow': 'var(--primary-glow)', '--color': 'var(--primary)' }}>
          <div className="stat-icon-wrapper">
            <CheckSquare size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{metrics.totalAssigned}</span>
            <span className="stat-label">Assigned Tasks</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--border-color': 'var(--warning)', '--bg-glow': 'var(--warning-glow)', '--color': 'var(--warning)' }}>
          <div className="stat-icon-wrapper">
            <Clock size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{metrics.pendingCount}</span>
            <span className="stat-label">Pending Tasks</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--border-color': 'var(--success)', '--bg-glow': 'var(--success-glow)', '--color': 'var(--success)' }}>
          <div className="stat-icon-wrapper">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{metrics.completedCount}</span>
            <span className="stat-label">Completed Tasks</span>
          </div>
        </div>

        <div className="stat-card" style={{ '--border-color': 'var(--danger)', '--bg-glow': 'var(--danger-glow)', '--color': 'var(--danger)' }}>
          <div className="stat-icon-wrapper">
            <AlertCircle size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value" style={{ color: metrics.overdueCount > 0 ? 'var(--danger)' : 'inherit' }}>
              {metrics.overdueCount}
            </span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
        </div>
      </div>

      {/* Layout Content Sections */}
      <div className="dashboard-sections">
        {/* Projects List */}
        <div>
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <FolderKanban size={20} style={{ color: 'var(--primary)' }} />
                Active Projects ({projects.length})
              </h2>
            </div>
            
            {projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(255, 255, 255, 0.01)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                <FolderPlus size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>No Projects Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>Get started by creating a project for your team</p>
                <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>Create First Project</button>
              </div>
            ) : (
              <div className="project-list-grid">
                {projects.map((project) => (
                  <Link key={project.id} href={`/projects/${project.id}`} style={{ display: 'block' }}>
                    <div className="project-card">
                      <div className="project-card-header">
                        <div style={{ width: '36px', height: '36px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }}>
                          {getProjectInitials(project.name)}
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {project.creatorId === user.id ? 'Owner' : 'Member'}
                        </span>
                      </div>
                      <h3 className="project-name" style={{ marginBottom: '6px' }}>{project.name}</h3>
                      <p className="project-description">{project.description || 'No description provided.'}</p>
                      <div className="project-meta">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckSquare size={13} />
                          {project._count?.tasks || 0} tasks
                        </span>
                        <div className="member-avatars">
                          <Users size={12} style={{ marginRight: '6px', color: 'var(--text-muted)' }} />
                          {project.members.slice(0, 3).map((m) => {
                            const memberInitials = m.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                            return (
                              <div key={m.id} className="member-avatar-mini" title={m.user.name}>
                                {memberInitials}
                              </div>
                            );
                          })}
                          {project.members.length > 3 && (
                            <div className="member-avatar-mini" style={{ background: 'var(--surface-hover)', fontSize: '9px', color: 'var(--text-secondary)' }}>
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Task Summaries / Overdue List */}
        <div>
          <div className="section-card" style={{ height: '100%' }}>
            <div className="section-header">
              <h2 className="section-title">
                <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
                Urgent & Overdue
              </h2>
            </div>

            {overdueTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: 'rgba(16, 185, 129, 0.02)', border: '1px dashed rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={28} />
                <span style={{ fontSize: '13px', fontWeight: '500' }}>All caught up! No overdue tasks.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {overdueTasks.map((task) => (
                  <Link key={task.id} href={`/projects/${task.projectId}`} style={{ display: 'block' }}>
                    <div className="task-card" style={{ borderColor: 'rgba(239, 68, 68, 0.25)', background: 'rgba(239, 68, 68, 0.02)' }}>
                      <div className="task-card-header">
                        <span className="task-title" style={{ fontSize: '13px' }}>{task.title}</span>
                        <span className="badge badge-high" style={{ fontSize: '8px' }}>Overdue</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project: {task.project.name}</p>
                      <div className="task-card-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <span className="task-date overdue" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                          <Calendar size={11} />
                          Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pending List */}
            {assignedTasks.filter(t => t.status !== 'DONE' && !overdueTasks.includes(t)).length > 0 && (
              <>
                <h3 className="section-title" style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>
                  Upcoming Tasks
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {assignedTasks
                    .filter(t => t.status !== 'DONE' && !overdueTasks.includes(t))
                    .slice(0, 5)
                    .map((task) => (
                      <Link key={task.id} href={`/projects/${task.projectId}`} style={{ display: 'block' }}>
                        <div className="task-card">
                          <div className="task-card-header">
                            <span className="task-title" style={{ fontSize: '13px' }}>{task.title}</span>
                            <span className={`badge badge-${task.status.toLowerCase().replace('_', '')}`} style={{ fontSize: '8px' }}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Project: {task.project.name}</p>
                          <div className="task-card-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                            <span className="task-date" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
                              <Calendar size={11} />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                            </span>
                            <span className={`badge-${task.priority.toLowerCase()}`} style={{ fontSize: '9px' }}>
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Project</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label className="form-label" htmlFor="proj-name">Project Name</label>
                <input
                  id="proj-name"
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Website Redesign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proj-desc">Description (Optional)</label>
                <textarea
                  id="proj-desc"
                  rows={4}
                  className="input-field"
                  placeholder="Describe the goals and scope of this project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
