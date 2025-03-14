import {useContext, useEffect, useState} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from "../api";
import {UserContext} from "../UserContext";
import {User} from "../types";

const SignUpPage = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
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
  }

  const handleSignUp = async () => {
    // Basic validation
    setError("");

    if (!displayName || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    // Signup data
    const signUpData = {
      displayname: displayName,
      username: username,
      password: password,
      icon: 0
    };
  
    // Send the POST request
    const response = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signUpData),
    credentials: "include",
    });
  
    if (!response.ok) {
      const message = await response.text();
      setError(message.replace("\"", "").replace("\"", ""));
      return;
    }

    handleLogin();
    navigate("/feed");
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleSignUp();
    });
  })

  return (
    <div className="h-screen bg-background-main flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl text-text-main mb-6">Jitelfy</h1>
      
      {/* Signup Form */}
      <form
        onSubmit={handleSignUp}
        className="bg-background-secondary p-8 rounded-lg shadow-lg w-96"
      >
        {error && <p className="text-accent-red text-sm mb-4">{error}</p>}
        
        {/* Display Name Input */}
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full p-3 mb-4 mt-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />
        
        {/* Username Input */}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />
        
        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />
        
        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-white bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {/* Sign-Up Button */}
        <button
          type="button"
          className="w-full p-3 mb-4 bg-accent-blue text-text-main rounded-lg hover:bg-accent-blue-light transition-colors ease-in duration-75"
        >
          <p>Create Account</p>
        </button>
        
        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3 border-1 border-text-secondary" />
          <span className="mx-2 text-text-main">or</span>
          <hr className="w-1/3 border-1 border-text-secondary" />
        </div>
        
        {/* Sign Up Link */}
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link to="/login" className="text-accent-blue hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUpPage;