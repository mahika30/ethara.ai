import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { redirect, notFound } from 'next/navigation';
import ProjectWorkspaceClient from './ProjectWorkspaceClient';

export default async function ProjectPage({ params }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;

  // Fetch project details
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
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

  if (!project) {
    notFound();
  }

  // Verify membership
  const memberRecord = project.members.find(m => m.userId === user.id);
  const isCreator = project.creatorId === user.id;
  const isSystemAdmin = user.role === 'ADMIN';

  if (!memberRecord && !isCreator && !isSystemAdmin) {
    redirect('/dashboard');
  }

  // Determine user's project role
  const projectRole = isCreator || isSystemAdmin ? 'ADMIN' : (memberRecord?.role || 'MEMBER');

  // Fetch all users to select from for adding members
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <ProjectWorkspaceClient
      user={user}
      project={project}
      projectRole={projectRole}
      allUsers={allUsers}
    />
  );
}
