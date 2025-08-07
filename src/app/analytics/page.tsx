import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await auth();
  // Redirect to login if not authenticated or not an admin
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            View order statistics, trends, and wait time settings
          </p>
        </div>
        
        <AnalyticsDashboard />
      </main>
    </div>
  );
}