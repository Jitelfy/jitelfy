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

const BASE_URL = "http://localhost:8080";


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

  const handleDeletePost = async (id: string) => {
      // Send the DELETE request
      await fetch(`${BASE_URL}/posts/?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
      });

      // Refresh posts and clear the form fields
      const fetchedPosts = await getPosts();
      setPosts(fetchedPosts);
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
          <div className="sticky">
            <h1 className="text-white text-2xl top-0 my-6 mx-10">Feed</h1>
          </div>
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
                  {/* X symbol to delete posts (temp) */}
                  <svg className="self-start ml-auto" width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z" fill="#7e7e7e"/>
                  </svg>
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
                <div className="flex flex-row align-baseline mt-5 justify-between">
                    <div className="flex flex-row gap-20 ml-4">
                        {/* Comment */}
                        <div className="text-text-secondary fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-2 items-center">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C10.5937 3 9.2995 3.05598 8.14453 3.14113C6.41589 3.26859 5.80434 3.32966 5.0751 3.73C4.42984 4.08423 3.66741 4.90494 3.36159 5.5745C3.01922 6.32408 3.00002 7.07231 3.00002 9.13826V10.8156C3.00002 11.9615 3.00437 12.3963 3.06904 12.7399C3.37386 14.3594 4.64066 15.6262 6.26012 15.931C6.60374 15.9957 7.03847 16 8.18442 16C8.1948 16 8.20546 16 8.21637 16C8.33199 15.9998 8.47571 15.9996 8.61593 16.019C9.21331 16.1021 9.74133 16.4502 10.053 16.9666C10.1261 17.0878 10.1825 17.22 10.2279 17.3264C10.2322 17.3364 10.2364 17.3462 10.2404 17.3557L10.6994 18.4267C11.0609 19.2701 11.3055 19.8382 11.518 20.2317C11.6905 20.5511 11.7828 20.6364 11.794 20.6477C11.9249 20.7069 12.0751 20.7069 12.2061 20.6477C12.2172 20.6364 12.3095 20.5511 12.482 20.2317C12.6946 19.8382 12.9392 19.2701 13.3006 18.4267L13.7596 17.3557C13.7637 17.3462 13.7679 17.3364 13.7721 17.3264C13.8175 17.22 13.8739 17.0878 13.9471 16.9666C14.2587 16.4502 14.7867 16.1021 15.3841 16.019C15.5243 15.9996 15.668 15.9998 15.7837 16C15.7946 16 15.8052 16 15.8156 16C16.9616 16 17.3963 15.9957 17.7399 15.931C19.3594 15.6262 20.6262 14.3594 20.931 12.7399C20.9957 12.3963 21 11.9615 21 10.8156V9.13826C21 7.07231 20.9808 6.32408 20.6384 5.5745C20.3326 4.90494 19.5702 4.08423 18.9249 3.73C18.1957 3.32966 17.5841 3.26859 15.8555 3.14113C14.7005 3.05598 13.4064 3 12 3ZM7.99746 1.14655C9.19742 1.05807 10.5408 1 12 1C13.4593 1 14.8026 1.05807 16.0026 1.14655C16.0472 1.14984 16.0913 1.15308 16.1351 1.1563C17.6971 1.27104 18.7416 1.34777 19.8874 1.97681C20.9101 2.53823 21.973 3.68239 22.4577 4.74356C23.001 5.93322 23.0007 7.13737 23.0001 8.95396C23 9.0147 23 9.07613 23 9.13826V10.8156C23 10.8555 23 10.8949 23 10.9337C23.0002 11.921 23.0003 12.5583 22.8965 13.1098C22.4392 15.539 20.5391 17.4392 18.1099 17.8965C17.5583 18.0003 16.9211 18.0002 15.9337 18C15.8949 18 15.8555 18 15.8156 18C15.7355 18 15.6941 18.0001 15.6638 18.0009C15.6625 18.0009 15.6612 18.0009 15.66 18.001C15.6596 18.002 15.659 18.0032 15.6585 18.0044C15.6458 18.0319 15.6294 18.07 15.5979 18.1436L15.1192 19.2604C14.7825 20.0462 14.5027 20.6992 14.2417 21.1823C13.9898 21.6486 13.6509 22.1678 13.098 22.4381C12.4052 22.7768 11.5948 22.7768 10.902 22.4381C10.3491 22.1678 10.0103 21.6486 9.75836 21.1823C9.49738 20.6992 9.21753 20.0462 8.88079 19.2604L8.40215 18.1436C8.3706 18.07 8.35421 18.0319 8.34157 18.0044C8.34101 18.0032 8.34048 18.002 8.33998 18.001C8.33881 18.0009 8.33755 18.0009 8.33621 18.0009C8.30594 18.0001 8.26451 18 8.18442 18C8.14451 18 8.10515 18 8.06633 18C7.07897 18.0002 6.44169 18.0003 5.89017 17.8965C3.46098 17.4392 1.56079 15.539 1.10356 13.1098C0.999748 12.5583 0.999849 11.921 1.00001 10.9337C1.00001 10.8949 1.00002 10.8555 1.00002 10.8156V9.13826C1.00002 9.07613 0.999998 9.0147 0.999978 8.95396C0.999383 7.13737 0.998989 5.93322 1.54238 4.74356C2.02707 3.68239 3.08998 2.53823 4.11264 1.97681C5.25848 1.34777 6.30294 1.27104 7.86493 1.1563C7.9087 1.15308 7.95287 1.14984 7.99746 1.14655Z"/>
                            </svg>
                            <p className="text-sm">0</p>
                        </div>

                        {/* Repost */}
                        <div className="text-text-secondary fill-text-secondary duration-75 ease-in hover:text-accent-green hover:fill-accent-green flex flex-row gap-2 items-center">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M16.2929 3.29289C16.6834 2.90237 17.3166 2.90237 17.7071 3.29289L20.7071 6.29289C21.0976 6.68342 21.0976 7.31658 20.7071 7.70711L17.7071 10.7071C17.3166 11.0976 16.6834 11.0976 16.2929 10.7071C15.9024 10.3166 15.9024 9.68342 16.2929 9.29289L17.5857 8.00006H7.85181C5.70703 8.00006 4 9.75511 4 12C4 12.5523 3.55228 13 3 13C2.44772 13 2 12.5523 2 12C2 8.72205 4.53229 6.00006 7.85181 6.00006H17.5858L16.2929 4.70711C15.9024 4.31658 15.9024 3.68342 16.2929 3.29289ZM21 11C21.5523 11 22 11.4477 22 12C22 15.3283 19.2275 18.0001 15.9578 18.0001H6.41427L7.70711 19.2929C8.09763 19.6834 8.09763 20.3166 7.70711 20.7071C7.31658 21.0976 6.68342 21.0976 6.29289 20.7071L3.29289 17.7071C2.90237 17.3166 2.90237 16.6834 3.29289 16.2929L6.29289 13.2929C6.68342 12.9024 7.31658 12.9024 7.70711 13.2929C8.09763 13.6834 8.09763 14.3166 7.70711 14.7071L6.41415 16.0001H15.9578C18.1524 16.0001 20 14.1945 20 12C20 11.4477 20.4477 11 21 11Z"/>
                            </svg>
                            <p className="text-sm">0</p>
                        </div>

                        {/* Like */}
                        <div className="text-text-secondary fill-text-secondary duration-75 ease-in hover:text-accent-red hover:fill-accent-red flex flex-row gap-2 items-center">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M7.78125 4C4.53699 4 2 6.81981 2 10.1559C2 11.8911 2.27768 13.32 3.31283 14.8234C4.3005 16.258 5.9429 17.7056 8.49134 19.6155L12 22L15.5084 19.6158C18.057 17.7058 19.6995 16.258 20.6872 14.8234C21.7223 13.32 22 11.8911 22 10.1559C22 6.81982 19.463 4 16.2188 4C14.5909 4 13.1818 4.66321 12 5.86323C10.8182 4.66321 9.40906 4 7.78125 4ZM7.78125 6C5.77551 6 4 7.7855 4 10.1559C4 10.7049 4.03107 11.1875 4.10853 11.6325C4.23826 12.378 4.49814 13.0182 4.96014 13.6893C5.74532 14.8297 7.14861 16.11 9.69156 18.0157L12 19.7494L14.3084 18.0157C16.8514 16.11 18.2547 14.8297 19.0399 13.6893C19.7777 12.6176 20 11.6245 20 10.1559C20 7.7855 18.2245 6 16.2188 6C14.9831 6 13.8501 6.58627 12.8033 7.99831C12.6147 8.25274 12.3167 8.40277 12 8.40277C11.6833 8.40277 11.3853 8.25274 11.1967 7.99831C10.1499 6.58627 9.01689 6 7.78125 6Z"/>
                            </svg>
                            <p className="text-sm">0</p>
                        </div>
                    </div>

                    <div className="flex flex-row gap-3 mr-4">
                        {/* Bookmark */}
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.78799 3H14.212C15.0305 2.99999 15.7061 2.99998 16.2561 3.04565C16.8274 3.0931 17.3523 3.19496 17.8439 3.45035C18.5745 3.82985 19.1702 4.42553 19.5497 5.1561C19.805 5.64774 19.9069 6.17258 19.9544 6.74393C20 7.29393 20 7.96946 20 8.78798V17.6227C20 18.5855 20 19.3755 19.9473 19.9759C19.8975 20.5418 19.7878 21.2088 19.348 21.6916C18.8075 22.2847 18.0153 22.5824 17.218 22.4919C16.5691 22.4182 16.0473 21.9884 15.6372 21.5953C15.2022 21.1783 14.6819 20.5837 14.0479 19.8591L13.6707 19.428C13.2362 18.9314 12.9521 18.6081 12.7167 18.3821C12.4887 18.1631 12.3806 18.1107 12.3262 18.0919C12.1148 18.019 11.8852 18.019 11.6738 18.0919C11.6194 18.1107 11.5113 18.1631 11.2833 18.3821C11.0479 18.6081 10.7638 18.9314 10.3293 19.428L9.95209 19.8591C9.31809 20.5837 8.79784 21.1782 8.36276 21.5953C7.95272 21.9884 7.43089 22.4182 6.78196 22.4919C5.9847 22.5824 5.19246 22.2847 4.65205 21.6916C4.21218 21.2088 4.10248 20.5418 4.05275 19.9759C3.99997 19.3755 3.99998 18.5855 4 17.6227V8.78799C3.99999 7.96947 3.99998 7.29393 4.04565 6.74393C4.0931 6.17258 4.19496 5.64774 4.45035 5.1561C4.82985 4.42553 5.42553 3.82985 6.1561 3.45035C6.64774 3.19496 7.17258 3.0931 7.74393 3.04565C8.29393 2.99998 8.96947 2.99999 9.78799 3ZM7.90945 5.03879C7.46401 5.07578 7.23663 5.1428 7.07805 5.22517C6.71277 5.41493 6.41493 5.71277 6.22517 6.07805C6.1428 6.23663 6.07578 6.46401 6.03879 6.90945C6.0008 7.36686 6 7.95898 6 8.83V17.5726C6 18.5978 6.00094 19.2988 6.04506 19.8008C6.08138 20.2139 6.13928 20.3436 6.14447 20.3594C6.2472 20.4633 6.39033 20.5171 6.53606 20.5065C6.55034 20.4981 6.67936 20.4386 6.97871 20.1516C7.34245 19.8029 7.80478 19.2759 8.4799 18.5044L8.85192 18.0792C9.25094 17.6232 9.59229 17.233 9.89819 16.9393C10.2186 16.6317 10.5732 16.3559 11.0214 16.2013C11.6555 15.9825 12.3445 15.9825 12.9786 16.2013C13.4268 16.3559 13.7814 16.6317 14.1018 16.9393C14.4077 17.233 14.7491 17.6232 15.1481 18.0792L15.5201 18.5044C16.1952 19.2759 16.6576 19.8029 17.0213 20.1516C17.3206 20.4386 17.4497 20.4981 17.4639 20.5065C17.6097 20.5171 17.7528 20.4633 17.8555 20.3594C17.8607 20.3436 17.9186 20.2139 17.9549 19.8008C17.9991 19.2988 18 18.5978 18 17.5726V8.83C18 7.95898 17.9992 7.36686 17.9612 6.90945C17.9242 6.46401 17.8572 6.23663 17.7748 6.07805C17.5851 5.71277 17.2872 5.41493 16.9219 5.22517C16.7634 5.1428 16.536 5.07578 16.0905 5.03879C15.6331 5.0008 15.041 5 14.17 5H9.83C8.95898 5 8.36686 5.0008 7.90945 5.03879Z"/>
                            </svg>
                        </div>

                        {/* Share */}
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M1 18.5088C1 13.1679 4.90169 8.77098 9.99995 7.84598V5.51119C9.99995 3.63887 12.1534 2.58563 13.6313 3.73514L21.9742 10.224C23.1323 11.1248 23.1324 12.8752 21.9742 13.7761L13.6314 20.2649C12.1534 21.4144 10 20.3612 10 18.4888V16.5189C7.74106 16.9525 5.9625 18.1157 4.92778 19.6838C4.33222 20.5863 3.30568 20.7735 2.55965 20.5635C1.80473 20.3511 1.00011 19.6306 1 18.5088ZM12.4034 5.31385C12.2392 5.18613 11.9999 5.30315 11.9999 5.51119V9.41672C11.9999 9.55479 11.8873 9.66637 11.7493 9.67008C8.09094 9.76836 4.97774 12.0115 3.66558 15.1656C3.46812 15.6402 3.31145 16.1354 3.19984 16.6471C3.07554 17.217 3.00713 17.8072 3.00053 18.412C3.00018 18.4442 3 18.4765 3 18.5088C3.00001 18.6437 3.18418 18.6948 3.25846 18.5822C3.27467 18.5577 3.29101 18.5332 3.30747 18.5088C3.30748 18.5088 3.30746 18.5088 3.30747 18.5088C3.63446 18.0244 4.01059 17.5765 4.42994 17.168C4.71487 16.8905 5.01975 16.6313 5.34276 16.3912C7.05882 15.1158 9.28642 14.3823 11.7496 14.3357C11.8877 14.3331 12 14.4453 12 14.5834V18.4888C12 18.6969 12.2393 18.8139 12.4035 18.6862L20.7463 12.1973C20.875 12.0973 20.875 11.9028 20.7463 11.8027L12.4034 5.31385Z"/>
                            </svg>
                        </div>
                    </div>
                </div>
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
