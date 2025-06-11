import { loadStripe } from '@stripe/stripe-js';

// You'll need to replace with your actual Stripe publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE);

interface CheckoutButtonProps {
  priceId: string;
  productName: string;
}

export default function CheckoutButton({ priceId, productName }: CheckoutButtonProps) {
  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error('Stripe failed to load');

      // Create checkout session using your existing server
      const response = await fetch('http://localhost:3000/api/create-checkout-session', {
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