import { useState } from "react";

const SignUpPage = () => {
  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-white">SHE JITEL ON MY FY TILL i</h1>
    </div>
  );
};

const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl font-bold text-white mb-6">Jitelfy</h1>

      {/* Login Form */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        {/* Username Input */}
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 border border-gray-700 rounded-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-gray-700 rounded-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Login Button */}
        <button
          className="w-full p-3 mb-4 bg-black text-white rounded-lg hover:bg-gray-700"
          onClick={onLogin}
        >
          Login
        </button>

        {/* Text for the Or */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3" />
          <span className="mx-2 text-gray-500">or</span>
          <hr className="w-1/3" />
        </div>

        {/* Login with Spotify Button */}
        <button className="w-full p-3 mb-4 bg-green-500 text-white rounded-lg hover:bg-green-600">
          Login with Spotify
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400">
          Don't have an account?{" "}
          <a href="#" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
};

const FeedPage = () => {
  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-60 bg-gray-800 p-6">
        <h2 className="text-white text-xl mb-6">Jitelfy</h2>
        <ul>
          <li className="text-white mb-4">Home</li>
          <li className="text-white mb-4">Explore</li>
          <li className="text-white mb-4">Activity</li>
          <li className="text-white mb-4">More</li>
          <li className="text-white mb-4">Your Name</li>
        </ul>
      </div>

      {/* Feed */}
      <div className="flex-1 bg-gray-900 p-6 overflow-auto">
        {/* Feed Content */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gray-600 rounded-full mr-4"></div>
            <div>
              <p className="text-white font-bold">Name</p>
              <p className="text-gray-400 text-sm">Currently listening to</p>
            </div>
          </div>
          <p className="text-white">Post content here...</p>
        </div>
        {/* Feed Content, for now this is just going to be boiletplate posts */}
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-gray-600 rounded-full mr-4"></div>
            <div>
              <p className="text-white font-bold">Name</p>
              <p className="text-gray-400 text-sm">Currently listening to</p>
            </div>
          </div>
          <p className="text-white">Post content here...</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <div>
      {isLoggedIn ? (
        <FeedPage />
      ) : (
        <LoginPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
