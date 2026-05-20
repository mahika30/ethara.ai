import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import prisma from '@/lib/db';

export default async function AuthenticatedLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch projects user is part of to show in the sidebar
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="app-layout">
      <Sidebar user={user} projects={projects} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
