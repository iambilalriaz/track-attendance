interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'indigo' | 'teal';
}

const colorClasses = {
  blue: 'from-blue-600 to-blue-700',
  green: 'from-emerald-600 to-emerald-700',
  purple: 'from-violet-600 to-violet-700',
  red: 'from-rose-600 to-rose-700',
  orange: 'from-amber-600 to-amber-700',
  indigo: 'from-indigo-600 to-indigo-700',
  teal: 'from-teal-600 to-teal-700',
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: StatsCardProps) {
  return (
    <div className='group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg transition-all hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-800/80'>
      {/* Gradient accent */}
      <div
        className={`absolute right-0 top-0 h-full w-2 bg-linear-to-b ${colorClasses[color]}`}
      />

      {/* Icon */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='text-4xl'>{icon}</div>
        <div
          className={`rounded-full bg-linear-to-br ${colorClasses[color]} p-3 text-white opacity-10 transition-opacity group-hover:opacity-20`}
        />
      </div>

      {/* Content */}
      <div>
        <h3 className='text-sm font-medium text-zinc-600 dark:text-zinc-400'>
          {title}
        </h3>
        <p className='mt-2 text-3xl font-bold text-zinc-900 dark:text-white'>
          {value}
        </p>
        <p className='mt-1 text-xs text-zinc-500 dark:text-zinc-500'>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
