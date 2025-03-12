import { useEffect, useState, useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import * as POST from "../components/Posts";
import { UserContext, IconArray } from "../UserContext";
import * as API from "../api";
import { PackagedPost } from "../types";
import { useSearchParams} from "react-router-dom";

let fetchedPosts: Array<PackagedPost>;

const FeedPage = () => {
  const { user, setUser } = useContext(UserContext);
  // State to store fetched posts.
  const [posts, setPosts] = useState<Array<PackagedPost>>([]);

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

    fetchedPosts.unshift({ ...newPost });
    fetchedPosts.sort(
        (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
    );
    setPosts(fetchedPosts);
    setNewPostSong("");
    (document.getElementById("posttext") as HTMLInputElement).value = "";
  };

  const handleFlairClick = (flair: string) => {
    setSearchParams({ flair });
  };

  useEffect(() => {
    const fetchPostsData = async () => {
      if (user === null) {
        const userjson = await API.RestoreUser();
        if (userjson.id != null) {
          setUser(userjson);
        }
      }
      const fetched = await API.getPosts();
      fetched.sort(
          (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
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
          <div className="sticky">
            <h1 className="text-text-main text-2xl top-0 my-6">Feed</h1>
          </div>
          <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">

            {/* Post header */}
            {!flairFilter && user && (
                <div>
                  <div className="flex flex-col bg-background-secondary p-4 rounded-md mb-8 gap-3">
                    <div className="flex flex-row mb-1">
                      {/* Updated: Use the logged-in user's icon */}
                      {user && (
                          <img
                              className="size-14 rounded-full mr-3"
                              src={IconArray[user.icon]}
                              alt={user.displayname}
                          />
                      )}
                      <div className="flex flex-col w-full items-center justify-end gap-3 fill-white">
                        <textarea id="posttext" rows={3} className="resize-none whitespace-pre-wrap bg-background-main w-full mt-1 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue" placeholder="What's on your mind?">
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
                        <svg width="25px" height="25px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M20.9997 15.0241C21.0014 15.2321 20.9961 15.4612 20.979 15.703C20.913 16.6399 20.6569 17.9858 19.7103 18.9324C19.0746 19.5681 18.223 19.9579 17.3286 19.9968C16.4302 20.0358 15.5573 19.7157 14.9208 19.0792C14.2843 18.4427 13.9641 17.5697 14.0032 16.6714C14.0421 15.777 14.4319 14.9254 15.0676 14.2897C16.0142 13.3431 17.3601 13.0869 18.297 13.021C18.5481 13.0033 18.7856 12.9982 19 13.0005V9.18045L8.99999 10.8471V17L8.99971 17.0241C9.00135 17.2322 8.99605 17.4612 8.97903 17.703C8.91305 18.6399 8.65691 19.9858 7.71027 20.9324C7.07458 21.5681 6.22297 21.9579 5.32858 21.9968C4.43025 22.0358 3.5573 21.7157 2.9208 21.0792C2.28431 20.4427 1.96413 19.5697 2.00319 18.6714C2.04208 17.777 2.43187 16.9254 3.06755 16.2897C4.01419 15.3431 5.36012 15.0869 6.297 15.021C6.54813 15.0033 6.7856 14.9982 6.99999 15.0005V7.54137C6.99999 5.58601 8.41364 3.91725 10.3424 3.5958L17.5068 2.40173C19.3354 2.09696 21 3.50709 21 5.36091V15C21 15.0081 20.9999 15.0161 20.9997 15.0241ZM19 5.36091C19 4.74297 18.4451 4.27293 17.8356 4.37452L10.6712 5.56858C9.70682 5.72931 8.99999 6.56369 8.99999 7.54137V8.81953L19 7.15286V5.36091ZM6.43749 17.016C5.63783 17.0723 4.9048 17.2809 4.48177 17.7039C4.18336 18.0023 4.01746 18.3867 4.0013 18.7583C3.98532 19.1259 4.11526 19.4452 4.33502 19.665C4.55477 19.8847 4.87407 20.0147 5.24171 19.9987C5.61329 19.9825 5.99765 19.8166 6.29606 19.5182C6.71908 19.0952 6.92765 18.3622 6.98397 17.5625C6.99803 17.3629 7.00166 17.1725 6.99935 17.0006C6.82744 16.9983 6.63713 17.002 6.43749 17.016ZM16.4818 15.7039C16.9048 15.2809 17.6378 15.0723 18.4375 15.016C18.6371 15.002 18.8274 14.9983 18.9993 15.0006C19.0017 15.1725 18.998 15.3629 18.984 15.5625C18.9277 16.3622 18.7191 17.0952 18.2961 17.5182C17.9977 17.8166 17.6133 17.9825 17.2417 17.9987C16.8741 18.0147 16.5548 17.8847 16.335 17.665C16.1153 17.4452 15.9853 17.1259 16.0013 16.7583C16.0175 16.3867 16.1834 16.0023 16.4818 15.7039Z"/>
                        </svg>
                        <svg width="25px" height="25px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z"/>
                          <path fillRule="evenodd" clipRule="evenodd" d="M11.0055 2H12.9945C14.3805 1.99999 15.4828 1.99999 16.3716 2.0738C17.2819 2.14939 18.0575 2.30755 18.7658 2.67552C19.8617 3.24477 20.7552 4.1383 21.3245 5.23415C21.6925 5.94253 21.8506 6.71811 21.9262 7.62839C22 8.5172 22 9.61946 22 11.0054V12.9945C22 13.6854 22 14.306 21.9909 14.8646C22.0049 14.9677 22.0028 15.0726 21.9846 15.175C21.9741 15.6124 21.9563 16.0097 21.9262 16.3716C21.8506 17.2819 21.6925 18.0575 21.3245 18.7658C20.7552 19.8617 19.8617 20.7552 18.7658 21.3245C18.0575 21.6925 17.2819 21.8506 16.3716 21.9262C15.4828 22 14.3805 22 12.9946 22H11.0055C9.61955 22 8.5172 22 7.62839 21.9262C6.71811 21.8506 5.94253 21.6925 5.23415 21.3245C4.43876 20.9113 3.74996 20.3273 3.21437 19.6191C3.20423 19.6062 3.19444 19.5932 3.185 19.5799C2.99455 19.3238 2.82401 19.0517 2.67552 18.7658C2.30755 18.0575 2.14939 17.2819 2.0738 16.3716C1.99999 15.4828 1.99999 14.3805 2 12.9945V11.0055C1.99999 9.61949 1.99999 8.51721 2.0738 7.62839C2.14939 6.71811 2.30755 5.94253 2.67552 5.23415C3.24477 4.1383 4.1383 3.24477 5.23415 2.67552C5.94253 2.30755 6.71811 2.14939 7.62839 2.0738C8.51721 1.99999 9.61949 1.99999 11.0055 2ZM20 11.05V12.5118L18.613 11.065C17.8228 10.2407 16.504 10.2442 15.7182 11.0727L11.0512 15.9929L9.51537 14.1359C8.69326 13.1419 7.15907 13.1746 6.38008 14.2028L4.19042 17.0928C4.13682 16.8463 4.09606 16.5568 4.06694 16.2061C4.0008 15.4097 4 14.3905 4 12.95V11.05C4 9.60949 4.0008 8.59025 4.06694 7.79391C4.13208 7.00955 4.25538 6.53142 4.45035 6.1561C4.82985 5.42553 5.42553 4.82985 6.1561 4.45035C6.53142 4.25538 7.00955 4.13208 7.79391 4.06694C8.59025 4.0008 9.60949 4 11.05 4H12.95C14.3905 4 15.4097 4.0008 16.2061 4.06694C16.9905 4.13208 17.4686 4.25538 17.8439 4.45035C18.5745 4.82985 19.1702 5.42553 19.5497 6.1561C19.7446 6.53142 19.8679 7.00955 19.9331 7.79391C19.9992 8.59025 20 9.60949 20 11.05ZM6.1561 19.5497C5.84198 19.3865 5.55279 19.1833 5.295 18.9467L7.97419 15.4106L9.51005 17.2676C10.2749 18.1924 11.6764 18.24 12.5023 17.3693L17.1693 12.449L19.9782 15.3792C19.9683 15.6812 19.9539 15.9547 19.9331 16.2061C19.8679 16.9905 19.7446 17.4686 19.5497 17.8439C19.1702 18.5745 18.5745 19.1702 17.8439 19.5497C17.4686 19.7446 16.9905 19.8679 16.2061 19.9331C15.4097 19.9992 14.3905 20 12.95 20H11.05C9.60949 20 8.59025 19.9992 7.79391 19.9331C7.00955 19.8679 6.53142 19.7446 6.1561 19.5497Z"/>
                        </svg>
                        <svg width="25px" height="25px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                          <g stroke="none" strokeWidth="1" fillRule="evenodd">
                            <g id="ic_fluent_poll_24_regular" fillRule="nonzero">
                              <path d="M11.7518706,1.99956021 C13.2716867,1.99956021 14.5037411,3.23161462 14.5037411,4.75143076 L14.5037411,19.2499651 C14.5037411,20.7697812 13.2716867,22.0018356 11.7518706,22.0018356 C10.2320544,22.0018356 9,20.7697812 9,19.2499651 L9,4.75143076 C9,3.23161462 10.2320544,1.99956021 11.7518706,1.99956021 Z M18.7518706,6.99956021 C20.2716867,6.99956021 21.5037411,8.23161462 21.5037411,9.75143076 L21.5037411,19.2499651 C21.5037411,20.7697812 20.2716867,22.0018356 18.7518706,22.0018356 C17.2320544,22.0018356 16,20.7697812 16,19.2499651 L16,9.75143076 C16,8.23161462 17.2320544,6.99956021 18.7518706,6.99956021 Z M4.75187055,11.9995602 C6.27168669,11.9995602 7.5037411,13.2316146 7.5037411,14.7514308 L7.5037411,19.2499651 C7.5037411,20.7697812 6.27168669,22.0018356 4.75187055,22.0018356 C3.23205441,22.0018356 2,20.7697812 2,19.2499651 L2,14.7514308 C2,13.2316146 3.23205441,11.9995602 4.75187055,11.9995602 Z M11.7518706,3.49956021 C11.0604815,3.49956021 10.5,4.06004175 10.5,4.75143076 L10.5,19.2499651 C10.5,19.9413541 11.0604815,20.5018356 11.7518706,20.5018356 C12.4432596,20.5018356 13.0037411,19.9413541 13.0037411,19.2499651 L13.0037411,4.75143076 C13.0037411,4.06004175 12.4432596,3.49956021 11.7518706,3.49956021 Z M18.7518706,8.49956021 C18.0604815,8.49956021 17.5,9.06004175 17.5,9.75143076 L17.5,19.2499651 C17.5,19.9413541 18.0604815,20.5018356 18.7518706,20.5018356 C19.4432596,20.5018356 20.0037411,19.9413541 20.0037411,19.2499651 L20.0037411,9.75143076 C20.0037411,9.06004175 19.4432596,8.49956021 18.7518706,8.49956021 Z M4.75187055,13.4995602 C4.06048154,13.4995602 3.5,14.0600417 3.5,14.7514308 L3.5,19.2499651 C3.5,19.9413541 4.06048154,20.5018356 4.75187055,20.5018356 C5.44325957,20.5018356 6.0037411,19.9413541 6.0037411,19.2499651 L6.0037411,14.7514308 C6.0037411,14.0600417 5.44325957,13.4995602 4.75187055,13.4995602 Z">
                              </path>
                            </g>
                          </g>
                        </svg>
                      </div>

                      <button onClick={handleSubmitPost}>
                        <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                          Post
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {flairFilter && (
                <div className="mx-10 my-4">
                  <p className="text-white">
                    Filtering posts by hashtag: <strong>#{flairFilter}</strong>
                  </p>
                  <button
                      className="mt-2 px-4 py-1 bg-accent-blue-light rounded"
                      onClick={() => setSearchParams({})}
                  >
                    Clear Filter
                  </button>
                </div>
            )}

            {posts.map((post) => (
                POST.ParentPost(post.post, post.user, user, posts, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments)
            ))}
          </div>
        </div>

        {/* Sidebar - Right */}
        {FriendActivity(user)}
      </div>
  );
};

export default FeedPage;
