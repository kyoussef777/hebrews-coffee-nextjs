import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DatabaseReset from '@/components/DatabaseReset';
import UserManagement from '@/components/UserManagement';
import Navigation from '@/components/Navigation';

export default async function AdminPage() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  const role = (session.user as unknown as { role?: string }).role;
  if (role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">
            Administrative tools and database management
          </p>
        </div>

        <div className="space-y-8">
          <UserManagement />
          <DatabaseReset />
        </div>
      </main>
    </div>
  );
}