export default function StatsCard({ icon: Icon, label, value, sub, gradient, iconBg, trend }) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${iconBg || 'bg-gradient-to-br from-primary-500 to-purple-600'}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className={`text-3xl font-black bg-gradient-to-r ${gradient || 'from-primary-500 to-purple-500'} bg-clip-text text-transparent`}>
          {value}
        </p>
        <p className="text-sm font-semibold text-dark-700 dark:text-dark-200 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-dark-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
