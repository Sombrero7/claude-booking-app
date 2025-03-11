import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { redirect } = router.query;
  
  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (currentUser) {
      router.push(typeof redirect === 'string' ? redirect : '/dashboard');
    }
  }, [currentUser, router, redirect]);
  
  return (
    <MainLayout title="Log In - Booking Platform">
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Log in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <LoginForm redirectPath={typeof redirect === 'string' ? redirect : '/dashboard'} />
        </div>
      </div>
    </MainLayout>
  );
}