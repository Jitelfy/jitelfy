function App() {
  return (
    <div className="h-screen bg-gray-200 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-300">
        <h1 className="text-3xl font-bold text-black">Jitelfy</h1>
        {/* Placeholder for icons like Home, Notifications, etc. */}
        <div className="flex space-x-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
      </div>

      {/* Main Content (Landing Page) */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-black mb-4">Hi GUYSS</h2>
          <p className="text-lg text-gray-700 mb-6">We're cooked + I'm carrying.</p>
          <button className="px-6 py-2 bg-blue-500 text-white text-lg font-semibold rounded-full hover:bg-blue-600">
            Let's get this vic-roy
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
