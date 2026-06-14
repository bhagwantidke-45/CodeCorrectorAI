import { Cpu } from 'lucide-react';

export default function LoadingOverlay({ message = 'Analyzing your code with AI...', subMessage = 'This may take a few seconds' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-900/80 backdrop-blur-sm">
      <div className="glass-card p-10 flex flex-col items-center gap-6 max-w-sm w-full mx-4 text-center animate-slide-up">
        {/* Animated rings */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-primary-200 dark:border-primary-900" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-purple-500 border-b-transparent border-l-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-7 h-7 text-primary-500 animate-pulse" />
          </div>
        </div>

        {/* AI dots animation */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>

        <div>
          <p className="text-lg font-bold text-dark-800 dark:text-dark-100">{message}</p>
          <p className="text-sm text-dark-400 mt-1">{subMessage}</p>
        </div>

        {/* Progress shimmer bar */}
        <div className="w-full h-1.5 bg-dark-200 dark:bg-dark-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary-500 via-purple-500 to-primary-500 rounded-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
}
