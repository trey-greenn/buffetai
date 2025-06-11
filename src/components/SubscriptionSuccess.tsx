// src/components/SubscriptionSuccess.tsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // You can store the subscription info in localStorage or context if needed
    if (sessionId) {
      localStorage.setItem('subscriptionSessionId', sessionId);
      
      // Redirect to dashboard after 3 seconds
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionId, navigate]);

  return (
    <div className="max-w-4xl mx-auto text-center py-16">
      <h1 className="text-3xl font-bold text-green-600 mb-4">
        Subscription Successful!
      </h1>
      <p className="mb-6">
        Thank you for subscribing. You'll be redirected to your dashboard shortly.
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
      >
        Go to Dashboard Now
      </button>
    </div>
  );
}