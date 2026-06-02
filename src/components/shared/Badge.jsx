export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    present: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    absent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    late: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    superadmin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    employee: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
}
