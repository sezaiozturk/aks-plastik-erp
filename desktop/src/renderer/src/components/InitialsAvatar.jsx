export default function InitialsAvatar({ initials, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6 text-[9px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
    xl: 'w-12 h-12 text-base',
  }
  return (
    <div
      className={`${sizes[size]} rounded-full avatar-circle font-bold flex items-center justify-center flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
