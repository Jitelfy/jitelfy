import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from "../UserContext";
import { useContext } from "react";
import { BASE_URL } from "../api";

const SignUpPage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Basic validation
    if (!displayName || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
  
    // signup data
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

    navigate("/login");
  };

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
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
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
          type="submit"
          className="w-full p-3 mb-4 bg-accent-blue-light text-text-main rounded-lg hover:bg-accent-blue"
        >
          <p>Create Account</p>
        </button>
        
        {/* Divider */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3" />
          <span className="mx-2 text-text-secondary">or</span>
          <hr className="w-1/3" />
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