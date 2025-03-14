import {useContext, useEffect, useState} from "react";
import { Link, useNavigate } from 'react-router-dom';
import { BASE_URL } from "../api";
import {BannerArray, IconArray, UserContext} from "../UserContext";
import {User} from "../types";
import {requestCustomizeBanner, requestCustomizeBio, requestCustomizeIcon} from "./SettingsPage";

let NewIcon = -1;
let NewBanner = -1;

const handleIconClick = async (imgID: string) => {
  const img = document.getElementById(imgID);
  if (img != null) {
    const iconIndex = IconArray.indexOf(img.id);

    if (NewIcon != iconIndex) {
      { /* Unselect the old new icon */ }
      let oldImg = document.getElementById(IconArray[NewIcon]);
      if (oldImg != null) {
        oldImg.style.padding = "0.75rem"
        oldImg.style.border = "none";
      }

      { /* Select the new icon */ }
      NewIcon = iconIndex;
      img.style.padding = "0.63rem"
      img.style.border = "2px solid #3354c8";
    }
  }
};

const handleBannerClick = async (banID: string) => {
  const ban = document.getElementById(banID);

  if (ban != null) {
    if (NewBanner != parseInt(banID)) {
      { /* Unselect the old new icon */ }
      let oldBan = document.getElementById(NewBanner.toString(10));
      if (oldBan != null) {
        oldBan.style.padding = "0.75rem";
        oldBan.style.border = "none";
      }

      { /* Select the new banner */ }
      NewBanner = parseInt(banID);
      ban.style.padding = "0.63rem"
      ban.style.border = "2px solid #3354c8";
    }
  }
};

enum signupStage {
  SIGNUP,
  ICON,
  BANNER,
  BIO,
  FINISH
}

const SignUpPage = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newBio, setNewBio] = useState("");

  const [error, setError] = useState("");

  const [newAccountCustomization, setNewAccountCustomization] = useState(signupStage.SIGNUP);

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
    if (!displayName || !username || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
  
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

    {/* Transition to account customization phase */}
    setNewAccountCustomization(signupStage.ICON);
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

        {/* Original sign up page */}
        {newAccountCustomization === signupStage.SIGNUP && (
                <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-96">
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
                      onClick={handleSignUp}
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
                </div>
            )}

        {/* Customize account page */}
        {newAccountCustomization !== signupStage.SIGNUP && newAccountCustomization !== signupStage.FINISH && user && (
            <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-2/5 h-4/5">
              <h2 className="text-text-main text-xl text-center mb-6">Complete your account</h2>

              {/* Profile picture selector */}
              { newAccountCustomization === signupStage.ICON && (
                  <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">
                <h2 className=" text-text-main text-lg">Profile picture</h2>

                <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                {/* Container for default icons */}
                <div id="iconContainer"
                     className="flex flex-row flex-wrap max-h-80 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                  {IconArray.map((imgIndex) => (
                      <img
                          id={imgIndex}
                          src={imgIndex}
                          alt="Default"
                          width = "140px"
                          height = "140px"
                          className="p-3 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                          onClick={() => handleIconClick(imgIndex)}
                      />
                  ))}

                </div>

                <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                <div className="flex w-full flex-row justify-between">
                  <button className="text-text-main w-1/4 bg-background-tertiary px-6 py-2 rounded-xl hover:bg-background-fourth transition-colors"
                          onClick={() => navigate("/feed")}>
                    <p className="">
                      Skip
                    </p>
                  </button>

                  <button className="text-text-main w-1/4 bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors"
                          onClick={() => {
                            requestCustomizeIcon(NewIcon, user);
                            setNewAccountCustomization(signupStage.BANNER);
                          }}>
                    <p className="">
                      Next
                    </p>
                  </button>
                </div>

              </div>
              )}

              {/* Banner selector */}
              { newAccountCustomization === signupStage.BANNER && (
                  <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">
                    <h2 className=" text-text-main text-lg">Profile banner</h2>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    {/* Container for banner colours */}
                    <div id="bannerContainer"
                         className="flex flex-row flex-wrap max-h-80 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                      {BannerArray.map((color) => (
                          <svg height="140" width="140"
                               id={BannerArray.indexOf(color).toString(10)}
                               className="p-3 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                               onClick={() => handleBannerClick(BannerArray.indexOf(color).toString(10))}
                          >
                            <rect width="110" height="110" x="3" y="3" rx="10" ry="10" fill={color} />
                          </svg>
                      ))}

                    </div>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    <div className="flex w-full flex-row justify-between">
                      <button className="text-text-main w-1/4 bg-background-tertiary px-6 py-2 rounded-xl hover:bg-background-fourth transition-colors"
                              onClick={() => navigate("/feed")}>
                        <p className="">
                          Skip
                        </p>
                      </button>

                      <button className="text-text-main w-1/4 bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors"
                              onClick={() => {
                                requestCustomizeBanner(NewBanner, user);
                                setNewAccountCustomization(signupStage.BIO);
                              }}>
                        <p className="">
                          Next
                        </p>
                      </button>
                    </div>

                  </div>
              )}

              {/* Bio selector */}
              { newAccountCustomization === signupStage.BIO && (
                  <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">
                    <h2 className=" text-text-main text-lg">Profile biography</h2>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>


                    <textarea
                        placeholder={"What are you all about?"}
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        rows={10}
                        className="resize-none whitespace-pre-wrap bg-background-main w-full mt-2 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                    </textarea>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    <div className="flex w-full flex-row justify-between">
                      <button className="text-text-main w-1/4 bg-background-tertiary px-6 py-2 rounded-xl hover:bg-background-fourth transition-colors"
                              onClick={() => navigate("/feed")}>
                        <p className="">
                          Skip
                        </p>
                      </button>

                      <button className="text-text-main w-1/4 bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors"
                              onClick={() => {
                                requestCustomizeBio(newBio, user);
                                setNewAccountCustomization(signupStage.FINISH);
                              }}>
                        <p className="">
                          Next
                        </p>
                      </button>
                    </div>

                  </div>
              )}
            </div>
        )}

        {/* All done! */}
        { user && newAccountCustomization === signupStage.FINISH && (
            <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-2/5">
              <h2 className="text-text-main text-xl text-center mb-6">Complete your account</h2>

              <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">
                <hr className="border-1 border-background-tertiary w-full"></hr>

                <h2 className=" text-text-main text-lg">You're all done! :)</h2>
                <p className="text-text-main text-sm">Your account has been successfully customized.</p>

                <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                <div className="flex w-full flex-row justify-end">

                  <button className="text-text-main w-1/4 bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors"
                          onClick={() => {
                            user.icon = NewIcon;
                            setUser(user);
                            navigate("/feed")}}>
                    <p className="">
                      Finish
                    </p>
                  </button>
                </div>

              </div>
            </div>
        )}

      </div>
  );
};

export default SignUpPage;