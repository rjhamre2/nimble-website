import React from 'react';

const AnalyticsReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
        <p className="text-gray-600">View detailed insights and performance metrics</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Coming Soon</h3>
        <p className="text-gray-600">Charts, graphs, and detailed reports for your AI performance</p>
      </div>
    </div>
  );
};

export default AnalyticsReports; 