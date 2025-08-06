export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center shadow-2xl">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-600 text-center">Загрузка...</p>
      </div>
    </div>
  )
}
