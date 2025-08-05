import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DatabaseReset from '@/components/DatabaseReset';

export default async function AdminPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          Administrative tools and database management
        </p>
      </div>

      <div className="space-y-8">
        <DatabaseReset />
      </div>
    </div>
  );
}