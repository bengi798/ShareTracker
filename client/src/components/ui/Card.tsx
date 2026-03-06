export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-gray-900 dark:border-gray-500 bg-white dark:bg-zinc-900 ${className}`}>
      {children}
    </div>
  );
}
