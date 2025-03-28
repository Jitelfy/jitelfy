import { useContext, useEffect, useState } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import {useParams, useSearchParams} from "react-router-dom";
import { getUser, RestoreUser, followUser, unfollowUser } from "../api"
import {PackagedPost, User} from "../types";
import * as API from "../api";
import * as POST from "../components/Posts"


const ProfilePage = () => {
    const { user, setUser } = useContext(UserContext);
    const [userData, setUserData] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);

    const [posts, setPosts] = useState<Array<PackagedPost>>([]);
    const [openComments, setOpenComments] = useState<Set<string>>(new Set());

    const [searchParams, setSearchParams] = useSearchParams();
    const flairFilter = searchParams.get("flair") || "";

    const [followers, setFollowers] = useState<Array<User>>([]);
    const [following, setFollowing] = useState<Array<User>>([]);

    const [showPosts, setShowPosts] = useState<Boolean>(true);
    const [showComments, setShowComments] = useState<Boolean>(false);

    const [stats, setStats] = useState<Boolean>(false);
    const [totalLikes, setTotalLikes] = useState<number>(0);
    const [totalUserposts, setTotalUserposts] = useState<number>(0);
    const [totalReposts, setTotalReposts] = useState<number>(0);
    const [highestLikeCount, setHighestLikeCount] = useState<number>(0);
    const [totalComment, setTotalComment] = useState<number>(0);
    const [totalBookmarks, setTotalBookmarks] = useState<number>(0)

    const { username } = useParams(); // Grab the dynamic username from the URL
    
    const handleToggleFollow = async () => {
        if (!userData) return;
        if (!isFollowing) {
          await followUser(userData.id);
          // Refresh user data immediately after following
          const updatedUser = await RestoreUser();
          setUser(updatedUser);
          setUserData(prev => user && prev ? { ...prev, followers: [...prev.followers, user.id] } : prev);
          setIsFollowing(true);

        } else {
          await unfollowUser(userData.id);
          // Refresh user data immediately after unfollowing
          const updatedUser = await RestoreUser();
          setUser(updatedUser);
          setUserData(prev => user && prev ? { ...prev, followers: prev.followers.filter(id => id !== user.id) } : prev);
          setIsFollowing(false);
        }
      };

    const handleMouseOver = ()=> {
        let el = document.getElementById("followedText");
        if (el != null) {
            if (el.textContent == "Following") {
                el.textContent = "Unfollow";
            } else {
                el.textContent = "Following";
            }
        }
    };

    const toggleShowPosts = () => {
        if (!showPosts) {
            setShowPosts(true);
            setShowComments(false);
        }
    };

    const toggleShowComments = ()=> {
        if (!showComments) {
            setShowPosts(false);
            setShowComments(true);
        }
    };

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

    const handleFlairClick = (flair: string) => {
        setSearchParams({ flair });
    };
    
    useEffect(() => {
        const restore = async () => {
            const loggedInUser: User = await RestoreUser();
            if (loggedInUser.id != null) {
                setUser(loggedInUser);
            }
        };

        const fetchUser = async () => {
            if (username != null) {
                // Fetching user data
                const profileUser = await getUser(username);
                setUserData(profileUser);
                if (profileUser && user) {
                    setIsFollowing(profileUser.followers && profileUser.followers.indexOf(user.id) !== -1);

                    // Get this user's posts
                    const fetched = await API.getPostsByUser(profileUser.id);
                    fetched.sort(
                        (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
                    );
                    const filtered = flairFilter
                        ? fetched.filter(p => p.post.text.includes(`#${flairFilter}`))
                        : fetched;
                    setPosts(filtered);

                    const userInfo = fetched.filter(p => p.post.userid === userData?.id)
                    // all posts have a parent id of "000000000000000000000000" 
                    const userPosts = userInfo.filter(p => p.post.parentid === "000000000000000000000000")
                    const userComments = userInfo.filter(p => p.post.parentid !== "000000000000000000000000")
                    
                    const likes = userInfo.reduce((sum, post) => sum + post.post.likeIds.length, 0);
                    const highestLike = Math.max(...userInfo.map(p => p.post.likeIds.length), 0);
                    const totalPosts = userPosts.length;
                    const totalComments = userComments.length
                    const reposts = user.reposts.length;
                    const bookmarks = user.bookmarks.length;

                    setTotalLikes(likes);
                    setHighestLikeCount(highestLike);
                    setTotalUserposts(totalPosts);
                    setTotalComment(totalComments);
                    setTotalReposts(reposts);
                    setTotalBookmarks(bookmarks)
                    // TODO: Get this user's followers & following
                }
            }
        };

        if (user == null) {
            // Keep user logged in
            restore();
        }
        fetchUser();

    }, [user, username, flairFilter, userData]); // Run when username changes

    if (user == null || userData == null) {
        return (
            <div className="h-screen bg-background-main flex">
                {/* Sidebar - Left */}
                {Quicklinks(user!)}
                <div className="flex-1 bg-background-main p-6 overflow-auto">
                    <div className="relative w-full">
                    </div>
                </div>
                {/* Sidebar - Right */}
                {FriendActivity(user)}
            </div>
        );
    }

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col bg-background-main px-10 p-6 overflow-auto hide-scrollbar">

                {/* User display at top thingy (with back button) */}
                <div className="fixed fill-text-main bg-background-main z-10 p-4 transform -translate-x-16 -translate-y-6 w-full opacity-95 flex flex-row items-center">
                    <button className="p-3 border-2 border-background-main hover:bg-background-secondary hover:border-background-secondary transition-colors ease-in duration-75 rounded-full mr-4 ml-6"
                            onClick={() => history.back()}>
                        <svg width="22px" height="22px" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M15.7071 5.29289C16.0976 5.68342 16.0976 6.31658 15.7071 6.70711L10.4142 12L15.7071 17.2929C16.0976 17.6834 16.0976 18.3166 15.7071 18.7071C15.3165 19.0976 14.6834 19.0976 14.2929 18.7071L8.46963 12.8839C7.98148 12.3957 7.98148 11.6043 8.46963 11.1161L14.2929 5.29289C14.6834 4.90237 15.3165 4.90237 15.7071 5.29289Z"/>
                        </svg>
                    </button>

                    {/* Username and number of posts */}
                    <div className="flex flex-col">
                        <h2 className="text-text-main text-2xl">
                            {userData.displayname || userData.username}
                        </h2>
                            {posts && (
                                <p className="text-text-main text-sm ml-2">
                                    {posts.length}
                                    {posts.length == 1 && " post" || " posts"}
                                </p>
                            )}
                    </div>


                </div>

                {/* Container for all user data */}
                <div className="flex flex-col items-center bg-background-secondary p-4 mt-12 rounded-t-md">
                    {/* Banner */}
                    <div className="w-full h-44 rounded-md flex items-center justify-center"
                        id="banner"
                        style={{backgroundColor: BannerArray[userData.banner]}}>
                    </div>

                    {/* Icon, display & username, profile song */}
                    <div className="flex flex-row w-full self-start justify-start items-center">
                        <img src={IconArray[userData.icon]}
                             alt="profile picture"
                             className="transform -translate-y-8 translate-x-6 w-32 h-32 bg-background-tertiary rounded-full border-4 border-background-secondary"></img>

                        {/* Display name & username */}
                        <div className="flex-col ml-10 mt-4 self-start max-w-64 truncate">
                            <h2 className="text-xl text-text-main">{userData.displayname || userData.username || 'user cannot be loaded'}</h2>
                            <p className="text-md text-text-secondary">@{userData.username || 'username'}</p>
                        </div>

                        <div className="ml-auto flex flex-row items-center w-full max-w-64 min-w-64">
                            {userData.song && (
                                <iframe
                                    src={userData.song}
                                    className="w-full h-20"
                                    title="Profile song"
                                ></iframe>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="flex flex-row self-start w-full text-wrap">
                        <p className="text-text-main self-start ml-10 mr-10 mb-5 break-all text-wrap">
                            {userData.bio || "This user has no bio."}
                        </p>
                    </div>

                    <div className="flex flex-row w-full my-5 justify-center gap-5 pl-10">
                        {/* Followers & following */}
                        <div className="flex flex-row gap-44 ">
                            <p className="text-text-main content-center">
                                <b>{userData.followers?.length || 0}</b> Followers
                            </p>
                            <p className="text-text-main content-center">
                                <b>{userData.following?.length || 0}</b> Following
                            </p>
                        </div>

                        {/* Follow/following button */}
                        {userData.username !== user.username && !isFollowing && (
                            <button
                                onClick={handleToggleFollow}
                                className="px-4 w-1/4 py-2 ml-auto border border-accent-blue bg-accent-blue text-white rounded-full hover:bg-accent-blue-light">
                                <p>Follow</p>
                            </button>
                        )}
                        {userData.username !== user.username && isFollowing && (
                            <button
                                onClick={handleToggleFollow}
                                className="px-4 w-1/4 py-2 ml-auto bg-transparent text-white border border-white rounded-full hover:bg-background-tertiary"
                                onMouseEnter={handleMouseOver}
                                onMouseLeave={handleMouseOver}>
                                <p id="followedText">Following</p>
                            </button>
                        )}
                    </div>

                    <hr className="border-1 w-full self-start border-background-tertiary"></hr>

                    {/* SVG for showing profile stats */}
                    <div title="Stats"
                        className="self-end fill-text-main hover:fill-accent-blue transition-colors ease-in duration-75">

                        { !stats ? <svg
                                className="self-end mt-5 cursor-pointer"
                                onClick={() => setStats(!stats)}
                                width="25px" height="25px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                <g stroke="none" strokeWidth="1" fillRule="evenodd">
                                    <g id="ic_fluent_poll_24_regular" fillRule="nonzero">
                                        <path d="M11.7518706,1.99956021 C13.2716867,1.99956021 14.5037411,3.23161462 14.5037411,4.75143076 L14.5037411,19.2499651 C14.5037411,20.7697812 13.2716867,22.0018356 11.7518706,22.0018356 C10.2320544,22.0018356 9,20.7697812 9,19.2499651 L9,4.75143076 C9,3.23161462 10.2320544,1.99956021 11.7518706,1.99956021 Z M18.7518706,6.99956021 C20.2716867,6.99956021 21.5037411,8.23161462 21.5037411,9.75143076 L21.5037411,19.2499651 C21.5037411,20.7697812 20.2716867,22.0018356 18.7518706,22.0018356 C17.2320544,22.0018356 16,20.7697812 16,19.2499651 L16,9.75143076 C16,8.23161462 17.2320544,6.99956021 18.7518706,6.99956021 Z M4.75187055,11.9995602 C6.27168669,11.9995602 7.5037411,13.2316146 7.5037411,14.7514308 L7.5037411,19.2499651 C7.5037411,20.7697812 6.27168669,22.0018356 4.75187055,22.0018356 C3.23205441,22.0018356 2,20.7697812 2,19.2499651 L2,14.7514308 C2,13.2316146 3.23205441,11.9995602 4.75187055,11.9995602 Z M11.7518706,3.49956021 C11.0604815,3.49956021 10.5,4.06004175 10.5,4.75143076 L10.5,19.2499651 C10.5,19.9413541 11.0604815,20.5018356 11.7518706,20.5018356 C12.4432596,20.5018356 13.0037411,19.9413541 13.0037411,19.2499651 L13.0037411,4.75143076 C13.0037411,4.06004175 12.4432596,3.49956021 11.7518706,3.49956021 Z M18.7518706,8.49956021 C18.0604815,8.49956021 17.5,9.06004175 17.5,9.75143076 L17.5,19.2499651 C17.5,19.9413541 18.0604815,20.5018356 18.7518706,20.5018356 C19.4432596,20.5018356 20.0037411,19.9413541 20.0037411,19.2499651 L20.0037411,9.75143076 C20.0037411,9.06004175 19.4432596,8.49956021 18.7518706,8.49956021 Z M4.75187055,13.4995602 C4.06048154,13.4995602 3.5,14.0600417 3.5,14.7514308 L3.5,19.2499651 C3.5,19.9413541 4.06048154,20.5018356 4.75187055,20.5018356 C5.44325957,20.5018356 6.0037411,19.9413541 6.0037411,19.2499651 L6.0037411,14.7514308 C6.0037411,14.0600417 5.44325957,13.4995602 4.75187055,13.4995602 Z">
                                        </path>
                                    </g>
                                </g>
                            </svg> :
                            <svg
                                className="self-end mt-5 cursor-pointer"
                                onClick={() => setStats(!stats)}
                                width="25px" height="25px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                <clipPath id="1144d64f8a"><path d="M 344.25 103 L 465.75 103 L 465.75 706.691406 L 344.25 706.691406 Z M 344.25 103 " clipRule="nonzero"/></clipPath>
                                <clipPath id="62052300db"><path d="M 344.25 164.054688 C 344.25 130.503906 371.449219 103.304688 405 103.304688 C 438.550781 103.304688 465.75 130.503906 465.75 164.054688 L 465.75 645.941406 C 465.75 679.496094 438.550781 706.691406 405 706.691406 C 371.449219 706.691406 344.25 679.496094 344.25 645.941406 Z M 344.25 164.054688 " clipRule="nonzero"/></clipPath>
                                <clipPath id="5f051555cd"><path d="M 104.324219 438.535156 L 225.824219 438.535156 L 225.824219 728.996094 L 104.324219 728.996094 Z M 104.324219 438.535156 " clipRule="nonzero"/></clipPath>
                                <clipPath id="29c5cf95b3"><path d="M 104.324219 499.511719 C 104.324219 465.957031 131.523438 438.761719 165.074219 438.761719 C 198.625 438.761719 225.824219 465.957031 225.824219 499.511719 L 225.824219 668.246094 C 225.824219 701.796875 198.625 728.996094 165.074219 728.996094 C 131.523438 728.996094 104.324219 701.796875 104.324219 668.246094 Z M 104.324219 499.511719 " clipRule="nonzero"/></clipPath>
                                <clipPath id="a593707e50"><path d="M 584.25 265.304688 L 705.75 265.304688 L 705.75 729 L 584.25 729 Z M 584.25 265.304688 " clipRule="nonzero"/></clipPath>
                                <clipPath id="ab9c45ef24"><path d="M 584.25 326.316406 C 584.25 292.765625 611.449219 265.566406 645 265.566406 C 678.550781 265.566406 705.75 292.765625 705.75 326.316406 L 705.75 668.25 C 705.75 701.800781 678.550781 729 645 729 C 611.449219 729 584.25 701.800781 584.25 668.25 Z M 584.25 326.316406 " clipRule="nonzero"/></clipPath></defs>
                                <path d="M 396.625 67.484375 C 447.917969 67.484375 489.5 109.066406 489.5 160.359375 L 489.5 649.6875 C 489.5 700.980469 447.917969 742.5625 396.625 742.5625 C 345.332031 742.5625 303.75 700.980469 303.75 649.6875 L 303.75 160.359375 C 303.75 109.066406 345.332031 67.484375 396.625 67.484375 Z M 632.875 236.234375 C 684.167969 236.234375 725.75 277.816406 725.75 329.109375 L 725.75 649.6875 C 725.75 700.980469 684.167969 742.5625 632.875 742.5625 C 581.582031 742.5625 540 700.980469 540 649.6875 L 540 329.109375 C 540 277.816406 581.582031 236.234375 632.875 236.234375 Z M 160.375 404.984375 C 211.667969 404.984375 253.25 446.566406 253.25 497.859375 L 253.25 649.6875 C 253.25 700.980469 211.667969 742.5625 160.375 742.5625 C 109.082031 742.5625 67.5 700.980469 67.5 649.6875 L 67.5 497.859375 C 67.5 446.566406 109.082031 404.984375 160.375 404.984375 Z M 396.625 118.109375 C 373.292969 118.109375 354.375 137.027344 354.375 160.359375 L 354.375 649.6875 C 354.375 673.019531 373.292969 691.9375 396.625 691.9375 C 419.960938 691.9375 438.875 673.019531 438.875 649.6875 L 438.875 160.359375 C 438.875 137.027344 419.960938 118.109375 396.625 118.109375 Z M 632.875 286.859375 C 609.542969 286.859375 590.625 305.777344 590.625 329.109375 L 590.625 649.6875 C 590.625 673.019531 609.542969 691.9375 632.875 691.9375 C 656.210938 691.9375 675.125 673.019531 675.125 649.6875 L 675.125 329.109375 C 675.125 305.777344 656.210938 286.859375 632.875 286.859375 Z M 160.375 455.609375 C 137.042969 455.609375 118.125 474.527344 118.125 497.859375 L 118.125 649.6875 C 118.125 673.019531 137.042969 691.9375 160.375 691.9375 C 183.710938 691.9375 202.625 673.019531 202.625 649.6875 L 202.625 497.859375 C 202.625 474.527344 183.710938 455.609375 160.375 455.609375 Z M 160.375 455.609375 " fillOpacity="1" fillRule="nonzero"/>
                                <g clipPath="url(#1144d64f8a)"><g clipPath="url(#62052300db)"><path d="M 344.25 706.691406 L 344.25 103.464844 L 465.75 103.464844 L 465.75 706.691406 Z M 344.25 706.691406 " fillOpacity="1" fillRule="nonzero"/></g></g>
                                <g clipPath="url(#5f051555cd)"><g clipPath="url(#29c5cf95b3)"><path d="M 104.324219 728.996094 L 104.324219 438.535156 L 225.824219 438.535156 L 225.824219 728.996094 Z M 104.324219 728.996094 " fillOpacity="1" fillRule="nonzero"/></g></g>
                                <g clipPath="url(#a593707e50)"><g clipPath="url(#ab9c45ef24)"><path d="M 584.25 729 L 584.25 265.78125 L 705.75 265.78125 L 705.75 729 Z M 584.25 729 " fillOpacity="1" fillRule="nonzero"/></g></g>
                            </svg>}
                    </div>

                    {stats && (
                        <div className="w-full py-3">
                            <h2 className="text-text-main text-xl">User Statistics</h2>

                            <div className="flex justify-between gap-8 mt-3">
                            {/* Music Stats Column */}
                            <div className="flex-1 bg-background-tertiary p-4 rounded-md">
                                <h3 className="text-text-main text-lg font-bold mb-3">Music</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Posts shared:</span>
                                        <span className="text-text-main">{totalUserposts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Comments shared:</span>
                                        <span className="text-text-main">{totalComment}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Total saves:</span>
                                        <span className="text-text-main">{totalBookmarks}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Stats Column */}
                            <div className="flex-1 bg-background-tertiary p-4 rounded-md">
                                <h3 className="text-text-main text-lg font-bold mb-3">Social</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Total reposts:</span>
                                        <span className="text-text-main">{totalReposts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Total likes:</span>
                                        <span className="text-text-main">{totalLikes}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-text-secondary">Highest like count:</span>
                                        <span className="text-text-main">{highestLikeCount}</span>
                                    </div>
                                </div>
                            </div>
                            </div>
                        </div>
                        )}
                </div>

                {/* Button to choose user posts or replies */}
                <div className="flex flex-row justify-evenly mb-8">
                    <button className={!showPosts ? "w-full text-text-main p-3 bg-background-tertiary rounded-bl-md border-r-2 border-background-secondary hover:bg-background-fourth transition-colors ease-in duration-75 cursor-pointer"
                        : "w-full text-text-main p-3 bg-accent-blue rounded-bl-md border-r-2 border-background-secondary hover:bg-accent-blue-light transition-colors ease-in duration-75 cursor-pointer"}
                            onClick={toggleShowPosts}>
                        <p className="text-md">
                            Posts
                        </p>
                    </button>

                    <button  className={!showComments ? "w-full text-text-main p-3 bg-background-tertiary rounded-br-md hover:bg-background-fourth transition-colors ease-in duration-75 cursor-pointer"
                        : "w-full text-text-main p-3 bg-accent-blue rounded-br-md hover:bg-accent-blue-light transition-colors ease-in duration-75 cursor-pointer"}
                             onClick={toggleShowComments}>
                        <p className="text-md">
                            Comments
                        </p>
                    </button>
                </div>

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
                    POST.mapProfilePosts(posts, userData, user, showPosts, showComments, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments)
                }

            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default ProfilePage;
