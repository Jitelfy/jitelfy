import { useEffect, useState, useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";
import { getPosts, RestoreUser, BASE_URL } from "../api";
import { PackagedPost, Post, User } from "../types";
import {Link, useSearchParams} from "react-router-dom";
import Comments from "../components/Comments";


const BookmarksPage = () => {
    const { user, setUser } = useContext(UserContext);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Array<PackagedPost>>([]);

    useEffect(() => {
        const fetchBookmarkedPost = async () => {
            if (user === null) {
                const userjson = await RestoreUser();
                if (userjson.id != null) {
                    setUser(userjson);
                }
            }
            try {
                if (!user) return;
                const response = await fetch(`${BASE_URL}/users/bookmarks`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + user.token
                    },
                    credentials: "include"
                });

                if (response.ok) {
                    const data = await response.json();
                    const filteredEmptyPosts = data.filter((post: PackagedPost) => post.post.id !== "000000000000000000000000");
                    console.log(filteredEmptyPosts)
                    setBookmarkedPosts(filteredEmptyPosts);
                }
            }
            catch(error) {
                console.error("Error fetching bookmarked posts:", error);
            }
        }
        fetchBookmarkedPost();
    }, [user])

    // if (user == null) {
    //     return (
    //         <div className="h-screen bg-background-main flex">
    //             {/* Sidebar - Left */}
    //             {Quicklinks(user!)}
    //             <div className="flex-1 bg-background-main p-6 overflow-auto">
    //                 <div className="relative w-full">
    //                 </div>
    //             </div>
    //             {/* Sidebar - Right */}
    //             {FriendActivity()}
    //         </div>
    //     );
    // }

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col px-20 relative grid grid-auto-flow auto-rows-auto">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6">Bookmarks</h1>
                </div>

                {/* Show all bookmarks */}
                {/* <p className="text-text-main">Nothing to see here yet...</p> */}

                <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">
                    {bookmarkedPosts.map((post) => (
                        <div key={post.post.id} className="bg-background-secondary p-4 rounded-lg mb-6">
                            <div>{post.post.text}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity()}
        </div>
    );
};

export default BookmarksPage;