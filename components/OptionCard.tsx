"use client";

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowRightLeft } from 'lucide-react';

interface OptionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconBgColor?: string;
  iconColor?: string;
  hoverColor?: string;
  onClick?: () => void;
  showDivider?: boolean;
}

const OptionCard: React.FC<OptionCardProps> = ({
  icon: Icon,
  title,
  description,
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-600',
  hoverColor = 'hover:bg-gray-50',
  onClick,
  showDivider = true,
}) => {
  return (
    <>
      <div
        onClick={onClick}
        className={`flex items-center p-4 rounded-2xl ${hoverColor} transition-colors cursor-pointer active:scale-98`}
      >
        <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center mr-4`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <ArrowRightLeft className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
      </div>
      {showDivider && <div className="h-px bg-gray-100 mx-4 my-2"></div>}
    </>
  );
};

export default OptionCard;

