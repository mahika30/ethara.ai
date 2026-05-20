import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            creatorId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project membership
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: user.id,
      },
    });

    const isAuthorized = member || task.project.creatorId === user.id || user.role === 'ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to view this task' }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Fetch task detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch task details' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { taskId } = await params;
    const { title, description, status, priority, dueDate, assigneeId } = await request.json();

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project member
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: user.id,
      },
    });

    const isAuthorized = member || task.project.creatorId === user.id || user.role === 'ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to edit this task' }, { status: 403 });
    }

    // Validate assignee is part of project if changing assignee
    if (assigneeId && assigneeId !== task.assigneeId) {
      const assigneeMember = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: assigneeId,
        },
      });

      const assigneeProjectCreator = task.project.creatorId === assigneeId;

      if (!assigneeMember && !assigneeProjectCreator) {
        return NextResponse.json({ error: 'Assignee must be a member of the project' }, { status: 400 });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId ? assigneeId : null) : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            creatorId: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check project admin or task creator or project creator or global ADMIN
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: task.projectId,
        userId: user.id,
      },
    });

    const isProjectAdmin = projectMember?.role === 'ADMIN' || task.project.creatorId === user.id || user.role === 'ADMIN';
    const isTaskCreator = task.creatorId === user.id;

    if (!isProjectAdmin && !isTaskCreator) {
      return NextResponse.json({ error: 'Only task creators or project admins can delete tasks' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
