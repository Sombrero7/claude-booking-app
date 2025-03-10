// apps/frontend/src/pages/login.tsx
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

// apps/frontend/src/pages/signup.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import SignupForm from '@/components/auth/SignupForm';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
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
    <MainLayout title="Create Account - Booking Platform">
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              log in to your existing account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <SignupForm redirectPath={typeof redirect === 'string' ? redirect : '/dashboard'} />
        </div>
      </div>
    </MainLayout>
  );
}

// apps/frontend/src/pages/forgot-password.tsx
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <MainLayout title="Reset Password - Booking Platform">
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </MainLayout>
  );
}

// apps/frontend/src/pages/unauthorized.tsx
import { useRouter } from 'next/router';
import MainLayout from '@/components/layout/MainLayout';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <MainLayout title="Unauthorized - Booking Platform">
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
            <svg className="w-8 h-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-10v4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <p className="mb-4 text-gray-600">
                Please contact an administrator if you believe this is an error.
              </p>
              <button
                onClick={() => router.push('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
