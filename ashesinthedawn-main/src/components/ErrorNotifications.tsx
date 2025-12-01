import { X, AlertCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { useErrors } from '../hooks/useErrors';
import { AppError } from '../lib/errorHandling';

export default function ErrorNotifications() {
  const { errors, dismissError, retryError } = useErrors();

  if (errors.length === 0) return null;

  const getIcon = (severity: AppError['severity']) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getColors = (severity: AppError['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/40 border-red-700 text-red-200';
      case 'error':
        return 'bg-red-900/30 border-red-700 text-red-100';
      case 'warning':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-100';
      case 'info':
      default:
        return 'bg-blue-900/30 border-blue-700 text-blue-100';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 space-y-2 max-w-md">
      {errors.map((error) => (
        <div
          key={error.id}
          className={`border rounded-lg p-3 flex gap-3 items-start animate-in slide-in-from-bottom-2 ${getColors(
            error.severity
          )}`}
        >
          {getIcon(error.severity)}
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{error.title}</h4>
            <p className="text-xs mt-1 opacity-90">{error.message}</p>
            
            {error.context && Object.keys(error.context).length > 0 && (
              <details className="text-xs mt-2 opacity-75">
                <summary className="cursor-pointer hover:opacity-100">Details</summary>
                <pre className="text-xs mt-1 overflow-auto max-h-24 bg-black/20 p-1 rounded">
                  {JSON.stringify(error.context, null, 2)}
                </pre>
              </details>
            )}
          </div>

          <div className="flex gap-1 flex-shrink-0">
            {error.recoverable && error.recovery && (
              <button
                onClick={() => retryError(error)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
                title="Retry"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => dismissError(error.id)}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
