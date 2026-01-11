interface LeaveCardProps {
  title: string;
  used: number;
  total?: number;
  icon: string;
  color: "blue" | "green" | "orange" | "pink";
  description: string;
}

const colorClasses = {
  blue: "from-blue-600 to-blue-700",
  green: "from-emerald-600 to-emerald-700",
  orange: "from-amber-600 to-amber-700",
  pink: "from-pink-600 to-pink-700",
};

const bgColorClasses = {
  blue: "bg-blue-100 dark:bg-blue-900/20",
  green: "bg-emerald-100 dark:bg-emerald-900/20",
  orange: "bg-amber-100 dark:bg-amber-900/20",
  pink: "bg-pink-100 dark:bg-pink-900/20",
};

export default function LeaveCard({
  title,
  used,
  total,
  icon,
  color,
  description,
}: LeaveCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/60 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-700/50 p-6 shadow-lg transition-all hover:shadow-xl hover:bg-white/80 dark:hover:bg-zinc-800/80">
      {/* Gradient header */}
      <div
        className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${colorClasses[color]}`}
      />

      {/* Icon background */}
      <div className={`mb-4 inline-flex rounded-xl ${bgColorClasses[color]} p-3 backdrop-blur-sm`}>
        <span className="text-3xl">{icon}</span>
      </div>

      {/* Content */}
      <div>
        <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {title}
        </h3>
        <p className="mt-2 text-4xl font-bold text-zinc-900 dark:text-white">
          {total !== undefined ? `${used}/${total}` : used}
        </p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}
