
const SignUpPage = () => {
  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1>
        SHE JITEL ON MY FY TILL i
      </h1>
    </div>
  );
};

const LoginPage = () => {
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
      <button className="w-full p-3 mb-4 bg-black text-white rounded-lg hover:bg-gray-700">
        Login
      </button>

      {/* Text for the Or */}
      <div className="flex items-center justify-center mb-4">
        <hr className="w-1/3" />
        <span className="mx-2 text-gray-500">or</span>
        <hr className="w-1/3" />
      </div>

      {/* Login with Spotify Button, later we'll make this with spotify api  */}
      <button className="w-full p-3 mb-4 bg-green-500 text-white rounded-lg hover:bg-green-600">
        Login with Spotify
      </button>

      {/* Sign up button */}
      <p className="text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <a href="#" className="text-blue-500 hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  </div>
  );
} 


function App() {
  return (
    <LoginPage></LoginPage>
  );
}

export default App;

