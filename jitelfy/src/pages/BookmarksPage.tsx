import {useContext, useEffect, useState} from "react";
import {FriendActivity, Quicklinks} from "../components/Sidebars";
import {UserContext} from "../UserContext";
import * as API from "../api";
import * as POST from "../components/Posts"
import {PackagedPost} from "../types";
import {useSearchParams} from "react-router-dom";

let fetchedPosts: Array<PackagedPost>;

const BookmarksPage = () => {
    const { user, setUser } = useContext(UserContext);

    const [bookmarkedPosts, setBookmarkedPosts] = useState<Array<PackagedPost>>([]);
    const [openComments, setOpenComments] = useState<Set<string>>(new Set());
    const [searchParams, setSearchParams] = useSearchParams();

    const flairFilter = searchParams.get("flair") || "";

    const handleFlairClick = (flair: string) => {
        setSearchParams({ flair });
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

    useEffect(() => {
        const fetchBookmarkedPosts = async () => {
            if (user === null) {
                const userjson = await API.RestoreUser();
                if (userjson.id != null) {
                    setUser(userjson);
                }
            }
            try {
                if (!user) return;
                const response = await fetch(`${API.BASE_URL}/users/bookmarks`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + user.token
                    },
                    credentials: "include"
                });

                if (response.ok) {
                    fetchedPosts = await response.json();
                    fetchedPosts.sort(
                        (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
                    );

                    const filtered = flairFilter
                        ? fetchedPosts.filter(p => p.post.text.includes(`#${flairFilter}`))
                        : fetchedPosts;
                    setBookmarkedPosts(filtered);
                }
            } catch (error) {
                console.error("Error fetching bookmarked posts:", error);
            }
        };
        fetchBookmarkedPosts();
    }, [user, flairFilter]);

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col px-20 relative overflow-auto">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6">Bookmarks</h1>
                </div>

                <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">
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

                    {bookmarkedPosts.length === 0 ? (
                        <p className="text-background-tertiary text-center mt-20">Nothing to see here yet...</p>
                    ) : (
                        POST.mapBookmarks(bookmarkedPosts, user, openComments, renderTextWithHashtags, setUser, setBookmarkedPosts, setOpenComments)
                    )}
                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default BookmarksPage;