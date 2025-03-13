import { useContext, useEffect, useState } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext} from "../UserContext";
import {PackagedPost} from "../types";
import * as API from "../api";
import * as POST from "../components/Posts"
import {useSearchParams} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

let fetchedPosts: Array<PackagedPost>;


const ExplorePage = () => {
    const [posts, setPosts] = useState<Array<PackagedPost>>([]);
    const { user, setUser } = useContext(UserContext);

    const postQuery = useQuery({
        queryKey: ['posts'],
        queryFn: API.getPosts,
        staleTime: 1000 * 60,
    })

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

    const handleFlairClick = (flair: string) => {
        setSearchParams({ flair });
    };

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

    useEffect(() => {
        const fetchPostsData = async () => {
            if (user === null) {
                const userjson = await API.RestoreUser();
                if (userjson.id != null) {
                    setUser(userjson);
                }
            }
            if (postQuery.isSuccess) {
            const fetched = postQuery.data;
            fetched.sort(
                (a, b) => new Date(b.post.time).getTime() - new Date(a.post.time).getTime()
            );
            fetchedPosts = fetched;
            const filtered = flairFilter
                ? fetchedPosts.filter(p => p.post.text.includes(`#${flairFilter}`))
                : fetchedPosts;
            setPosts(filtered);
            }
        };
        fetchPostsData();
    }, [user, flairFilter]);

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col px-20 relative grid grid-auto-flow auto-rows-auto">
                <div className="fixed z-20 bg-background-main opacity-95 w-full">
                    <h1 className="text-white text-2xl top-0 my-6">Explore</h1>
                </div>

                <div className="flex-1 bg-background-main relative overflow-auto mt-20 hide-scrollbar">
                    {flairFilter && (
                        <div className="mx-10 my-4">
                            <p className="text-white">
                                Filtering posts by hashtag: <strong>#{flairFilter}</strong>
                            </p>
                            <button
                                className="mt-2 px-5 py-2 text-text-main bg-accent-blue hover:accent-blue-light transition-colors ease-in duration-75 rounded-md"
                                onClick={() => setSearchParams({})}
                            >
                                Clear Filter
                            </button>
                        </div>
                    )}

                    {
                        POST.mapPosts(posts, user, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments, () => true)
                    }
                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default ExplorePage;
