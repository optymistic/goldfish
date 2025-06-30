export default function Loading() {
  return (
    <div className="min-h-screen bg-premium flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="loading-rings mx-auto"></div>
        <p className="text-lg font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  )
}
