'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPlans, PlanTier } from '@/lib/tenants/plans';

type Step = 'account' | 'plan' | 'branding' | 'settings' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [loading, setLoading] = useState(false);

  // Form data
  const [accountData, setAccountData] = useState({
    companyName: '',
    subdomain: '',
    email: '',
    firstName: '',
    lastName: '',
  });

  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('professional');

  const [brandingData, setBrandingData] = useState({
    logo: null as File | null,
    primaryColor: '#3b82f6',
    accentColor: '#8b5cf6',
  });

  const [settingsData, setSettingsData] = useState({
    timezone: 'UTC',
    currency: 'USD',
    language: 'en',
  });

  const steps: { id: Step; title: string; description: string }[] = [
    { id: 'account', title: 'Account', description: 'Create your account' },
    { id: 'plan', title: 'Plan', description: 'Choose your plan' },
    { id: 'branding', title: 'Branding', description: 'Customize your brand' },
    { id: 'settings', title: 'Settings', description: 'Configure settings' },
    { id: 'complete', title: 'Complete', description: 'All done!' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Create tenant
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountData.companyName,
          slug: accountData.subdomain.toLowerCase(),
          subdomain: accountData.subdomain.toLowerCase(),
          ownerEmail: accountData.email,
          ownerId: 'current-user-id', // TODO: Get from auth
          plan: selectedPlan,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update branding if logo was uploaded
        if (brandingData.logo) {
          const formData = new FormData();
          formData.append('logo', brandingData.logo);

          await fetch(`/api/tenants/${data.tenant.id}/branding`, {
            method: 'PUT',
            body: formData,
          });
        }

        // Update colors
        await fetch(`/api/tenants/${data.tenant.id}/branding`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primaryColor: brandingData.primaryColor,
            accentColor: brandingData.accentColor,
          }),
        });

        setCurrentStep('complete');
      } else {
        alert('Error creating tenant: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Error completing onboarding');
    } finally {
      setLoading(false);
    }
  };

  const validateSubdomain = (value: string) => {
    const regex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    return regex.test(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Omni-Sales</h1>
          <p className="text-gray-600">Let's set up your account in just a few steps</p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index <= currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-sm mt-2 text-center">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-gray-500 text-xs">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Step 1: Account */}
          {currentStep === 'account' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={accountData.companyName}
                    onChange={(e) => setAccountData({ ...accountData, companyName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Acme Inc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subdomain
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={accountData.subdomain}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase();
                        if (validateSubdomain(value) || value === '') {
                          setAccountData({ ...accountData, subdomain: value });
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="acme"
                    />
                    <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                      .omnisales.com
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Your store will be accessible at {accountData.subdomain || 'yourstore'}.omnisales.com
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={accountData.firstName}
                      onChange={(e) => setAccountData({ ...accountData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={accountData.lastName}
                      onChange={(e) => setAccountData({ ...accountData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={accountData.email}
                    onChange={(e) => setAccountData({ ...accountData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Plan */}
          {currentStep === 'plan' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Choose Your Plan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {getAllPlans().map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer border-2 rounded-lg p-6 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    )}
                    <h3 className="text-xl font-bold mt-2">{plan.name}</h3>
                    <div className="text-3xl font-bold my-4">
                      ${plan.pricing.monthly}
                      <span className="text-sm text-gray-600">/mo</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{plan.tagline}</p>
                    <ul className="space-y-2">
                      {plan.highlights.slice(0, 5).map((highlight, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <svg className="w-4 h-4 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Branding */}
          {currentStep === 'branding' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Customize Your Brand</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBrandingData({ ...brandingData, logo: file });
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload your company logo (max 2MB, PNG or JPG)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingData.primaryColor}
                        onChange={(e) => setBrandingData({ ...brandingData, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={brandingData.accentColor}
                        onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingData.accentColor}
                        onChange={(e) => setBrandingData({ ...brandingData, accentColor: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                  <div className="space-y-2">
                    <button
                      style={{ backgroundColor: brandingData.primaryColor }}
                      className="px-4 py-2 text-white rounded-lg"
                    >
                      Primary Button
                    </button>
                    <button
                      style={{ backgroundColor: brandingData.accentColor }}
                      className="px-4 py-2 text-white rounded-lg ml-2"
                    >
                      Accent Button
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Settings */}
          {currentStep === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Configure Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={settingsData.timezone}
                    onChange={(e) => setSettingsData({ ...settingsData, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Asia/Bangkok">Bangkok</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={settingsData.currency}
                    onChange={(e) => setSettingsData({ ...settingsData, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="THB">THB - Thai Baht</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settingsData.language}
                    onChange={(e) => setSettingsData({ ...settingsData, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="th">ไทย (Thai)</option>
                    <option value="es">Español (Spanish)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">All Set!</h2>
              <p className="text-gray-600 mb-8">
                Your account has been created successfully. You can now start using Omni-Sales.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'complete' && (
            <div className="flex justify-between mt-8 pt-8 border-t">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {currentStep === 'settings' ? (
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Complete Setup'}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 'account' && (!accountData.companyName || !accountData.subdomain || !accountData.email))
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
