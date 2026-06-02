export default function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-gray-200 border-t-teal-600 dark:border-gray-600 dark:border-t-teal-400`}
      />
      {text && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{text}</p>
      )}
    </div>
  );
}
