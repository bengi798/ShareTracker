import { LabelHTMLAttributes } from 'react';

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label {...props} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} />
  );
}
