'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare } from 'lucide-react';

export default function Sidebar({ user, projects = [] }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Get user avatar initials
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) 
    : 'U';

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">
          <CheckSquare size={22} />
        </div>
        <span className="logo-text">Ethare Manager</span>
      </div>

      <nav className="nav-menu">
        <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        <div className="nav-section-title">My Projects</div>
        
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className={`nav-item ${pathname === `/projects/${project.id}` ? 'active' : ''}`}
            style={{ paddingLeft: '24px' }}
          >
            <FolderKanban size={16} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </span>
          </Link>
        ))}

        {projects.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', paddingLeft: '24px', fontStyle: 'italic' }}>
            No projects yet
          </div>
        )}
      </nav>

      <div className="nav-footer">
        <div className="user-profile">
          <div className="user-avatar" title={`${user?.name} (${user?.role})`}>
            {initials}
          </div>
          <div className="user-details">
            <span className="profile-name">{user?.name}</span>
            <span className="profile-role">{user?.role}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-logout" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
