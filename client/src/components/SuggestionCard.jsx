import { Lightbulb, TrendingUp, Cpu, Eye, Clock } from 'lucide-react';

const CATEGORY_CONFIG = {
  performance:      { icon: <TrendingUp className="w-4 h-4" />, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/30' },
  memory:           { icon: <Cpu className="w-4 h-4" />,        color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  readability:      { icon: <Eye className="w-4 h-4" />,        color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-950/30' },
  complexity:       { icon: <Clock className="w-4 h-4" />,      color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  variable_naming:  { icon: <Lightbulb className="w-4 h-4" />,  color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
  general:          { icon: <Lightbulb className="w-4 h-4" />,  color: 'text-primary-500',bg: 'bg-primary-50 dark:bg-primary-950/30' },
};

export default function SuggestionCard({ suggestion, index }) {
  const { category = 'general', suggestion: text } = suggestion;
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.general;

  return (
    <div className="flex gap-3 p-4 rounded-xl bg-white dark:bg-dark-800 border border-dark-200 dark:border-dark-700 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
      <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${config.color}`}>
          {category.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-dark-700 dark:text-dark-200 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
