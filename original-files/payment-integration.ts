// apps/frontend/src/components/payment/StripePaymentForm.tsx
import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { paymentAPI } from '@/lib/api';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#32325d',
      fontFamily: 'Arial, sans-serif',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  clientSecret,
  amount,
  currency,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setErrorMessage('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred with your payment');
        onError(error.message || 'An error occurred with your payment');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded, confirm with backend
        try {
          await paymentAPI.confirmPayment({
            paymentIntentId: paymentIntent.id,
          });
          onSuccess();
        } catch (confirmError: any) {
          setErrorMessage(confirmError.message || 'Payment succeeded but failed to confirm with server');
          onError(confirmError.message || 'Payment succeeded but failed to confirm with server');
        }
      }
    } catch (stripeError: any) {
      setErrorMessage(stripeError.message || 'An unexpected error occurred');
      onError(stripeError.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Card Information
        </label>
        <div className="p-3 border border-gray-300 rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500">
          Test card: 4242 4242 4242 4242 | Exp: any future date | CVC: any 3 digits
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total amount: <span className="font-semibold">{formatAmount(amount, currency)}</span>
        </div>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </form>
  );
};

// Helper function to format amount with currency
const formatAmount = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

export default StripePaymentForm;

// apps/frontend/src/components/payment/PaymentModal.tsx
import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripePaymentForm from './StripePaymentForm';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentInfo: {
    clientSecret: string;
    amount: number;
    currency: string;
  } | null;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentInfo,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  // Handle component mounting to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !isOpen || !paymentInfo) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal Panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Complete Payment
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div>
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                clientSecret={paymentInfo.clientSecret}
                amount={paymentInfo.amount}
                currency={paymentInfo.currency}
                onSuccess={() => {
                  onPaymentSuccess();
                  onClose();
                }}
                onError={onPaymentError}
              />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;

// apps/frontend/src/pages/dashboard/payments/index.tsx
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
