// src/components/PricingSection.tsx
import React from 'react';

const PricingSection: React.FC = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "/month",
      description: "Perfect to get started",
      features: [
        "Basic portfolio tracking",
        "Up to 5 assets",
        "Real-time prices",
        "Basic analytics",
      ],
      buttonText: "Get Started",
      popular: false,
      color: "gray",
    },
    {
      name: "Pro",
      price: "9.99",
      period: "/month",
      description: "Best for active traders",
      features: [
        "Unlimited assets",
        "Advanced analytics",
        "Portfolio reports",
        "Priority support",
        "Ad-free experience",
      ],
      buttonText: "Start Free Trial",
      popular: true,
      color: "emerald",
    },
    {
      name: "Premium",
      price: "19.99",
      period: "/month",
      description: "For serious investors",
      features: [
        "Everything in Pro",
        "AI predictions",
        "Tax optimization",
        "Exclusive insights",
        "1-on-1 onboarding",
      ],
      buttonText: "Go Premium",
      popular: false,
      color: "violet",
    },
  ];

  return (
    <div className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your investment journey. 
            Cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-3xl p-8 shadow-xl transition-all hover:-translate-y-2 ${
                plan.popular ? 'ring-2 ring-emerald-500 scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-sm font-semibold px-6 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-6 flex items-baseline justify-center">
                  <span className="text-6xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-500 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-emerald-500 text-xl">✓</span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all hover:scale-105 ${
                  plan.popular
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-900 hover:bg-black text-white'
                }`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-gray-500 mt-12 text-sm">
          All plans include secure bank-level encryption • 30-day money-back guarantee
        </p>
      </div>
    </div>
  );
};

export default PricingSection;