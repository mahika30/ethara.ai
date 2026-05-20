import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Check project member
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: user.id,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isAuthorized = member || project.creatorId === user.id || user.role === 'ADMIN';
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to access tasks for this project' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: id },
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
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, status, priority, dueDate, assigneeId } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    // Check project member
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: user.id,
      },
    });

    const project = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isAuthorized = member || project.creatorId === user.id || user.role === 'ADMIN';
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only project members can create tasks' }, { status: 403 });
    }

    // Verify assignee if provided is a project member
    if (assigneeId) {
      const assigneeMember = await prisma.projectMember.findFirst({
        where: {
          projectId: id,
          userId: assigneeId,
        },
      });

      const assigneeProjectCreator = project.creatorId === assigneeId;

      if (!assigneeMember && !assigneeProjectCreator) {
        return NextResponse.json({ error: 'Assignee must be a member of the project' }, { status: 400 });
      }
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId: id,
        assigneeId: assigneeId || null,
        creatorId: user.id,
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

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
