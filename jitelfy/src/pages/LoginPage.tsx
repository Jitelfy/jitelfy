import { useEffect, useContext } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { BASE_URL, RestoreUser } from "../api";
import { User } from "../types";


const LoginPage = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = (document.getElementById("username") as HTMLInputElement).value;
    const password = (document.getElementById("password") as HTMLInputElement).value;

    if (!username || !password) {
      alert("enter both username and password.");
      return;
    }

    const loginData = { username, password };

    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
      credentials: "include",
    });
    if (!response.ok) {
        alert("invalid username/password");
        return;
    }
    const loggedInUser: User = JSON.parse(await response.text());
    setUser(loggedInUser);
    navigate("/feed");
  };


  useEffect(() => {
    const restore = async () => {
      const loggedInUser: User = await RestoreUser();
      if (loggedInUser.id != null) {
          setUser(loggedInUser);
          navigate("/feed");
      }

    };

    restore();
  });

  return (
    <div className="h-screen bg-background-main flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl text-text-main mb-6">Jitelfy</h1>

      {/* Login Form */}
      <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-96">
        {/* Username Input */}
        <input
          id="username"
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        {/* Password Input */}
        <input
          id="password"
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        {/* Login Button */}
        <button 
          onClick={handleLogin}
          className="w-full p-3 mb-4 bg-accent-blue text-text-main rounded-lg hover:bg-accent-blue-light inline-block text-center"
        >
          Login
        </button>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3" />
          <span className="mx-2 text-text-secondary">or</span>
          <hr className="w-1/3" />
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-text-secondary">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent-blue hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
