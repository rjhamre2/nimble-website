import React from 'react';

const PlanBilling = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Billing & Plan</h2>
        <p className="text-gray-600">Manage your subscription and billing details</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">💳</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Billing Coming Soon</h3>
        <p className="text-gray-600">Plan details, usage meters, and payment management</p>
      </div>
    </div>
  );
};

export default PlanBilling; 