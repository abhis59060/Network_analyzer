export default function DeleteConfirmation({
  show,
  onConfirm,
  onCancel
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <p className="mb-6 text-white text-lg">Are you sure you want to delete the analysis data?</p>
        <div className="flex space-x-3 justify-center">
          {/* 🔥 SIMPLE BLUE YES BUTTON */}
          <button
            onClick={onConfirm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 hover:scale-105"
          >
            Yes
          </button>
          
          {/* 🔥 SIMPLE GRAY NO BUTTON */}
          <button
            onClick={onCancel}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition duration-300 hover:scale-105"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}