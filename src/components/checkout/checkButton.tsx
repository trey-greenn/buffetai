import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// You'll need to replace with your actual Stripe publishable key
const stripePromise = loadStripe('pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY');

interface CheckoutButtonProps {
  priceId: string;
  productName: string;
  isLoading?: boolean;
}

export default function CheckoutButton({ priceId, productName, isLoading = false }: CheckoutButtonProps) {
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setIsCheckoutLoading(true);

    try {
      // Call your backend to create a checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          productName,
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Error redirecting to checkout:', error);
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || isCheckoutLoading}
      className="w-full py-3 px-6 border border-transparent rounded-md text-center font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isCheckoutLoading ? 'Loading...' : 'Subscribe'}
    </button>
  );
}