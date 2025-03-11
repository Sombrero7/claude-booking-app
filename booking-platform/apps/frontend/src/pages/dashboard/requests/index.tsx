import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { requestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function RequestsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'
  
  // Determine if user is a provider
  const isProvider = userProfile?.role === 'provider';
  
  // Fetch requests based on user role
  const { data, isLoading, error } = useQuery(
    ['requests', filter],
    () => {
      if (isProvider) {
        return requestAPI.getCreatorRequests({ status: filter !== 'all' ? filter : undefined });
      } else {
        return requestAPI.getMyRequests({ status: filter !== 'all' ? filter : undefined });
      }
    }
  );
  
  const requests = data?.data?.data?.requests || [];
  
  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={isProvider ? "Requests to You" : "Your Requests"}>
        <div className="mb-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {isProvider ? "Manage Requests from Customers" : "Manage Your Requests"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isProvider 
              ? "View and respond to requests from customers who want to book your services" 
              : "Track the status of your requests to instructors and venues"}
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'accepted', 'rejected'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`${
                  filter === filterOption
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {filterOption}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Requests list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading requests. Please try again.</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? isProvider 
                  ? "You haven't received any requests yet."
                  : "You haven't made any requests yet."
                : filter === 'pending'
                ? "No pending requests."
                : filter === 'accepted'
                ? "No accepted requests."
                : "No rejected requests."}
            </p>
            {!isProvider && (
              <button
                onClick={() => router.push('/spaces')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Find a Space
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {requests.map((request: any) => (
                <li key={request._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{request.title}</h4>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatDateTime(request.desiredDateTime.start)} - {formatDateTime(request.desiredDateTime.end)}
                      </p>
                      <div className="mt-2 flex items-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : request.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                        
                        {isProvider ? (
                          // Provider view
                          <>
                            <span className="ml-2 text-sm text-gray-600">
                              From: {request.userName || 'Customer'}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              Space: {request.spaceName || 'Your space'}
                            </span>
                          </>
                        ) : (
                          // Customer view
                          <>
                            <span className="ml-2 text-sm text-gray-600">
                              To: {request.creatorName || 'Instructor'}
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              Space: {request.spaceName || 'Venue'}
                            </span>
                          </>
                        )}
                        
                        <span className="ml-2 text-sm text-gray-600">
                          ${request.priceBreakdown.totalCost}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/requests/${request._id}`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        View Details
                      </button>
                      
                      {isProvider && request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/dashboard/requests/${request._id}/respond`)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Respond
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// apps/frontend/src/pages/dashboard/requests/[id]/index.tsx
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { requestAPI, paymentAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function RequestDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { userProfile } = useAuth();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  
  // Determine if user is a provider
  const isProvider = userProfile?.role === 'provider';
  
  // Fetch request details
  const { data: requestData, isLoading, error } = useQuery(
    ['request', id],
    () => requestAPI.getRequestById(id as string),
    {
      enabled: !!id
    }
  );
  
  const request = requestData?.data?.data;
  
  // Mutation for updating request approval
  const updateApproval = useMutation(
    (data: any) => requestAPI.updateRequestApproval(id as string, data),
    {
      onSuccess: () => {
        // Reload request data
        router.reload();
      }
    }
  );
  
  // Mutation for initiating payment
  const initiatePayment = useMutation(
    (data: any) => paymentAPI.initiatePayment(data),
    {
      onSuccess: (data) => {
        // Redirect to payment page or handle client-side payment
        console.log('Payment initiated:', data);
        // In a real app, you would redirect to a payment page or open a Stripe checkout
        alert('Payment initiated successfully! In a real app, this would open a payment form.');
        router.reload();
      },
      onError: (error: any) => {
        setPaymentError(error.response?.data?.error?.message || 'Failed to initiate payment');
        setIsPaymentProcessing(false);
      }
    }
  );
  
  // Handle approval/rejection from provider
  const handleApproval = (approval: 'accepted' | 'rejected', price?: number) => {
    updateApproval.mutate({
      approval,
      price
    });
  };
  
  // Handle payment from customer
  const handlePayment = () => {
    setIsPaymentProcessing(true);
    setPaymentError('');
    
    initiatePayment.mutate({
      requestId: id,
      amount: request.priceBreakdown.totalCost,
      currency: 'USD',
      description: `Payment for ${request.title}`,
      metadata: {
        requestId: id,
        title: request.title
      }
    });
  };
  
  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Request Details">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading request details...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  if (error || !request) {
    return (
      <ProtectedRoute>
        <DashboardLayout title="Request Details">
          <div className="text-center py-12">
            <p className="text-red-500">Error loading request details. Please try again.</p>
            <button
              onClick={() => router.push('/dashboard/requests')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Requests
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <DashboardLayout title="Request Details">
        <div className="mb-4">
          <button
            onClick={() => router.push('/dashboard/requests')}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Requests
          </button>
        </div>
        
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {/* Request Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {formatDateTime(request.desiredDateTime.start)} - {formatDateTime(request.desiredDateTime.end)}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                request.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : request.status === 'accepted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Request Details */}
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Request Details</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Status:</dt>
                    <dd className="text-sm text-gray-900">{request.status.charAt(0).toUpperCase() + request.status.slice(1)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Date:</dt>
                    <dd className="text-sm text-gray-900">{new Date(request.desiredDateTime.start).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Time:</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(request.desiredDateTime.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(request.desiredDateTime.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Duration:</dt>
                    <dd className="text-sm text-gray-900">
                      {Math.round(
                        (new Date(request.desiredDateTime.end).getTime() - new Date(request.desiredDateTime.start).getTime()) / 
                        (1000 * 60 * 60)
                      )} hours
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Attendees:</dt>
                    <dd className="text-sm text-gray-900">{request.attendeesCount} people</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Payment Status:</dt>
                    <dd className="text-sm text-gray-900">
                      {request.paymentStatus.charAt(0).toUpperCase() + request.paymentStatus.slice(1)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Venue Fee:</dt>
                    <dd className="text-sm text-gray-900">${request.priceBreakdown.venueFee}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Instructor Fee:</dt>
                    <dd className="text-sm text-gray-900">${request.priceBreakdown.creatorFee}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium text-gray-500">Platform Fee:</dt>
                    <dd className="text-sm text-gray-900">${request.priceBreakdown.platformFee}</dd>
                  </div>
                  <div className="flex justify-between font-medium">
                    <dt className="text-sm text-gray-500">Total:</dt>
                    <dd className="text-sm text-gray-900">${request.priceBreakdown.totalCost}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            {request.specialRequirements && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Special Requirements</h4>
                <p className="text-sm text-gray-900">{request.specialRequirements}</p>
              </div>
            )}
          </div>
          
          {/* Parties Involved */}
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Parties Involved</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Customer</h5>
                <p className="text-sm text-gray-900">{request.userName || 'Customer Name'}</p>
                <p className="text-sm text-gray-500">Requested on {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Instructor</h5>
                <p className="text-sm text-gray-900">{request.creatorName || 'Instructor Name'}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={
                    request.creatorApproval === 'pending'
                      ? 'text-yellow-600'
                      : request.creatorApproval === 'accepted'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }>{request.creatorApproval.charAt(0).toUpperCase() + request.creatorApproval.slice(1)}</span>
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Venue</h5>
                <p className="text-sm text-gray-900">{request.spaceName || 'Venue Name'}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className={
                    request.venueApproval === 'pending'
                      ? 'text-yellow-600'
                      : request.venueApproval === 'accepted'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }>{request.venueApproval.charAt(0).toUpperCase() + request.venueApproval.slice(1)}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6">
            {isProvider ? (
              // Provider actions
              <>
                {request.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => handleApproval('rejected')}
                      disabled={updateApproval.isLoading}
                      className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {updateApproval.isLoading ? 'Processing...' : 'Decline Request'}
                    </button>
                    <button
                      onClick={() => handleApproval('accepted')}
                      disabled={updateApproval.isLoading}
                      className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      {updateApproval.isLoading ? 'Processing...' : 'Accept Request'}
                    </button>
                  </div>
                )}
                
                {request.status === 'accepted' && request.paymentStatus === 'unpaid' && (
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                    <p>Waiting for customer to complete payment.</p>
                  </div>
                )}
                
                {request.status === 'accepted' && request.paymentStatus === 'paid' && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                    <p>Payment completed. This booking is confirmed.</p>
                  </div>
                )}
              </>
            ) : (
              // Customer actions
              <>
                {request.status === 'pending' && (
                  <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                    <p>Waiting for instructor and venue approval.</p>
                  </div>
                )}
                
                {request.status === 'accepted' && request.paymentStatus === 'unpaid' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                      <p>Your request has been approved! Complete payment to confirm your booking.</p>
                    </div>
                    
                    {paymentError && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                        <p>{paymentError}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <button
                        onClick={handlePayment}
                        disabled={isPaymentProcessing}
                        className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                      >
                        {isPaymentProcessing ? 'Processing...' : `Pay $${request.priceBreakdown.totalCost}`}
                      </button>
                    </div>
                  </div>
                )}
                
                {request.paymentStatus === 'paid' && (
                  <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                    <p>Payment completed. Your booking is confirmed!</p>
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                    <p>Your request has been declined. Please try another venue or instructor.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// apps/frontend/src/pages/dashboard/requests/[id]/respond.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { requestAPI } from '@/lib/api';

// Form validation schema
const schema = yup.object().shape({
  approval: yup.string().oneOf(['accepted', 'rejected']).required('Response is required'),
  price: yup.number().when('approval', {
    is: 'accepted',
    then: yup.number().min(0, 'Price cannot be negative').required('Price is required'),
    otherwise: yup.number().nullable()
  }),
  message: yup.string()
});

export default function RespondToRequestPage() {
  const router = useRouter();
  const { id } = router.query;
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Fetch request details
  const { data: requestData, isLoading, error } = useQuery(
    ['request', id],
    () => requestAPI.getRequestById(id as string),
    {
      enabled: !!id
    }
  );
  
  const request = requestData?.data?.data;
  
  // Setup react-hook-form
  const { register, watch, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      approval: 'accepted',
      price: 0,
      message: ''
    }
  });
  
  // Watch approval value for conditional rendering
  const approval = watch('approval');
  
  // Mutation for updating request approval
  const updateApproval = useMutation(
    (data: any) => requestAPI.updateRequestApproval(id as string, data),
    {
      onSuccess: () => {
        setSuccessMessage('Response submitted successfully');
        setErrorMessage('');
        setTimeout(() => {
          router.push(`/dashboard/requests/${id}`);
        }, 2000);
      },
      onError: (error: any) => {
        setErrorMessage(error.response?.data?.error?.message || 'Failed to submit response');
        setSuccessMessage('');
      }
    }
  );
  
  const onSubmit = async (data: any) => {
    try {
      await updateApproval.mutateAsync({
        approval: data.approval,
        price: data.approval === 'accepted' ? data.price : undefined,
        message: data.message
      });
    } catch (error) {
      // Error is handled by the mutation onError callback
    }
  };
  
  if (isLoading) {
    return (
      <ProtectedRoute roleRequired="provider">
        <DashboardLayout title="Respond to Request">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading request details...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  if (error || !request) {
    return (
      <ProtectedRoute roleRequired="provider">
        <DashboardLayout title="Respond to Request">
          <div className="text-center py-12">
            <p className="text-red-500">Error loading request details. Please try again.</p>
            <button
              onClick={() => router.push('/dashboard/requests')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Requests
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  // Check if this request has already been responded to
  if (request.status !== 'pending') {
    return (
      <ProtectedRoute roleRequired="provider">
        <DashboardLayout title="Respond to Request">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <p className="text-gray-700 mb-4">
              This request has already been {request.status}. You cannot modify your response.
            </p>
            <button
              onClick={() => router.push(`/dashboard/requests/${id}`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              View Request Details
            </button>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute roleRequired="provider">
      <DashboardLayout title="Respond to Request">
        <div className="mb-4">
          <button
            onClick={() => router.push(`/dashboard/requests/${id}`)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Request
          </button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Respond to Request</h3>
              <p className="mt-1 text-sm text-gray-600">
                {request.title} - {new Date(request.desiredDateTime.start).toLocaleDateString()}
              </p>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                  {errorMessage}
                </div>
              )}
              
              {successMessage && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
                  {successMessage}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Your Response
                </label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center">
                    <input
                      id="accept"
                      type="radio"
                      value="accepted"
                      {...register('approval')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                    />
                    <label htmlFor="accept" className="ml-2 block text-sm text-gray-700">
                      Accept Request
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="reject"
                      type="radio"
                      value="rejected"
                      {...register('approval')}
                      className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                    />
                    <label htmlFor="reject" className="ml-2 block text-sm text-gray-700">
                      Decline Request
                    </label>
                  </div>
                </div>
                {errors.approval && (
                  <p className="mt-1 text-sm text-red-600">{errors.approval.message}</p>
                )}
              </div>
              
              {approval === 'accepted' && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Your Fee ($)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="price"
                      {...register('price')}
                      className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="0.01"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">USD</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Suggested: ${request.priceBreakdown.creatorFee} 
                    (based on request details)
                  </p>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              )}
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  rows={4}
                  {...register('message')}
                  className="mt-1 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add any notes or special instructions..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/requests/${id}`)}
                  className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateApproval.isLoading}
                  className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {updateApproval.isLoading ? 'Submitting...' : 'Submit Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}