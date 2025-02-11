import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Quicklinks, FriendActivity } from './components/Sidebars.tsx'

const SignUpPage = () => {
  return (
    <div className="h-screen bg-background-main flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl text-text-main mb-6">Jitelfy</h1>

      {/* Sign Up Form */}
      <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-96">
        {/* Email Input */}
        <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border border-s-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
          />

        {/* Username Input */}
        <input
            type="text"
            placeholder="Username"
            className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
          />
        
        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-white bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />

      {/* Date of Birth */}
      <div className="mb-4">
      <label className="block text-text-secondary text-sm mb-2"><p>Date of Birth</p></label>
        <input
          type="date"
          className="w-full p-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Sign-Up Button */}
      <button
        className="w-full p-3 mb-4 bg-accent-blue-light text-text-main rounded-lg hover:bg-accent-blue">
        <p>Create Account</p>
      </button>

      {/* Text for the Or */}
      <div className="flex items-center justify-center mb-4">
        <hr className="w-1/3" />
        <span className="mx-2 text-text-secondary"><p>or</p></span>
        <hr className="w-1/3" />
      </div>

      {/* Sign Up with Spotify Button */}
      <button className="w-full p-3 mb-4 bg-accent-green-light text-text-main rounded-lg hover:bg-accent-green">
        <p>Sign Up with Spotify</p>
      </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-text-secondary">
          <p>Already have an account?{" "}</p>
          <Link to="/login" className="text-accent-blue hover:underline">
            <p>Log In</p>
          </Link>
        </p>
      </div>
    </div>
  );
};

const LoginPage = () => {
  return (
    <div className="h-screen bg-background-main flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl text-text-main mb-6">Jitelfy</h1>

      {/* Login Form */}
      <div className="bg-background-secondary p-8 rounded-lg shadow-lg w-96">
        {/* Username Input */}
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 mb-4 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent-blue"
        />

        {/* Login Button */}
        <Link to="/feed"
          className="w-full p-3 mb-4 bg-accent-blue text-text-main rounded-lg hover:bg-accent-blue-light inline-block text-center"
        >
          Login
        </Link>

        {/* Text for the Or */}
        <div className="flex items-center justify-center mb-4">
          <hr className="w-1/3" />
          <span className="mx-2 text-text-secondary"><p>or</p></span>
          <hr className="w-1/3" />
        </div>

        {/* Login with Spotify Button */}
        <button className="w-full p-3 mb-4 bg-accent-green-light text-white rounded-lg hover:bg-accent-green">
          <p>Login with Spotify</p>
        </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-text-secondary">
          <p>Don't have an account?{" "}</p>
          <Link to="/signup" className="text-accent-blue hover:underline">
            <p>Sign Up</p>
          </Link>
        </p>
      </div>
    </div>
  );
};

const BASE_URL = "https://mafjre94nh.execute-api.us-west-2.amazonaws.com"


interface Post {
  id: string;
  userid: string;
  parentId: string;
  childIds: string[];
  likeIds: string[];
  time: string;
  text: string;
  embed: string;
  song: string;
}

export interface User {
    id: string;
    displayname: string;
    username: string;
    icon: string;
    following: string[];
    followers: string[];
}

interface PackagedPost {
    post: Post;
    user: User;
}

export let current_user: User;

// Simulate the API response
async function getContent(path: string): Promise<string> {
 const content = await fetch(`${BASE_URL}${path}`);
 return content.text();
}

async function getPosts(): Promise<PackagedPost[]> {
    const response = getContent("/posts/top");
    const posts: PackagedPost[] = JSON.parse(await response);
    return posts;
}

async function getUser(path: string): Promise<User> {
    const response = getContent("/users?userid=" + path);
    const user: User = JSON.parse(await response);
    return user;
}


