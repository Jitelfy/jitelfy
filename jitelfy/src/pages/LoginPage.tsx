import {useEffect, useContext, useState} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { BASE_URL, RestoreUser } from "../api";
import { User } from "../types";


const LoginPage = () => {
  const { setUser } = useContext(UserContext);
  const [ error, setError ] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const usernameHTML = document.getElementById("username") as HTMLInputElement;
    const passwordHTML = document.getElementById("password") as HTMLInputElement;

    const username = (usernameHTML && usernameHTML.value) || "";
    const password = (passwordHTML && passwordHTML.value) || "";

    setError("");

    if (!username || !password) {
      setError("You must enter both a username and password.");
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
        const text = await response.text();
        setError(text.replace("\"", "").replace("\"", ""));
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

    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleLogin();
      }
    });

    restore();
  });

  return (
    <div className="h-screen bg-background-main flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl text-text-main mb-8">Jitelfy</h1>

      {/* Login Form */}
      <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-96">
        {/* Error text (if any) */}
        {error && (
            <p className="text-accent-red text-sm text-center">{error}</p>
        )}

        {/* Username Input */}
        <input
          id="username"
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 mt-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent-blue"
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
            type="button"
            onClick={handleLogin}
            className="w-full p-3 mb-4 bg-accent-blue text-text-main rounded-lg hover:bg-accent-blue-light transition-colors ease-in duration-75"
        >
          Login
        </button>

        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3 border-1 border-text-secondary" />
          <span className="mx-2 text-text-main">or</span>
          <hr className="w-1/3 border-1 border-text-secondary" />
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
