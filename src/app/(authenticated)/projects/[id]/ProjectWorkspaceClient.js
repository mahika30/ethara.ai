'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Users, 
  Settings, 
  KanbanSquare, 
  Calendar, 
  User, 
  Trash2, 
  Edit,
  X,
  Loader2,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function ProjectWorkspaceClient({ user, project, projectRole, allUsers }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'team', 'settings'
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  
  // New Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskStatus, setTaskStatus] = useState('TODO');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskError, setTaskError] = useState('');

  // Edit Task Form State
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editStatus, setEditStatus] = useState('TODO');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Team Form State
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('MEMBER');
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState('');

  // Settings Form State
  const [projectName, setProjectName] = useState(project.name);
  const [projectDesc, setProjectDesc] = useState(project.description || '');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const isAdmin = projectRole === 'ADMIN';

  // Task creation
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskError('');

    try {
      const res = await fetch(`/api/projects/${project.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          dueDate: taskDueDate || null,
          assigneeId: taskAssignee || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      // Reset form
      setTaskTitle('');
      setTaskDesc('');
      setTaskPriority('MEDIUM');
      setTaskStatus('TODO');
      setTaskDueDate('');
      setTaskAssignee('');
      setIsTaskModalOpen(false);
      
      router.refresh();
    } catch (err) {
      setTaskError(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Open task editor
  const openEditTask = (task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 10) : '');
    setEditAssignee(task.assigneeId || '');
    setIsEditTaskOpen(true);
  };

  // Update task details
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    editTaskAPI({
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      status: editStatus,
      dueDate: editDueDate || null,
      assigneeId: editAssignee || null
    });
  };

  // Quick drag & drop or quick update status
  const handleStatusChange = async (task, nextStatus) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const editTaskAPI = async (payload) => {
    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');

      setIsEditTaskOpen(false);
      setSelectedTask(null);
      router.refresh();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete task');
      }
      setIsEditTaskOpen(false);
      setSelectedTask(null);
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Team Member Management
  const handleAddMember = async (e) => {
    e.preventDefault();
    setTeamLoading(true);
    setTeamError('');

    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newMemberEmail, role: newMemberRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add member');

      setNewMemberEmail('');
      setNewMemberRole('MEMBER');
      router.refresh();
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId, currentRole) => {
    const nextRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    try {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member from the project?')) return;

    try {
      const res = await fetch(`/api/projects/${project.id}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json();
        alert(data.error || 'Failed to remove member');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Edit Project settings
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName, description: projectDesc }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update project');

      router.refresh();
      alert('Project updated successfully');
    } catch (err) {
      setSettingsError(err.message);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('CRITICAL WARNING: Are you sure you want to delete this project? All associated tasks and settings will be permanently lost.')) return;

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete project');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      alert(err.message);
    }
  };

  // Kanban task grouping
  const columns = [
    { title: 'To Do', status: 'TODO', badgeClass: 'badge-todo' },
    { title: 'In Progress', status: 'IN_PROGRESS', badgeClass: 'badge-progress' },
    { title: 'In Review', status: 'IN_REVIEW', badgeClass: 'badge-review' },
    { title: 'Done', status: 'DONE', badgeClass: 'badge-done' },
  ];

  const getTasksByStatus = (status) => {
    return project.tasks.filter(task => task.status === status);
  };

  return (
    <div className="fade-in">
      {/* Project Header Banner */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          {project.name}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '600px' }}>
          {project.description || 'No description set.'}
        </p>

        {/* Tab Selection */}
        <div className="project-tabs">
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <KanbanSquare size={16} />
            Board
          </button>
          <button 
            className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <Users size={16} />
            Team ({project.members.length})
          </button>
          {isAdmin && (
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={16} />
              Settings
            </button>
          )}
        </div>
      </div>

      {/* TABS VIEWS */}
      {activeTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600' }}>Sprint Board</h2>
            <button className="btn btn-primary" onClick={() => setIsTaskModalOpen(true)}>
              <Plus size={16} />
              Add Task
            </button>
          </div>

          <div className="kanban-board">
            {columns.map(col => {
              const colTasks = getTasksByStatus(col.status);
              return (
                <div key={col.status} className="kanban-column">
                  <div className="column-header">
                    <span className="column-title">
                      <span className={`badge ${col.badgeClass}`} style={{ width: '8px', height: '8px', padding: 0, borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
                      {col.title}
                    </span>
                    <span className="column-count">{colTasks.length}</span>
                  </div>

                  <div className="task-list">
                    {colTasks.map(task => {
                      const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                      const initials = task.assignee?.name 
                        ? task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
                        : '?';

                      return (
                        <div 
                          key={task.id} 
                          className="task-card"
                          onClick={() => openEditTask(task)}
                        >
                          <div className="task-card-header">
                            <span className="task-title">{task.title}</span>
                            <span className={`badge badge-${task.priority.toLowerCase()}`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="task-card-description">{task.description}</p>
                          )}

                          <div className="task-card-footer">
                            <span className={`task-date ${isOverdue ? 'overdue' : ''}`}>
                              <Calendar size={11} />
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}
                            </span>
                            
                            <div className="task-assignee">
                              <span className="task-assignee-avatar" title={task.assignee?.name || 'Unassigned'}>
                                {initials}
                              </span>
                            </div>
                          </div>
                          
                          {/* Quick workflow shifts */}
                          <div style={{ display: 'flex', gap: '4px', marginTop: '10px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                            {task.status !== 'TODO' && (
                              <button 
                                className="btn-icon" 
                                style={{ fontSize: '9px', padding: '2px 6px' }}
                                onClick={() => {
                                  const prevs = { 'IN_PROGRESS': 'TODO', 'IN_REVIEW': 'IN_PROGRESS', 'DONE': 'IN_REVIEW' };
                                  handleStatusChange(task, prevs[task.status]);
                                }}
                              >
                                ◀
                              </button>
                            )}
                            {task.status !== 'DONE' && (
                              <button 
                                className="btn-icon" 
                                style={{ fontSize: '9px', padding: '2px 6px' }}
                                onClick={() => {
                                  const nexts = { 'TODO': 'IN_PROGRESS', 'IN_PROGRESS': 'IN_REVIEW', 'IN_REVIEW': 'DONE' };
                                  handleStatusChange(task, nexts[task.status]);
                                }}
                              >
                                ▶
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {colTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        No tasks in this stage
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="section-card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={20} style={{ color: 'var(--primary)' }} />
            Project Team Members
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr', gap: '32px' }}>
            {/* List */}
            <div className="project-members-section">
              {project.members.map((member) => {
                const isMemberCreator = project.creatorId === member.userId;
                return (
                  <div key={member.id} className="member-list-item">
                    <div className="member-info">
                      <div style={{ width: '32px', height: '32px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>
                        {member.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                          {member.user.name} {member.user.id === user.id && '(You)'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.user.email}</div>
                      </div>
                    </div>

                    <div className="member-actions">
                      <span className={`member-role-badge ${member.role === 'ADMIN' ? 'member-role-admin' : 'member-role-member'}`}>
                        {isMemberCreator ? 'Owner' : member.role}
                      </span>

                      {isAdmin && !isMemberCreator && member.userId !== user.id && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleUpdateMemberRole(member.id, member.role)}
                          >
                            Toggle Role
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '4px', background: 'transparent', boxShadow: 'none' }}
                            onClick={() => handleRemoveMember(member.id)}
                            title="Remove Member"
                          >
                            <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Member Form (Admins only) */}
            {isAdmin && (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', border: '1px solid var(--border)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Add Team Member</h3>
                
                {teamError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                    {teamError}
                  </div>
                )}

                <form onSubmit={handleAddMember}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="mem-email">User Email</label>
                    <input
                      id="mem-email"
                      type="email"
                      required
                      className="input-field"
                      placeholder="teammate@example.com"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="form-label" htmlFor="mem-role">Project Access Role</label>
                    <select
                      id="mem-role"
                      className="input-field"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                    >
                      <option value="MEMBER">Member (read & edit tasks)</option>
                      <option value="ADMIN">Admin (manage project & settings)</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={teamLoading}>
                    {teamLoading ? <Loader2 size={14} className="animate-spin" /> : 'Invite Member'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div className="section-card" style={{ maxWidth: '600px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: 'var(--primary)' }} />
            Project Settings
          </h2>

          {settingsError && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
              {settingsError}
            </div>
          )}

          <form onSubmit={handleUpdateProject} style={{ marginBottom: '32px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="sett-name">Project Name</label>
              <input
                id="sett-name"
                type="text"
                required
                className="input-field"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" htmlFor="sett-desc">Description</label>
              <textarea
                id="sett-desc"
                rows={4}
                className="input-field"
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={settingsLoading}>
              {settingsLoading ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--danger)', marginBottom: '8px' }}>Danger Zone</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Once you delete a project, there is no going back. All tasks, files, and memberships will be deleted.
            </p>
            <button className="btn btn-danger" onClick={handleDeleteProject}>
              <Trash2 size={16} />
              Delete Project
            </button>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Task</h2>
              <button className="modal-close" onClick={() => setIsTaskModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            {taskError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Task Title</label>
                <input
                  id="task-title"
                  type="text"
                  required
                  className="input-field"
                  placeholder="Describe the task..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-desc">Description</label>
                <textarea
                  id="task-desc"
                  rows={3}
                  className="input-field"
                  placeholder="Provide additional details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-pri">Priority</label>
                  <select
                    id="task-pri"
                    className="input-field"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-stat">Status</label>
                  <select
                    id="task-stat"
                    className="input-field"
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="task-due">Due Date</label>
                  <input
                    id="task-due"
                    type="date"
                    className="input-field"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="task-ass">Assignee</label>
                  <select
                    id="task-ass"
                    className="input-field"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsTaskModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={taskLoading}>
                  {taskLoading ? <Loader2 size={14} className="animate-spin" /> : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / VIEW TASK DETAILS MODAL */}
      {isEditTaskOpen && selectedTask && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Task Details</h2>
              <button className="modal-close" onClick={() => { setIsEditTaskOpen(false); setSelectedTask(null); }}>
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdateTask}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-title">Task Title</label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  className="input-field"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-desc">Description</label>
                <textarea
                  id="edit-desc"
                  rows={3}
                  className="input-field"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-pri">Priority</label>
                  <select
                    id="edit-pri"
                    className="input-field"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-stat">Status</label>
                  <select
                    id="edit-stat"
                    className="input-field"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-due">Due Date</label>
                  <input
                    id="edit-due"
                    type="date"
                    className="input-field"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-ass">Assignee</label>
                  <select
                    id="edit-ass"
                    className="input-field"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {project.members.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
                {/* Delete button (Task creator or project admin can delete) */}
                {(selectedTask.creatorId === user.id || isAdmin) ? (
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    style={{ padding: '10px 14px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : <div />}

                <div className="form-actions" style={{ marginTop: 0 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditTaskOpen(false); setSelectedTask(null); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    {editLoading ? <Loader2 size={14} className="animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
