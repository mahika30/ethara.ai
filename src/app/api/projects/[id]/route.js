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

    // Check membership
    const member = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: user.id,
      },
    });

    // Check if the user is project creator or global ADMIN
    const projectCreator = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!projectCreator) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isAuthorized = member || projectCreator.creatorId === user.id || user.role === 'ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to access this project' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        tasks: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch project details' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { name, description } = await request.json();

    // Check project admin or creator
    const project = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId: user.id,
      },
    });

    const isProjectAdmin = projectMember?.role === 'ADMIN' || project.creatorId === user.id || user.role === 'ADMIN';

    if (!isProjectAdmin) {
      return NextResponse.json({ error: 'Only project admins or creators can edit project details' }, { status: 403 });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const project = await prisma.project.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Only project creator or system admin can delete the project
    const isAuthorized = project.creatorId === user.id || user.role === 'ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Only the project creator or system admin can delete the project' }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
