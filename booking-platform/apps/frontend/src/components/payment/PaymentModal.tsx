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