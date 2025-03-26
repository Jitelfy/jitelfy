import { useContext, useEffect, useState } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import {useSearchParams} from "react-router-dom";
import { UserContext} from "../UserContext";
import {PackagedPost, User} from "../types";

import * as API from "../api";
import * as POST from "../components/Posts"
import * as USER from "../components/Users"

let fetchedPosts: Array<PackagedPost>;

const ExplorePage = () => {
    const { user, setUser } = useContext(UserContext);
    const [posts, setPosts] = useState<Array<PackagedPost>>([]);
    const [users, setUsers] = useState<Array<User>>([]);

    // Search input (search bar)
    const [userSearchInput, setUserSearchInput] = useState("");
    const [searchInput, setSearchInput] = useState("");

    // Are we searching for posts or users?
    const [searchPosts, setSearchPosts] = useState(true);
    const [searchUsers, setSearchUsers] = useState(false);

    // Filter params (if hashtag clicked)
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

    const handleFlairClick = (flair: string) => {
        setSearchParams({ flair });
    };

    const filterPosts = (posts: Array<PackagedPost>, flairFilter: string, input: string) => {
        let filteredPosts = posts;

        // moved flairs here
        if (flairFilter) {
            filteredPosts = filteredPosts.filter(p => p.post.text.includes(`#${flairFilter}`));
        }
        if (input) {
            // username
            if (input.startsWith("@")) {
                const usernameSearch = input.slice(1).toLowerCase();
                filteredPosts = filteredPosts.filter(p => p.user.username.toLowerCase().includes(usernameSearch));
            } else {
                // text and displayname
                filteredPosts = filteredPosts.filter(p => 
                    p.post.text.toLowerCase().includes(input.toLowerCase()) ||
                    p.user.displayname.toLowerCase().includes(input.toLowerCase())
                );
            }
        }

        return filteredPosts;
    }

    useEffect(() => {
        const restore = async () => {
            const loggedInUser: User = await API.RestoreUser();
            if (loggedInUser.id != null) {
                setUser(loggedInUser);
            }
        };

        const fetchPostsData = async () => {
            const fetched = await API.getPosts();
            fetched.sort(
                (a: PackagedPost, b: PackagedPost) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
            );
            fetchedPosts = fetched;
            const filtered = filterPosts(fetchedPosts, flairFilter, searchInput);
            setPosts(filtered);
        };

        const fetchUsersData = async () => {
            const fetched = await API.getUsers();
            //const filtered = filterPosts(fetchedPosts, flairFilter, searchInput);
            setUsers(fetched);
        };

        if (user == null) {
            restore();
        }
        fetchPostsData();
        fetchUsersData();

    }, [user, flairFilter, searchInput]);

    if (user == null) {
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
            <div className="flex-1 flex-col px-20 relative overflow-y-auto hide-scrollbar">
                <div className="fixed z-20 bg-background-main opacity-95 w-full">
                    <h1 className="text-white text-2xl top-0 my-6">Explore</h1>
                </div>

                <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar pt-16">

                    {/* Search bar */}
                    <div className="flex flex-row w-full items-center gap-4 bg-background-secondary fill-text-main rounded-t-md mt-4 px-4 pt-4 pb-6">
                            <svg width="25px" height="25px" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M11 5C7.68629 5 5 7.68629 5 11C5 14.3137 7.68629 17 11 17C14.3137 17 17 14.3137 17 11C17 7.68629 14.3137 5 11 5ZM3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 12.8487 18.3729 14.551 17.3199 15.9056L20.7071 19.2929C21.0976 19.6834 21.0976 20.3166 20.7071 20.7071C20.3166 21.0976 19.6834 21.0976 19.2929 20.7071L15.9056 17.3199C14.551 18.3729 12.8487 19 11 19C6.58172 19 3 15.4183 3 11Z"/>
                            </svg>

                            <input
                                type="text"
                                placeholder="Search posts.."
                                value={userSearchInput}
                                onChange={(e) => setUserSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setSearchInput(userSearchInput);
                                    }
                                }}
                                className="flex-1 px-4 py-2 bg-background-main border border-background-tertiary text-text-main rounded-md focus:outline-none focus:ring-2 focus:ring-accent-blue"/>

                            <button onClick={() => {
                                setSearchInput(userSearchInput);
                            }}>
                                <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                    Search
                                </p>
                            </button>
                    </div>

                    <div className="flex flex-row w-full justify-evenly mb-6">
                        <button className="w-full"
                            onClick={() => {
                                setSearchPosts(true);
                                setSearchUsers(false);
                            }}>
                            <p className={!searchPosts ? "text-text-main bg-background-tertiary px-6 py-2 rounded-bl-xl hover:bg-background-fourth transition-colors":
                                "text-text-main bg-accent-blue px-6 py-2 rounded-bl-xl"}>
                                Posts
                            </p>
                        </button>
                        <button className="w-full"
                                onClick={() => {
                                    setSearchPosts(false);
                                    setSearchUsers(true);
                                }}>
                            <p className={!searchUsers ? "text-text-main bg-background-tertiary px-6 py-2 rounded-br-xl hover:bg-background-fourth transition-colors":
                                                        "text-text-main bg-accent-blue px-6 py-2 rounded-br-xl"}>
                                Users
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

                    { searchPosts && POST.mapPosts(posts, user, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments, () => true) }
                    { searchUsers && USER.mapUsers(users, user, setUser, (u) => u.username != user.username)}

                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default ExplorePage;