export const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="w-12 h-12 border-4 border-gray-800 border-t-purple-500 rounded-full animate-spin" />
    <p className="text-gray-500 text-sm">Scanning hardware...</p>
  </div>
)
