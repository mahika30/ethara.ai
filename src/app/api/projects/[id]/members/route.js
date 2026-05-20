import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const { email, role } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
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
      return NextResponse.json({ error: 'Only project admins or creators can manage members' }, { status: 403 });
    }

    // Find the user to add by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User with this email not found' }, { status: 404 });
    }

    // Check if the user is already a member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: id,
          userId: targetUser.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already a member of this project' }, { status: 400 });
    }

    // Create the membership
    const membership = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: targetUser.id,
        role: role === 'ADMIN' ? 'ADMIN' : 'MEMBER',
      },
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
    });

    return NextResponse.json({ member: membership });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json({ error: 'Failed to add member to project' }, { status: 500 });
  }
}
