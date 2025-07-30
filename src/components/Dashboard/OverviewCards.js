import React from 'react';
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

const OverviewCards = () => {
  // Mock data - replace with real data from your backend
  const metrics = [
    {
      title: 'Total Conversations',
      value: '1,247',
      change: '+12%',
      changeType: 'increase',
      icon: ChatBubbleLeftRightIcon,
      color: 'blue',
      description: 'vs last week'
    },
    {
      title: 'Avg Response Time',
      value: '1.6s',
      change: '-0.3s',
      changeType: 'decrease',
      icon: ClockIcon,
      color: 'green',
      description: 'vs last week'
    },
    {
      title: 'Resolved Queries',
      value: '89%',
      change: '+3%',
      changeType: 'increase',
      icon: CheckCircleIcon,
      color: 'purple',
      description: 'vs last week'
    },
    {
      title: 'Active Platforms',
      value: '3',
      change: '+1',
      changeType: 'increase',
      icon: GlobeAltIcon,
      color: 'orange',
      description: 'WhatsApp, IG, Website'
    }
  ];

  const getColorClasses = (color, changeType) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    const changeColorMap = {
      increase: 'text-green-600',
      decrease: 'text-red-600'
    };

    return {
      card: colorMap[color],
      change: changeColorMap[changeType]
    };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const colors = getColorClasses(metric.color, metric.changeType);
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors.card}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center space-x-1">
                  {metric.changeType === 'increase' ? (
                    <ArrowUpIcon className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${colors.change}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {metric.title}
                </p>
                <p className="text-xs text-gray-500">
                  {metric.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OverviewCards; 