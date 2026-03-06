import { InputHTMLAttributes, forwardRef } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`block w-full rounded-none border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#0038a8] focus:outline-none focus:ring-1 focus:ring-[#0038a8] disabled:bg-gray-100 dark:disabled:bg-zinc-800 ${className}`}
  />
));
Input.displayName = 'Input';
