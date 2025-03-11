import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roleRequired?: 'provider' | 'customer' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  roleRequired 
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Redirect to login if not authenticated
      if (!currentUser) {
        router.push(`/login?redirect=${router.asPath}`);
        return;
      }

      // Check role requirement if specified
      if (roleRequired && userProfile?.role !== roleRequired && userProfile?.role !== 'admin') {
        router.push('/unauthorized');
        return;
      }
    }
  }, [currentUser, userProfile, loading, router, roleRequired]);

  // Show nothing while checking authentication
  if (loading || !currentUser || (roleRequired && userProfile?.role !== roleRequired && userProfile?.role !== 'admin')) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;