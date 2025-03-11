import { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { paymentAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PaymentsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'failed', 'refunded'
  
  // Determine if user is a provider
  const isProvider = userProfile?.role === 'provider';
  
  // Fetch transactions
  const { data, isLoading, error } = useQuery(
    ['transactions', filter],
    () => paymentAPI.getUserTransactions()
  );
  
  const transactions = data?.data?.data || [];
  
  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: any) => {
    if (filter === 'all') {
      return true;
    }
    return transaction.status === filter;
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format amount
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };
  
  return (
    <ProtectedRoute>
      <DashboardLayout title={isProvider ? "Payment History" : "Payment History"}>
        <div className="mb-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Payment Transactions
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isProvider 
              ? "View your payment history for bookings and space rentals" 
              : "View your payment history for bookings and requests"}
          </p>
        </div>
        
        {/* Filter tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['all', 'completed', 'pending', 'failed', 'refunded'].map((filterOption) => (
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
        
        {/* Transactions list */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">Error loading transactions. Please try again.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't made any payments yet."
                : `No ${filter} payments found.`}
            </p>
            {!isProvider && (
              <button
                onClick={() => router.push('/events')}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Browse Events
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction: any) => (
                  <tr key={transaction._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.bookingId ? (
                        <span>Booking Payment</span>
                      ) : transaction.requestId ? (
                        <span>Custom Request</span>
                      ) : (
                        <span>Payment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatAmount(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : transaction.status === 'refunded'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {transaction.bookingId && (
                        <button
                          onClick={() => router.push(`/dashboard/bookings/${transaction.bookingId}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                      )}
                      {transaction.requestId && (
                        <button
                          onClick={() => router.push(`/dashboard/requests/${transaction.requestId}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Set up Stripe section for providers */}
        {isProvider && (
          <div className="mt-8 bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
              <p className="mt-1 text-sm text-gray-500">
                Configure how you receive payments from bookings and space rentals
              </p>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-medium text-gray-900">Stripe Connect</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Connect your Stripe account to receive payments directly to your bank account
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    // In a real app, this would initiate Stripe Connect onboarding
                    router.push('/dashboard/payments/setup-stripe');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {userProfile?.stripe?.accountId ? (
                    'Update Stripe Account'
                  ) : (
                    'Connect Stripe Account'
                  )}
                </button>
              </div>
              
              {userProfile?.stripe?.accountId && (
                <div className="mt-4 p-4 bg-green-50 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Stripe account connected</h3>
                      <p className="mt-1 text-sm text-green-700">
                        Your Stripe account is connected and ready to receive payments.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}