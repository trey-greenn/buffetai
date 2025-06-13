import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../../lib/supabase/auth-context';

// Use the environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE);

interface CheckoutButtonProps {
  priceId: string;
  productName: string;
}

export default function CheckoutButton({ priceId, productName }: CheckoutButtonProps) {
  const { user } = useAuth();
  
  const handleEnterpriseContact = () => {
    // Redirect to a contact form or open a modal
    window.location.href = `mailto:info@williamtreygreen.com?subject=Enterprise Plan Inquiry&body=I'm interested in the Enterprise plan.`;
  };
  
  const handleCheckout = async () => {
    if (productName === "Enterprise") {
      handleEnterpriseContact();
      return;
    }
    
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Use relative URL to work in both development and production
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          productName,
          userId: user?.id, // Include user ID to associate with subscription
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe checkout
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      alert('An error occurred. Please try again later.');
    }
  };

  return (
    <button
      onClick={handleCheckout}
      className="mt-8 block w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 text-center font-medium text-white hover:bg-indigo-700"
    >
      {productName === "Enterprise" ? "Contact Sales" : "Subscribe Now"}
    </button>
  );
}