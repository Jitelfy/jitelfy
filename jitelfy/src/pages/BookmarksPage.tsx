import { useEffect, useState, useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";
import { getPosts, RestoreUser, BASE_URL } from "../api";
import { PackagedPost, Post, User } from "../types";
import { Link, useSearchParams } from "react-router-dom";
import Comments from "../components/Comments";

const BookmarksPage = () => {
    const { user, setUser } = useContext(UserContext);
    const [bookmarkedPosts, setBookmarkedPosts] = useState<Array<PackagedPost>>([]);

    useEffect(() => {
        const fetchBookmarkedPosts = async () => {
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
                    setBookmarkedPosts(filteredEmptyPosts);
                }

            } catch (error) {
                console.error("Error fetching bookmarked posts:", error);
            }
        };
        fetchBookmarkedPosts();
    }, [user]);

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col px-20 relative grid grid-auto-flow auto-rows-auto">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6">Bookmarks</h1>
                </div>

                <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">
                    {bookmarkedPosts.length === 0 ? (
                        <p className="text-background-tertiary text-center">Nothing to see here yet...</p>
                    ) : (
                        bookmarkedPosts.map((post) => (
                            <div key={post.post.id} className="bg-background-secondary p-4 rounded-lg mb-6">
                                <div className="flex items-center">
                                    <div>
                                        <img
                                            className="size-14 rounded-full mb-2 mr-3"
                                            src={IconArray[post.user.icon]}
                                            alt={post.user.displayname}
                                        />
                                    </div>
                                    <div>
                                        <Link to={"/profile/" + post.user.username} className="hover:underline hover:decoration-background-tertiary">
                                            <p className="text-text-main font-bold">{post.user.displayname}</p>
                                            <p className="text-text-secondary font-normal">@{post.user.username}</p>
                                        </Link>
                                        <p className="text-text-secondary text-sm">{new Date(post.post.time).toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="mt-2 text-text-main whitespace-pre-wrap break-words mb-2">{post.post.text}</p>
                                {post.post.embed && (
                                    <div className="mt-2">
                                        <img src={post.post.embed} className="w-full h-40 rounded-md" alt="" />
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
                        ))
                    )}
                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default BookmarksPage;