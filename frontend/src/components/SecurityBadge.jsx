import React from 'react';
import { Shield, Lock, CheckCircle2, BadgeCheck } from 'lucide-react';

const SecurityBadge = ({ variant = 'default', className = '' }) => {
  const variants = {
    default: {
      icon: Shield,
      text: '100% Safe & Secure',
      bgClass: 'bg-green-50 dark:bg-green-900/20',
      textClass: 'text-green-700 dark:text-green-400',
      borderClass: 'border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    verified: {
      icon: BadgeCheck,
      text: 'Verified & Protected',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      textClass: 'text-blue-700 dark:text-blue-400',
      borderClass: 'border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    encrypted: {
      icon: Lock,
      text: 'Bank-Grade Security',
      bgClass: 'bg-purple-50 dark:bg-purple-900/20',
      textClass: 'text-purple-700 dark:text-purple-400',
      borderClass: 'border-purple-200 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    trusted: {
      icon: CheckCircle2,
      text: 'Trusted by Millions',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    }
  };

  const config = variants[variant] || variants.default;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bgClass} ${config.textClass} ${config.borderClass} ${className}`}>
      <Icon size={14} className={config.iconColor} />
      <span>{config.text}</span>
    </div>
  );
};

export default SecurityBadge;
