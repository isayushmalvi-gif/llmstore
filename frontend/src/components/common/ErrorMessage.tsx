import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export const ErrorMessage = ({ message, onRetry }: ErrorMessageProps) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center">
      <AlertCircle size={28} className="text-red-400" />
    </div>
    <p className="text-gray-400 text-sm">{message}</p>
    {onRetry && (
      <button onClick={onRetry}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all">
        <RefreshCw size={14} /> Try Again
      </button>
    )}
  </div>
)
