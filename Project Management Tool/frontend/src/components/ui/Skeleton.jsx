const Skeleton = ({ className = '', variant = 'rectangular' }) => {
  const baseClass = 'animate-pulse bg-surface-200';
  const variants = {
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    text: 'rounded-sm h-4 w-3/4'
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`} />
  );
};

export default Skeleton;
