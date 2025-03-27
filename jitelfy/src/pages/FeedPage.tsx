import { useEffect, useState, useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import * as POST from "../components/Posts";
import { UserContext, IconArray } from "../UserContext";
import * as API from "../api";
import { PackagedPost } from "../types";
import {Link, useSearchParams} from "react-router-dom";

let fetchedPosts: Array<PackagedPost>;

const FeedPage = () => {
  const { user, setUser } = useContext(UserContext);
  // State to store fetched posts.
  let [posts, setPosts] = useState<Array<PackagedPost>>([]);

  // State variables for new post text and song that goes in the feed
  const [newPostSong, setNewPostSong] = useState("");

  // Setup search parameters for filtering
  const [searchParams, setSearchParams] = useSearchParams();
  const flairFilter = searchParams.get("flair") || "";

  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  const renderTextWithHashtags = (text: string) => {
    return text.split(" ").map((word, index) => {
      if (word.startsWith("#") && word.length > 1) {
        const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
        return (
            <span
                key={index}
                className="cursor-pointer text-accent-blue hover:underline"
                onClick={() => handleFlairClick(cleanWord.replace(/^#/, ""))}
            >
            {word}{" "}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // ensure user exists

    const textValue = (document.getElementById('posttext') as HTMLInputElement).value;

    if (!textValue) return;
    if (!newPostSong) return;

    // Find the first hashtag in the text and extract it as flair
    const match = textValue.match(/#[A-Za-z0-9_]+/);
    let flair = "";
    if (match) {
      flair = match[0].substring(1); // remove the '#' character
    }

    const postData = {
      userid: user.id, // use the logged-in user's ID
      text: textValue,
      song: newPostSong,
      flair: flair, //flair in the post data
    };

    // Include the token in the Authorization header
    const newPostPost = await fetch(`${API.BASE_URL}/posts/top`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token  // adding the token here
      },
      body: JSON.stringify(postData),
      credentials: "include",
    });

    const newPost: PackagedPost = {
      post: JSON.parse(await newPostPost.text()),
      user: user,
    };

    posts.unshift({ ...newPost });
    posts.sort(
        (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
    );
    setPosts(posts.filter((post: PackagedPost) => post.post.childids !== -1)
    );

    setNewPostSong("");

    (document.getElementById("posttext") as HTMLInputElement).value = "";

    const charCount = document.getElementById("charCountPost");
    if (!charCount) return;

    charCount.innerText = "0/280";
  };

  const handleFlairClick = (flair: string) => {
    setSearchParams({ flair });
  };

  function charCounterPost(inputField: HTMLElement | null) {
    if (!inputField) return;

    const currentText = (document.getElementById('posttext') as HTMLInputElement).value;

    let currentLength;
    if (!currentText) currentLength = 0;
    currentLength = currentText.length;

    const charCount = document.getElementById("charCountPost");
    if (!charCount) return;

    charCount.innerText = currentLength + "/280";
  }

  useEffect(() => {
    const fetchPostsData = async () => {
      if (user === null) {
        const userjson = await API.RestoreUser();
        if (userjson.id != null) {
          setUser(userjson);
        }
      }
      if (!user) return;

      /* Only show feed to logged-in users */
      const fetched: PackagedPost[] = await API.getFeed();
      console.log(fetched);
      fetched.sort(
          (a: PackagedPost, b: PackagedPost) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
      );
      fetchedPosts = fetched;
      const filtered = flairFilter
          ? fetchedPosts.filter(p => p.post.text.includes(`#${flairFilter}`))
          : fetchedPosts;
      setPosts(filtered);
    };
    fetchPostsData();

  }, [user, flairFilter]);

  return (
      <div className="h-screen bg-background-main flex">
        {/* Sidebar - Left */}
        {Quicklinks(user)}

        {/* Feed - Main Content */}
        <div className="flex-1 flex-col px-20 relative overflow-y-auto hide-scrollbar">
          <div className="fixed z-20 bg-background-main opacity-95 w-full">
            <h1 className="text-text-main text-2xl top-0 my-6">Feed</h1>
          </div>

          <div className="flex-1 bg-background-main relative mt-20 overflow-auto hide-scrollbar">
            {/* Post header */}
            {!flairFilter && user && (
                <div>
                  <div className="flex flex-col bg-background-secondary p-4 rounded-md mb-8 gap-3">
                    <div className="flex flex-row mb-1">
                      {/* Updated: Use the logged-in user's icon */}
                      {user && (
                          <Link to={"/profile/" + user.username}>
                            <img
                                className="size-16 rounded-full mr-5"
                                src={IconArray[user.icon]}
                                alt={user.displayname}
                            />
                          </Link>
                      )}
                      <div className="flex flex-col w-full items-center justify-end gap-3 fill-white">
                        <textarea
                            id="posttext"
                            rows={3}
                            className="resize-none whitespace-pre-wrap bg-background-main w-full mt-1 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                            placeholder="What's on your mind?"
                            maxLength={280}
                            onChange={() => charCounterPost(document.getElementById("posttext"))}
                        >
                        </textarea>
                        <input
                            type="url"
                            value={newPostSong}
                            onChange={(e) => setNewPostSong(e.target.value)}
                            placeholder="Enter a song link..."
                            className="bg-background-main text-text-main w-full rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                        />
                      </div>
                    </div>

                    <hr className="border-1 border-background-tertiary"></hr>

                    <div className="flex flex-row items-center justify-between ml-6">
                      <div className="fill-white flex flex-row gap-5">
                      </div>

                      <div className="flex flex-row gap-3 items-center">
                        <p id="charCountPost" className="text-text-secondary text-sm text-center">0/280</p>
                        <button className="bg-accent-blue px-6 py-2 rounded-xl hover:bg-accent-blue-light transition-colors ease-in duration-75"
                            onClick={handleSubmitPost}>
                          <p className="text-text-main">
                            Post
                          </p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
            )}

            {flairFilter && (
                <div className="flex flex-row justify-between items-center px-8 py-3 my-4 border-y border-background-secondary">
                  <p className="text-white">
                    Filtering posts by hashtag: <strong>#{flairFilter}</strong>
                  </p>
                  <button
                      className="mt-2 px-4 py-1 bg-accent-blue text-text-main rounded-md hover:bg-accent-blue-light transition-colors ease-in duration-75 cursor-pointer"
                      onClick={() => setSearchParams({})}
                  >
                    <p>Clear Filter</p>
                  </button>
                </div>
            )}

            {
              POST.mapPosts(posts, user, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments,  () => true)
            }
          </div>
        </div>

        {/* Sidebar - Right */}
        {FriendActivity(user)}
      </div>
  );
};

export default FeedPage;
