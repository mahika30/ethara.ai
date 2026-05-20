import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import DashboardClient from './DashboardClient';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  // 1. Projects user is part of
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { creatorId: user.id },
        {
          members: {
            some: { userId: user.id },
          },
        },
      ],
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const projectIds = projects.map(p => p.id);

  // 2. Tasks in these projects
  const allTasks = await prisma.task.findMany({
    where: {
      projectId: { in: projectIds },
    },
    include: {
      project: {
        select: { name: true },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
  });

  // 3. User's specific tasks
  const assignedTasks = allTasks.filter(t => t.assigneeId === user.id);

  // 4. Overdue tasks (due date in past and status !== DONE)
  const now = new Date();
  const overdueTasks = assignedTasks.filter(t => {
    if (!t.dueDate) return false;
    return new Date(t.dueDate) < now && t.status !== 'DONE';
  });

  const metrics = {
    totalAssigned: assignedTasks.length,
    pendingCount: assignedTasks.filter(t => t.status !== 'DONE').length,
    completedCount: assignedTasks.filter(t => t.status === 'DONE').length,
    overdueCount: overdueTasks.length,
  };

  return (
    <DashboardClient
      user={user}
      projects={projects}
      assignedTasks={assignedTasks}
      overdueTasks={overdueTasks}
      metrics={metrics}
    />
  );
}
