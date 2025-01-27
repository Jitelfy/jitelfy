import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

const SignUpPage = () => {
  return (
    <div className="h-screen bg-gray-900 flex flex-col items-center justify-center">
      {/* Logo */}
      <h1 className="text-4xl font-bold text-white mb-6">Jitelfy</h1>

      {/* Sign Up Form */}
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        {/* Email Input */}
        <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-4 border border-gray-700 rounded-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

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

        {/* Confirm Password Input */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full p-3 mb-4 border border-gray-700 rounded-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      {/* Date of Birth */}
      <div className="mb-4">
      <label className="block text-gray-400 text-sm mb-2">Date of Birth</label>
        <input
          type="date"
          className="w-full p-3 border border-gray-700 rounded-lg text-white bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Login Button */}
      <button
        className="w-full p-3 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-700">
        Create Account
      </button>

      {/* Text for the Or */}
      <div className="flex items-center justify-center mb-4">
        <hr className="w-1/3" />
        <span className="mx-2 text-gray-500">or</span>
        <hr className="w-1/3" />
      </div>

      {/* Sign Up with Spotify Button */}
      <button className="w-full p-3 mb-4 bg-green-500 text-white rounded-lg hover:bg-green-600">
        Sign Up with Spotify
      </button>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-500 hover:underline">
            Log In
          </Link>
        </p>
      </div>
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
        <Link to="/feed"
          className="w-full p-3 mb-4 bg-black text-white rounded-lg hover:bg-gray-700 inline-block text-center"
        >
          Login
        </Link>

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
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

const BASE_URL = "http://localhost:8080";

interface Post {
  id: string;
  userId: string;
  parentId: string;
  childIds: string[];
  likeIds: string[];
  time: string;
  text: string;
  embed: string;
  song: string;
}

interface User {
    id: string;
    username: string;
    icon: string;
    following: string[];
    followers: string[];
}

interface PackagedPost {
    post: Post;
    user: User;
}

// Simulate the API response
async function getContent(path: string): Promise<string> {
    /*
  console.log(`Simulating API call to: ${BASE_URL}${path}`);
  // Fake response data
  const mockResponse = JSON.stringify([
    {
      Id: "1",
      UserId: "SuperSingingSimon",
      ParentId: "",
      ChildIds: [],
      LikeIds: ["like1", "like2"],
      Time: "2025-01-22T14:30:00Z",
      Text: "Please PLEASE listen to my song",
      Embed: "https://open.spotify.com/embed/track/4Se3fXoHJkcraQzJXo2IYn",
    },
    {
      Id: "3",
      UserId: "KayZee3",
      ParentId: "",
      ChildIds: [],
      LikeIds: [],
      Time: "2025-01-21T19:45:00Z",
      Text: "Hi guys i like to eat onion",
      Embed: "https://open.spotify.com/embed/track/7BaxYnTazocAOK3istsW1z",
    },
  ]);
  return mockResponse;
  */
 const content = await fetch(`${BASE_URL}${path}`);
 return content.text();
}

async function getPosts(): Promise<PackagedPost[]> {
    const response = getContent("/posts/top");
    const posts: PackagedPost[] = JSON.parse(await response);
    console.log(posts);
    return posts;
}

async function getUser(path: string): Promise<User> {
    const response = getContent("/users?" + path);
    const user: User = JSON.parse(await response);
    return user;
}

const FeedPage = () => {
  // State to store fetched posts.
  const [posts, setPosts] = useState<PackagedPost[]>([]);

  // Fetch posts when the component mounts
  useEffect(() => {
    const fetchPosts = async () => {
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
    };
    fetchPosts();
  }, []);

  return (
    <div className="h-screen bg-gray-900 flex">
    {/* Sidebar - Left */}
    <div className="w-60 bg-gray-800 p-6">
      <h2 className="text-white text-xl mb-6">Jitelfy</h2>
      <ul>
        <li className="mb-4">
          <Link to="/feed" className="text-white w-full text-left hover:underline">
            Home
          </Link>
        </li>
        <li className="mb-4">
          <Link to="/explore" className="text-white w-full text-left hover:underline">
            Explore
          </Link>
        </li>
        <li className="mb-4">
          <Link to="/activity" className="text-white w-full text-left hover:underline">
            Activity
          </Link>
        </li>
        <li className="mb-4">
          <Link to="/more" className="text-white w-full text-left hover:underline">
            More
          </Link>
        </li>
        <li className="mb-4">
          <Link to="/profile" className="text-white w-full text-left hover:underline">
            Your Name
          </Link>
        </li>
      </ul>
    </div>

      {/* Feed - Main Content */}
      <div className="flex-1 bg-gray-900 p-6 overflow-auto">
        <h1 className="text-white text-2xl font-bold mb-4">Feed</h1>
        {posts.map((post) => (
          <div key={post.post.id} className="bg-gray-800 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <div>
              <img
                className="size-12 rounded-full mb-2 mr-3"
                src={post.user.icon}
                ></img>
              </div>
              <div>
                <p className="text-white font-bold">{post.user.username}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(post.post.time).toLocaleString()}
                </p>
              </div>
            </div>
            <p className="text-white mb-2">{post.post.text}</p>
            {post.post.embed && (
                <div className="mt-2">
                <img
                src={post.post.embed}
                className="w-full h-40 rounded-md"
                ></img>
                </div>
            )}
            {post.post.song && (
              <div className="mt-4">
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

      {/* Sidebar - Right */}
      <div className="w-80 bg-gray-800 p-6 overflow-auto">
        <h2 className="text-white text-xl mb-4">Friends Listening</h2>
        {["jack", "alexie", "kayzee", "emilie", "booler"].map((friend, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-white">{friend}: Currently listening to...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar - Left */}
      <div className="w-60 bg-gray-800 p-6">
        <div className="flex items-center mb-6">
          <h2 className="text-white text-xl">Jitelfy</h2>
          <span className="ml-2 text-white">🎵</span>
        </div>
        <ul>
          <li className="text-white mb-4 cursor-pointer">
            <Link to="/feed" className="text-white hover:underline">Home</Link>
          </li>
          <li className="text-white mb-4 cursor-pointer">
            <Link to="/explore" className="text-white hover:underline">Explore</Link>
          </li>
          <li className="text-white mb-4 cursor-pointer">
            <Link to="/activity" className="text-white hover:underline">Activity</Link>
          </li>
          <li className="text-white mb-4 cursor-pointer">
            <Link to="/settings" className="text-white hover:underline">Settings</Link>
          </li>
        </ul>
      </div>

      {/* Main Content - Middle */}
      <div className="flex-1 bg-gray-900 p-6 overflow-auto">
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
          <div className="relative w-full">
            <div className="w-full h-48 bg-green-500 flex items-center justify-center">
              <h1 className="text-4xl font-bold text-white">WE'RE COOKED</h1>
            </div>
            <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-gray-600 rounded-full border-4 border-gray-900"></div>
          </div>
          <div className="text-center mt-16">
            <p className="text-2xl text-white font-bold">First Last</p>
            <p className="text-gray-400">@username</p>
          </div>
        </div>
      </div>

      {/* Sidebar - Right */}
      <div className="w-80 bg-gray-800 p-6 overflow-auto">
        <h2 className="text-white text-xl mb-4">Friends Listening</h2>
        {["jack", "alexie", "kayzee", "emilie", "booler"].map((friend, index) => (
          <div key={index} className="bg-gray-700 p-4 rounded-lg mb-4">
            <p className="text-white">{friend}: Currently listening to...</p>
          </div>
        ))}
      </div>
    </div>
  );
};

function App() {
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
