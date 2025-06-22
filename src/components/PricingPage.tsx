import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/supabase/auth-context';
import CheckoutButton from './checkout/checkButton';

type PricingPeriod = 'monthly' | 'annually';

interface PricingTier {
  name: string;
  price: {
    monthly: number;
    annually: number;
  };
  priceId: {
    monthly: string;
    annually: string;
  };
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
}

export default function PricingPage() {
    const [billingPeriod, setBillingPeriod] = useState<PricingPeriod>('monthly');
    const { user: _user } = useAuth();
    const stripeMonthlyPriceId = import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY;

  const pricingTiers: PricingTier[] = [
    {
      name: "Basic",
      price: {
        monthly: 4.99,
        annually: 39.99,
      },
      priceId: {
        monthly: stripeMonthlyPriceId,
        annually: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUALLY,
      },
      description: "Everything you need to get started with your newsletter",
      features: [
        "2 newsletters per month",
        "Basic research assistant",
        "1 infographic per month",
        "Email support"
      ],
      cta: "Get Started"
    },
    {
      name: "Enterprise",
      price: {
        monthly: 29.99,
        annually: 299.99,
      },
      priceId: {
        monthly: stripeMonthlyPriceId,
        annually: import.meta.env.VITE_STRIPE_PRICE_ID_ANNUALLY,
      },
      description: "For professional newsletter creators and teams",
      features: [
        "Unlimited newsletters",
        "Premium research assistant",
        "Unlimited infographics",
        "24/7 priority support",
        "Advanced analytics and insights",
        "Team collaboration features",
        "Custom branding"
      ],
      cta: "Contact Sales"
    }
  ];

//   const toggleBillingPeriod = () => {
//     setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly');
//   };

  return (
    <div className="bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 max-w-xl mx-auto text-xl text-gray-500">
            Choose the perfect plan for your newsletter needs
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-12 flex justify-center">
          <div className="relative bg-gray-100 p-0.5 rounded-lg flex">
            <button
              type="button"
              className={`${
                billingPeriod === 'monthly'
                  ? 'bg-white border-gray-200 shadow-sm'
                  : 'border border-transparent'
              } relative py-2 px-6 border rounded-md text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`${
                billingPeriod === 'annually'
                  ? 'bg-white border-gray-200 shadow-sm'
                  : 'border border-transparent'
              } ml-0.5 relative py-2 px-6 border rounded-md text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10`}
              onClick={() => setBillingPeriod('annually')}
            >
              Annually
              <span className="absolute -top-2 -right-12 bg-indigo-100 text-indigo-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing tiers */}
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-2 xl:mx-auto xl:max-w-4xl">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`${
                tier.popular
                  ? 'border-2 border-indigo-500 shadow-md'
                  : 'border border-gray-200'
              } rounded-lg shadow-sm divide-y divide-gray-200 bg-white`}
            >
              {tier.popular && (
                <div className="bg-indigo-500 rounded-t-lg py-1.5">
                  <p className="text-xs text-white text-center font-semibold uppercase tracking-wide">
                    Most popular
                  </p>
                </div>
              )}
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">{tier.name}</h2>
                <p className="mt-4 text-sm text-gray-500">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${tier.price[billingPeriod]}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    {billingPeriod === 'monthly' ? '/mo' : '/year'}
                  </span>
                </p>
                <CheckoutButton 
                  priceId={tier.priceId[billingPeriod]} 
                  productName={tier.name} 
                />
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  What's included
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 max-w-3xl">
            <dl className="space-y-8">
              <div>
                <dt className="text-lg font-medium text-gray-900">
                  How do I change my plan?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  You can change your plan at any time from your account settings. If you upgrade, you'll be charged the prorated amount for the remainder of your billing cycle. If you downgrade, you'll receive credit for your next billing cycle.
                </dd>
              </div>
              <div>
                <dt className="text-lg font-medium text-gray-900">
                  Can I cancel my subscription?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Yes, you can cancel your subscription at any time from your account settings. Once canceled, you'll have access to your current plan until the end of your billing cycle.
                </dd>
              </div>
              <div>
                <dt className="text-lg font-medium text-gray-900">
                  Do you offer a free trial?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  We offer a 14-day free trial for new users. No credit card required.
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 border-t border-gray-200 pt-12 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Create your account now and start building amazing newsletters.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