const FeedPage = () => {
  // State to store fetched posts.
  const [posts, setPosts] = useState<PackagedPost[]>([]);

  // State variables for new post text and song that goes in the feed
  const [newPostText, setNewPostText] = useState("");
  const [newPostSong, setNewPostSong] = useState("");

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build the post data with keys expected from the backend
    const postData = {
      userid: "679579fdc5f8a584dd34c5e6", // Hardcoded MY user id (must be lowercase)
      text: newPostText,
      song: newPostSong,
    };

    // Send the POST request
    await fetch(`${BASE_URL}/posts/top`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData),
    });

    // Refresh posts and clear the form fields
    const fetchedPosts = await getPosts();
    setPosts(fetchedPosts);
    setNewPostText("");
    setNewPostSong("");
  };

  useEffect(() => {
    const fetchPosts = async () => {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    };
    fetchPosts();
  }, []);

  return (
    <div className="h-screen bg-background-main flex">

      {/* Sidebar - Left */}
      {Quicklinks(current_user)}

      {/* Feed - Main Content */}
      <div className="flex-1 relative grid grid-auto-flow auto-rows-auto">
        <h1 className="text-white text-2xl sticky top-0 my-6 mx-10">Feed</h1>
        <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">

          {/* Create Post Form */}
          <div className="bg-background-secondary p-4 rounded-lg mb-6 mx-10">
            <form onSubmit={handleSubmitPost} className="space-y-4">
              {}
              <input
                type="text"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                placeholder="What is up guys"
                className="w-full p-3 bg-background-main text-text-main rounded-lg border border-background-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
              <input
                type="text"
                value={newPostSong}
                onChange={(e) => setNewPostSong(e.target.value)}
                placeholder="put song link here"
                className="w-full p-3 bg-background-main text-text-main rounded-lg border border-background-tertiary focus:outline-none focus:ring-2 focus:ring-accent-blue"
              />
              <button
                type="submit"
                className="bg-accent-blue-light text-text-main px-6 py-2 rounded-lg hover:bg-accent-blue transition-colors"
              >
                Post
              </button>
            </form>
          </div>
          {posts.map((post) => (
            <div
              key={post.post.id}
              className="bg-background-secondary p-4 rounded-lg mb-6 mx-10"
            >
              <div className="flex items-center">
                <div>
                  <img
                    className="size-12 rounded-full mb-2 mr-3"
                    src={post.user.icon}
                    alt=""
                  />
                </div>
                <div>
                  {/* Display name, @username, timestamp posted */}
                  <p className="text-text-main font-bold">
                    {post.user.displayname}
                  </p>
                  <p className="text-text-secondary font-normal">
                    @{post.user.username}
                  </p>
                  <p className="text-text-secondary text-sm">
                    {new Date(post.post.time).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-text-main mb-2">{post.post.text}</p>
              {post.post.embed && (
                <div className="mt-2">
                  <img
                    src={post.post.embed}
                    className="w-full h-40 rounded-md"
                    alt=""
                  />
                </div>
              )}
              {post.post.song && (
                <div className="mt-2">
                  <iframe
                    src={post.post.song}
                    className="w-full h-20"
                    title={`Song for ${post.post.id}`}
                    allowFullScreen
                  ></iframe>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Sidebar - Right */}
      {FriendActivity()}
    </div>
  );
};

const ProfilePage = () => {
  if (current_user == null) {
      return (
          <div className="h-screen bg-background-main flex">
          {/* Sidebar - Left */}
          {Quicklinks(current_user)}
          <div className="flex-1 bg-background-main p-6 overflow-auto">
          <div className="relative w-full">
          </div>
          </div>
          {/* Sidebar - Right */}
          {FriendActivity()}
          </div>
      );
  }

  return (
    <div className="h-screen bg-background-main flex">
    {/* Sidebar - Left */}
    {Quicklinks(current_user)}

      {/* Main Content - Middle */}
      <div className="flex-1 bg-background-main p-6 overflow-auto">
        <div className="bg-background-secondary p-6 rounded-lg flex flex-col items-center">
          <div className="relative w-full">
            <div className="w-full h-48 bg-green-500 flex items-center justify-center">
              <h1 className="text-4xl text-text-main">WE'RE COOKED</h1>
            </div>
            <img src={current_user?.icon} className="absolute top-32 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-background-tertiary rounded-full border-4 border-background-main"></img>
          </div>
          <div className="text-center mt-16">
            <h2 className="text-2xl text-text-main">{current_user?.displayname || 'user cannot be loaded'}</h2>
            <p className="text-text-secondary">@{current_user?.username || 'username'}</p>
          </div>
        </div>
      </div>

      {/* Sidebar - Right */}
      {FriendActivity()}
    </div>
  );
};

function App() {
  const [user, setUserData] = useState<User>();

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await getUser("67957a921a129c6d1aeb8691");
      setUserData(userData);
    };

    fetchUserData();
  }, []);

  if (user != null) {
      current_user = user;
  }


  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;
