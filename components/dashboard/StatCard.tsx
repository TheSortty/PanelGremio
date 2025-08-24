
import React from 'react';
import Card from '../shared/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <Card>
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-indigo-500 bg-opacity-75">
            {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;