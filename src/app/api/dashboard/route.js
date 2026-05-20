import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Projects the user is part of
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
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    const projectIds = projects.map(p => p.id);

    // All tasks in the projects the user is part of
    const allProjectTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
      },
      include: {
        project: {
          select: { name: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    // Tasks assigned to this user specifically
    const userTasks = allProjectTasks.filter(t => t.assigneeId === user.id);

    // Status breakdown of user's tasks
    const statusBreakdown = {
      TODO: userTasks.filter(t => t.status === 'TODO').length,
      IN_PROGRESS: userTasks.filter(t => t.status === 'IN_PROGRESS').length,
      IN_REVIEW: userTasks.filter(t => t.status === 'IN_REVIEW').length,
      DONE: userTasks.filter(t => t.status === 'DONE').length,
    };

    // Overdue tasks: due date has passed, and status is not DONE
    const now = new Date();
    const overdueTasks = userTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now && t.status !== 'DONE';
    });

    // Project-wide breakdown for project overview
    const projectStats = projects.map(proj => {
      const projTasks = allProjectTasks.filter(t => t.projectId === proj.id);
      return {
        id: proj.id,
        name: proj.name,
        totalTasks: projTasks.length,
        doneTasks: projTasks.filter(t => t.status === 'DONE').length,
        pendingTasks: projTasks.filter(t => t.status !== 'DONE').length,
      };
    });

    return NextResponse.json({
      summary: {
        totalAssigned: userTasks.length,
        pendingAssigned: userTasks.filter(t => t.status !== 'DONE').length,
        doneAssigned: userTasks.filter(t => t.status === 'DONE').length,
        overdueCount: overdueTasks.length,
      },
      statusBreakdown,
      overdueTasks,
      projectStats,
      recentTasks: userTasks.slice(0, 5), // User's top 5 tasks
    });
  } catch (error) {
    console.error('Fetch dashboard data error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
