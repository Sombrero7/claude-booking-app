import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import { useMutation } from 'react-query';

// Form validation schema
const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  bio: yup.string(),
  phone: yup.string(),
});

export default function ProfilePage() {
  const { userProfile, updateUserProfile } = useAuth();
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Setup react-hook-form
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: userProfile?.profile?.name || '',
      email: userProfile?.email || '',
      bio: userProfile?.profile?.bio || '',
      phone: userProfile?.profile?.phone || '',
    }
  });
  
  // Update profile mutation
  const updateProfile = useMutation(
    (data: any) => userAPI.updateUser({ profile: data }),
    {
      onSuccess: () => {
        setSuccessMessage('Profile updated successfully');
        setErrorMessage('');
        setTimeout(() => setSuccessMessage(''), 3000);
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.error?.message || 'Failed to update profile');
        setSuccessMessage('');
      }
    }
  );
  
  const onSubmit = async (data: any) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name,
        bio: data.bio,
        phone: data.phone,
      });
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };
  
  return (
    <ProtectedRoute>
      <DashboardLayout title="Profile Settings">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your personal information and preferences
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {successMessage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  {successMessage}
                </div>
              )}
              
              {errorMessage && (
                <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  {errorMessage}
                </div>
              )}
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  disabled
                  className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email cannot be changed
                </p>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  {...register('bio')}
                  className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Tell us about yourself..."
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="text"
                  {...register('phone')}
                  className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g., +1 123 456 7890"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfile.isLoading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {updateProfile.isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
          
          {userProfile?.role === 'provider' && (
            <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Set up payment methods to receive payments for your classes and venue bookings
                </p>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">Stripe Connect</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Connect your Stripe account to receive payments directly
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      // Implement Stripe Connect setup
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    {userProfile?.stripe?.accountId ? 'Update Stripe Account' : 'Connect Stripe Account'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Account Security Section */}
          <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Security</h3>
              <p className="mt-1 text-sm text-gray-600">
                Update your password and security settings
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-medium text-gray-900">Password</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Change your password to keep your account secure
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Implement password change functionality
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}