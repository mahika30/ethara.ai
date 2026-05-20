import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, memberId } = await params;
    const { role } = await request.json();

    if (!role || (role !== 'ADMIN' && role !== 'MEMBER')) {
      return NextResponse.json({ error: 'Valid role (ADMIN or MEMBER) is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Only project admins or creators can update member roles' }, { status: 403 });
    }

    // Update the membership role
    const updatedMembership = await prisma.projectMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ member: updatedMembership });
  } catch (error) {
    console.error('Update member role error:', error);
    return NextResponse.json({ error: 'Failed to update member role' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, memberId } = await params;

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

    // Find the member to be deleted
    const targetMembership = await prisma.projectMember.findUnique({
      where: { id: memberId },
      select: { userId: true },
    });

    if (!targetMembership) {
      return NextResponse.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Project creator cannot be removed from their own project
    if (project.creatorId === targetMembership.userId) {
      return NextResponse.json({ error: 'The project creator cannot be removed from the project' }, { status: 400 });
    }

    // You can remove yourself, or a project admin can remove others
    const isAuthorized = isProjectAdmin || targetMembership.userId === user.id;

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized to remove this member' }, { status: 403 });
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ message: 'Member removed from project successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Failed to remove member from project' }, { status: 500 });
  }
}
