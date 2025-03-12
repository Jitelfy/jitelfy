import {PackagedPost, Post, User} from "../types";
import { IconArray } from "../UserContext";
import { Link } from "react-router-dom";
import Comments from "./Comments";
import React from "react";
import * as API from "../api";

export const handleLike = async (postId: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/like/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });

        if (response.ok) {
            setPosts(posts.map((post) => {
                if (post.post.id === postId) {
                    return {
                        ...post,
                        post: {
                            ...post.post,
                            likeIds: [...post.post.likeIds, user.id],
                        },
                    };
                }
                return post;
            }));
        }
    }
    catch (error) {
        console.error("Error liking post:", error);
    }
};

export const handleUnlike = async (postId: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/unlike/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });
        if (response.ok) {
            setPosts(posts.map((post) => {
                if (post.post.id === postId) {
                    return {
                        ...post,
                        post: {
                            ...post.post,
                            likeIds: post.post.likeIds.filter((id) => id !== user.id),
                        },
                    };
                }
                return post;
            }));
        }
    }
    catch (error) {
        console.error("Error unliking post:", error);
    }
};

export const handleRepost = async (
    postId: string,
    user: User | null,
    setUser: (u: User) => any
) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/repost/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });
        if (response.ok) {
            setUser({ ...user, reposts: [...user.reposts, postId] });
        }
    } catch (error) {
        console.error("Error reposting:", error);
    }
};

export const handleUnRepost = async (
    postId: string,
    user: User | null,
    setUser: (u: User) => any
) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/unrepost/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });
        if (response.ok) {
            setUser({ ...user, reposts: user.reposts.filter((id) => id !== postId) });
        }
    } catch (error) {
        console.error("Error unreposting:", error);
    }
};

export const handleDeletePost = async (id: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any, parentPost: Post | null) => {
    if (!user) return; // ensure user exists
    const response = await API.requestDeletePost(id);
    if (!response) {
        console.error("Failed to delete post");
        return;
    }

    // Remove the deleted post from state without refetching/reloading
    setPosts(posts.map((post) => {
        if (post.post.id === id) {
            return {
                ...post,
                post: {
                    ...post.post,
                    childids: -1,
                },
            };
        }
        return post;
    }))

    if (parentPost) {
        parentPost.childids--;
    }
};

export const handleBookmark = async (postId: string, user: User | null, setUser: (u: User) => any) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/bookmark/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });

        if (response.ok) {
            const updatedUser = {...user, bookmarks: [...user.bookmarks, postId]};
            setUser(updatedUser);
        }
    }
    catch (error) {
        console.log("Error bookmarking post:", error);
    }
}

export const handleUnBookmark = async (postId: string, user: User | null, setUser: (u: User) => any) => {
    if (!user) return;
    try {
        const response = await fetch(`${API.BASE_URL}/posts/unbookmark/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + user.token
            },
            credentials: "include",
        });

        if (response.ok) {
            const updatedUser = { ...user, bookmarks: user.bookmarks.filter((id: string) => id !== postId) };
            setUser(updatedUser);
        }
    }
    catch (error) {
        console.log("Error bookmarking post:", error);
    }
}

const toggleComments = (postId: string, openComments: Set<string>, setOpenComments: (c: Set<string>) => any) => {
    const newSet = new Set(openComments);
    if (newSet.has(postId)) {
        newSet.delete(postId);
    } else {
        newSet.add(postId);
    }
    setOpenComments(newSet);
};

export const mapPosts = (posts: Array<PackagedPost>, user: User | null, openComments: Set<string>, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setPosts: (p: Array<PackagedPost>) => any, setOpenComments:(c: Set<string>) => any,  filter:(post: PackagedPost) => boolean) => {
    return (
        posts.filter(filter).map((post) => (
            post.post.childids !== -1 ? ParentPost(post.post, post.user, user, posts, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments)
                : <p className="text-text-secondary text-sm mb-4">This post has been deleted...</p>
        ))
    )
};

export const mapComments = (parentPost: Post | null, posts: Array<PackagedPost>, user: User | null, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setPosts: (p: Array<PackagedPost>) => any,  filter:(post: PackagedPost) => boolean) => {
    return (
        posts.filter(filter).map((comment) => (
            comment.post.childids !== -1 ? ChildPost(parentPost, comment.post, comment.user, user, posts, renderTextWithHashtags, setUser, setPosts)
                : <p className="text-text-secondary text-sm mb-4">This comment has been deleted...</p>
        ))
    )
};

export const mapProfilePosts = (posts: Array<PackagedPost>, user: User | null, showPosts: Boolean, showComments: Boolean, openComments: Set<string>, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setPosts: (p: Array<PackagedPost>) => any, setOpenComments:(c: Set<string>) => any) => {
    return (
        <div>
            {/* User posts */}
            { showPosts && (mapPosts(posts, user, openComments, renderTextWithHashtags, setUser, setPosts, setOpenComments, (post: PackagedPost) => post.post.parentid === "000000000000000000000000"))}

            {/* User comments */}
            { showComments && (mapComments(null, posts, user, renderTextWithHashtags, setUser, setPosts, (post: PackagedPost) => post.post.parentid !== "000000000000000000000000"))}
        </div>
    )
};

export const mapBookmarks = (bookmarkedPosts: Array<PackagedPost>, user: User | null, openComments: Set<string>, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setBookmarkedPosts: (p: Array<PackagedPost>) => any, setOpenComments:(c: Set<string>) => any,  filter:(post: PackagedPost) => boolean) => {
    return (
        bookmarkedPosts.filter(filter).map((post) => (
            post.post.parentid == "000000000000000000000000" ? ParentPost(post.post, post.user, user, bookmarkedPosts, openComments, renderTextWithHashtags, setUser, setBookmarkedPosts, setOpenComments)
                : ChildPost(null, post.post, post.user, user, bookmarkedPosts, renderTextWithHashtags, setUser, setBookmarkedPosts)
        ))
    )
};

export const ParentPost = (post: Post, postUser: User, loggedInUser: User | null, posts: Array<PackagedPost>, openComments: Set<string>, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setPosts: (p: Array<PackagedPost>) => any, setOpenComments:(c: Set<string>) => any) => {
    return (
        <div
            key={post.id}
            className="bg-background-secondary p-4 rounded-lg mb-6 relative truncate"
        >
            {/* Delete Button (only for our own posts)*/}
            {loggedInUser != null && postUser.id === loggedInUser.id && (
                <button
                    onClick={() => handleDeletePost(post.id, loggedInUser, posts, setPosts, null)}
                    className="absolute top-2 right-2 hover:cursor-pointer"
                >
                    <svg
                        className="self-start"
                        width="25px"
                        height="25px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 6.70711C4.90237 6.31658 4.90237 5.68342 5.29289 5.29289Z"
                            fill="#7e7e7e"
                        />
                    </svg>
                </button>)}

            <div className="flex items-center">
                <div>
                    <img
                        className="size-14 rounded-full mb-2 mr-3"
                        src={IconArray[postUser.icon]}
                        alt={postUser.displayname}
                    />
                </div>
                <div>
                    {/* Display name, @username, timestamp posted */}
                    <Link to={"/profile/" + postUser.username}
                          className="hover:underline hover:decoration-background-tertiary">
                        <p className="text-text-main font-bold">
                            {postUser.displayname}
                        </p>
                        <p className="text-text-secondary font-normal">
                            @{postUser.username}
                        </p>
                    </Link>
                    <p className="text-text-secondary text-sm">
                        {new Date(post.time).toLocaleString()}
                    </p>
                </div>
            </div>
            <p className="mt-2 text-text-main whitespace-pre-wrap break-words mb-2">
                {renderTextWithHashtags(post.text)}
            </p>

            {post.song && (
                <div className="mt-2">
                    <iframe
                        src={post.song}
                        loading="lazy"
                        className="w-full h-20"
                        title={`Song for ${post.id}`}
                        allowFullScreen
                    ></iframe>
                </div>
            )}
            <div className="flex flex-row align-baseline mt-5 justify-between">
                <div className="flex flex-row gap-20 ml-4">
                    {/* Comment */}
                    <button
                        onClick={() => toggleComments(post.id, openComments, setOpenComments)} // Toggle comments on after clicking the svg
                        className="text-text-secondary fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-2 items-center"
                    >
                        {!openComments.has(post.id)?
                            <div className="flex flex-row gap-2">
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 3C10.5937 3 9.2995 3.05598 8.14453 3.14113C6.41589 3.26859 5.80434 3.32966 5.0751 3.73C4.42984 4.08423 3.66741 4.90494 3.36159 5.5745C3.01922 6.32408 3.00002 7.07231 3.00002 9.13826V10.8156C3.00002 11.9615 3.00437 12.3963 3.06904 12.7399C3.37386 14.3594 4.64066 15.6262 6.26012 15.931C6.60374 15.9957 7.03847 16 8.18442 16C8.1948 16 8.20546 16 8.21637 16C8.33199 15.9998 8.47571 15.9996 8.61593 16.019C9.21331 16.1021 9.74133 16.4502 10.053 16.9666C10.1261 17.0878 10.1825 17.22 10.2279 17.3264C10.2322 17.3364 10.2364 17.3462 10.2404 17.3557L10.6994 18.4267C11.0609 19.2701 11.3055 19.8382 11.518 20.2317C11.6905 20.5511 11.7828 20.6364 11.794 20.6477C11.9249 20.7069 12.0751 20.7069 12.2061 20.6477C12.2172 20.6364 12.3095 20.5511 12.482 20.2317C12.6946 19.8382 12.9392 19.2701 13.3006 18.4267L13.7596 17.3557C13.7637 17.3462 13.7679 17.3364 13.7721 17.3264C13.8175 17.22 13.8739 17.0878 13.9471 16.9666C14.2587 16.4502 14.7867 16.1021 15.3841 16.019C15.5243 15.9996 15.668 15.9998 15.7837 16C15.7946 16 15.8052 16 15.8156 16C16.9616 16 17.3963 15.9957 17.7399 15.931C19.3594 15.6262 20.6262 14.3594 20.931 12.7399C20.9957 12.3963 21 11.9615 21 10.8156V9.13826C21 7.07231 20.9808 6.32408 20.6384 5.5745C20.3326 4.90494 19.5702 4.08423 18.9249 3.73C18.1957 3.32966 17.5841 3.26859 15.8555 3.14113C14.7005 3.05598 13.4064 3 12 3ZM7.99746 1.14655C9.19742 1.05807 10.5408 1 12 1C13.4593 1 14.8026 1.05807 16.0026 1.14655C16.0472 1.14984 16.0913 1.15308 16.1351 1.1563C17.6971 1.27104 18.7416 1.34777 19.8874 1.97681C20.9101 2.53823 21.973 3.68239 22.4577 4.74356C23.001 5.93322 23.0007 7.13737 23.0001 8.95396C23 9.0147 23 9.07613 23 9.13826V10.8156C23 10.8555 23 10.8949 23 10.9337C23.0002 11.921 23.0003 12.5583 22.8965 13.1098C22.4392 15.539 20.5391 17.4392 18.1099 17.8965C17.5583 18.0003 16.9211 18.0002 15.9337 18C15.8949 18 15.8555 18 15.8156 18C15.7355 18 15.6941 18.0001 15.6638 18.0009C15.6625 18.0009 15.6612 18.0009 15.66 18.001C15.6596 18.002 15.659 18.0032 15.6585 18.0044C15.6458 18.0319 15.6294 18.07 15.5979 18.1436L15.1192 19.2604C14.7825 20.0462 14.5027 20.6992 14.2417 21.1823C13.9898 21.6486 13.6509 22.1678 13.098 22.4381C12.4052 22.7768 11.5948 22.7768 10.902 22.4381C10.3491 22.1678 10.0103 21.6486 9.75836 21.1823C9.49738 20.6992 9.21753 20.0462 8.88079 19.2604L8.40215 18.1436C8.3706 18.07 8.35421 18.0319 8.34157 18.0044C8.34101 18.0032 8.34048 18.002 8.33998 18.001C8.33881 18.0009 8.33755 18.0009 8.33621 18.0009C8.30594 18.0001 8.26451 18 8.18442 18C8.14451 18 8.10515 18 8.06633 18C7.07897 18.0002 6.44169 18.0003 5.89017 17.8965C3.46098 17.4392 1.56079 15.539 1.10356 13.1098C0.999748 12.5583 0.999849 11.921 1.00001 10.9337C1.00001 10.8949 1.00002 10.8555 1.00002 10.8156V9.13826C1.00002 9.07613 0.999998 9.0147 0.999978 8.95396C0.999383 7.13737 0.998989 5.93322 1.54238 4.74356C2.02707 3.68239 3.08998 2.53823 4.11264 1.97681C5.25848 1.34777 6.30294 1.27104 7.86493 1.1563C7.9087 1.15308 7.95287 1.14984 7.99746 1.14655Z"/>
                            </svg>
                                <p className="text-sm">{post.childids || 0}</p>
                            </div>
                        :
                            <div className="flex flex-row gap-2 text-accent-blue">
                                <svg className="fill-accent-blue" width="20px" height="20px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                    <clipPath id="07b7d0845c"><path d="M 81 94.996094 L 714 94.996094 L 714 550.957031 L 81 550.957031 Z M 81 94.996094 " clipRule="nonzero"/></clipPath>
                                    <clipPath id="6aa6d25f6b"><path d="M 119.25 94.996094 L 675.441406 94.996094 C 685.585938 94.996094 695.316406 99.027344 702.488281 106.199219 C 709.664062 113.371094 713.691406 123.101562 713.691406 133.246094 L 713.691406 512.707031 C 713.691406 522.851562 709.664062 532.578125 702.488281 539.753906 C 695.316406 546.925781 685.585938 550.957031 675.441406 550.957031 L 119.25 550.957031 C 109.105469 550.957031 99.375 546.925781 92.203125 539.753906 C 85.03125 532.578125 81 522.851562 81 512.707031 L 81 133.246094 C 81 123.101562 85.03125 113.371094 92.203125 106.199219 C 99.375 99.027344 109.105469 94.996094 119.25 94.996094 Z M 119.25 94.996094 " clipRule="nonzero"/></clipPath>
                                    <clipPath id="efbbe830fc"><path d="M 224.753906 441.957031 L 570 441.957031 L 570 743.992188 L 224.753906 743.992188 Z M 224.753906 441.957031 " clipRule="nonzero"/></clipPath>
                                    <clipPath id="eac9b95abb"><path d="M 397.347656 743.992188 L 569.9375 441.957031 L 224.753906 441.957031 Z M 397.347656 743.992188 " clipRule="nonzero"/></clipPath></defs>
                                    <path d="M 405 101.25 C 357.539062 101.25 313.859375 103.140625 274.878906 106.011719 C 216.535156 110.316406 195.894531 112.375 171.285156 125.886719 C 149.507812 137.84375 123.773438 165.542969 113.453125 188.140625 C 101.898438 213.4375 101.25 238.691406 101.25 308.417969 L 101.25 365.027344 C 101.25 403.699219 101.398438 418.375 103.582031 429.972656 C 113.867188 484.628906 156.621094 527.382812 211.277344 537.671875 C 222.875 539.855469 237.546875 540 276.222656 540 C 276.574219 540 276.933594 540 277.300781 540 C 281.203125 539.992188 286.054688 539.988281 290.789062 540.640625 C 310.949219 543.445312 328.769531 555.195312 339.289062 572.621094 C 341.753906 576.714844 343.660156 581.175781 345.191406 584.765625 C 345.335938 585.101562 345.476562 585.433594 345.613281 585.753906 L 361.105469 621.902344 C 373.304688 650.367188 381.5625 669.539062 388.734375 682.820312 C 394.554688 693.601562 397.667969 696.476562 398.046875 696.859375 C 402.464844 698.859375 407.535156 698.859375 411.957031 696.859375 C 412.332031 696.476562 415.445312 693.601562 421.265625 682.820312 C 428.441406 669.539062 436.699219 650.367188 448.894531 621.902344 L 464.386719 585.753906 C 464.523438 585.433594 464.667969 585.101562 464.808594 584.765625 C 466.339844 581.175781 468.242188 576.714844 470.714844 572.621094 C 481.230469 555.195312 499.050781 543.445312 519.214844 540.640625 C 523.945312 539.988281 528.796875 539.992188 532.699219 540 C 533.066406 540 533.425781 540 533.777344 540 C 572.453125 540 587.125 539.855469 598.722656 537.671875 C 653.378906 527.382812 696.132812 484.628906 706.421875 429.972656 C 708.605469 418.375 708.75 403.699219 708.75 365.027344 L 708.75 308.417969 C 708.75 238.691406 708.101562 213.4375 696.546875 188.140625 C 686.226562 165.542969 660.496094 137.84375 638.714844 125.886719 C 614.105469 112.375 593.464844 110.316406 535.125 106.011719 C 496.140625 103.140625 452.464844 101.25 405 101.25 Z M 269.914062 38.695312 C 310.414062 35.710938 355.753906 33.75 405 33.75 C 454.25 33.75 499.585938 35.710938 540.085938 38.695312 C 541.59375 38.808594 543.082031 38.917969 544.558594 39.023438 C 597.277344 42.898438 632.527344 45.488281 671.199219 66.71875 C 705.714844 85.664062 741.589844 124.28125 757.949219 160.09375 C 776.285156 200.246094 776.273438 240.886719 776.253906 302.195312 C 776.25 304.246094 776.25 306.320312 776.25 308.417969 L 776.25 365.027344 C 776.25 366.375 776.25 367.703125 776.25 369.011719 C 776.257812 402.332031 776.261719 423.84375 772.757812 442.457031 C 757.324219 524.441406 693.195312 588.574219 611.210938 604.007812 C 592.59375 607.511719 571.085938 607.507812 537.761719 607.5 C 536.453125 607.5 535.125 607.5 533.777344 607.5 C 531.074219 607.5 529.675781 607.503906 528.652344 607.53125 C 528.609375 607.53125 528.566406 607.53125 528.523438 607.535156 C 528.511719 607.566406 528.492188 607.609375 528.472656 607.648438 C 528.046875 608.578125 527.492188 609.863281 526.429688 612.347656 L 510.273438 650.039062 C 498.910156 676.558594 489.464844 698.597656 480.65625 714.902344 C 472.15625 730.640625 460.71875 748.164062 442.058594 757.285156 C 418.675781 768.71875 391.324219 768.71875 367.941406 757.285156 C 349.28125 748.164062 337.847656 730.640625 329.34375 714.902344 C 320.535156 698.597656 311.089844 676.558594 299.726562 650.039062 L 283.574219 612.347656 C 282.507812 609.863281 281.953125 608.578125 281.527344 607.648438 C 281.507812 607.609375 281.492188 607.566406 281.472656 607.535156 C 281.433594 607.53125 281.390625 607.53125 281.347656 607.53125 C 280.324219 607.503906 278.925781 607.5 276.222656 607.5 C 274.878906 607.5 273.546875 607.5 272.238281 607.5 C 238.914062 607.507812 217.40625 607.511719 198.792969 604.007812 C 116.808594 588.574219 52.675781 524.441406 37.246094 442.457031 C 33.742188 423.84375 33.746094 402.332031 33.75 369.011719 C 33.75 367.703125 33.75 366.375 33.75 365.027344 L 33.75 308.417969 C 33.75 306.320312 33.75 304.246094 33.75 302.195312 C 33.730469 240.886719 33.714844 200.246094 52.054688 160.09375 C 68.414062 124.28125 104.285156 85.664062 138.800781 66.71875 C 177.472656 45.488281 212.722656 42.898438 265.441406 39.023438 C 266.917969 38.917969 268.410156 38.808594 269.914062 38.695312 Z M 269.914062 38.695312 " fillOpacity="1" fillRule="evenodd"/>
                                    <g clipPath="url(#07b7d0845c)"><g clipPath="url(#6aa6d25f6b)"><path d="M 81 94.996094 L 713.289062 94.996094 L 713.289062 550.957031 L 81 550.957031 Z M 81 94.996094 " fillOpacity="1" fillRule="nonzero"/></g></g><g clipPath="url(#efbbe830fc)"><g clipPath="url(#eac9b95abb)">
                                        <path d="M 224.753906 441.957031 L 570.441406 441.957031 L 570.441406 743.992188 L 224.753906 743.992188 Z M 224.753906 441.957031 " fillOpacity="1" fillRule="nonzero"/></g></g>
                                </svg>
                                <p className="text-sm">{post.childids || 0}</p>
                            </div>
                        }
                    </button>

                    {/* Repost */}
                    {loggedInUser && loggedInUser.reposts.includes(post.id) ? (
                        <div className="flex flex-row gap-2 text-accent-green fill-accent-green cursor-pointer"
                             onClick={() => { handleUnRepost(post.id, loggedInUser, setUser); }}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    fillRule="evenodd"
                                    clipRule="evenodd"
                                    d="M16.2929 3.29289C16.6834 2.90237 17.3166 2.90237 17.7071 3.29289L20.7071 6.29289C21.0976 6.68342 21.0976 7.31658 20.7071 7.70711L17.7071 10.7071C17.3166 11.0976 16.6834 11.0976 16.2929 10.7071C15.9024 10.3166 15.9024 9.68342 16.2929 9.29289L17.5857 8.00006H7.85181C5.70703 8.00006 4 9.75511 4 12C4 12.5523 3.55228 13 3 13C2.44772 13 2 12.5523 2 12C2 8.72205 4.53229 6.00006 7.85181 6.00006H17.5858L16.2929 4.70711C15.9024 4.31658 15.9024 3.68342 16.2929 3.29289ZM21 11C21.5523 11 22 11.4477 22 12C22 15.3283 19.2275 18.0001 15.9578 18.0001H6.41427L7.70711 19.2929C8.09763 19.6834 8.09763 20.3166 7.70711 20.7071C7.31658 21.0976 6.68342 21.0976 6.29289 20.7071L3.29289 17.7071C2.90237 17.3166 2.90237 16.6834 3.29289 16.2929L6.29289 13.2929C6.68342 12.9024 7.31658 12.9024 7.70711 13.2929C8.09763 13.6834 8.09763 14.3166 7.70711 14.7071L6.41415 16.0001H15.9578C18.1524 16.0001 20 14.1945 20 12C20 11.4477 20.4477 11 21 11Z"
                                />
                            </svg>
                        </div>
                    ) :
                            <div className="flex flex-row gap-2 cursor-pointer text-text-secondary fill-text-secondary hover:text-accent-green hover:fill-accent-green duration-75 ease-in"
                                 onClick={() => { handleRepost(post.id, loggedInUser, setUser); }}>
                                <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M16.2929 3.29289C16.6834 2.90237 17.3166 2.90237 17.7071 3.29289L20.7071 6.29289C21.0976 6.68342 21.0976 7.31658 20.7071 7.70711L17.7071 10.7071C17.3166 11.0976 16.6834 11.0976 16.2929 10.7071C15.9024 10.3166 15.9024 9.68342 16.2929 9.29289L17.5857 8.00006H7.85181C5.70703 8.00006 4 9.75511 4 12C4 12.5523 3.55228 13 3 13C2.44772 13 2 12.5523 2 12C2 8.72205 4.53229 6.00006 7.85181 6.00006H17.5858L16.2929 4.70711C15.9024 4.31658 15.9024 3.68342 16.2929 3.29289ZM21 11C21.5523 11 22 11.4477 22 12C22 15.3283 19.2275 18.0001 15.9578 18.0001H6.41427L7.70711 19.2929C8.09763 19.6834 8.09763 20.3166 7.70711 20.7071C7.31658 21.0976 6.68342 21.0976 6.29289 20.7071L3.29289 17.7071C2.90237 17.3166 2.90237 16.6834 3.29289 16.2929L6.29289 13.2929C6.68342 12.9024 7.31658 12.9024 7.70711 13.2929C8.09763 13.6834 8.09763 14.3166 7.70711 14.7071L6.41415 16.0001H15.9578C18.1524 16.0001 20 14.1945 20 12C20 11.4477 20.4477 11 21 11Z"
                                    />
                                </svg>
                            </div>
                    }


                    {/* Like */}
                    {loggedInUser != null && post.likeIds.indexOf(loggedInUser.id) !== -1 ? (
                        <div className="flex flex-row gap-2 cursor-pointer"
                             onClick={() => {handleUnlike(post.id, loggedInUser, posts, setPosts);}}>
                            <svg className="fill-accent-red" width="20px" height="20px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                <clipPath id="6c326d0963"><path d="M 92 177.246094 L 729 177.246094 L 729 713.253906 L 92 713.253906 Z M 92 177.246094 " clipRule="nonzero"/></clipPath>
                                <clipPath id="54e3de31d4"><path d="M 116.566406 262.828125 C 66.722656 344.660156 101.289062 424.304688 147.066406 466.578125 L 414.730469 713.253906 L 676.746094 467.457031 C 719.320312 421.984375 735.175781 373.75 726.578125 320.039062 C 714.058594 245.742188 650.320312 188.097656 571.582031 179.863281 C 523.289062 174.945312 476.640625 187.996094 440.230469 217.0625 C 430.433594 224.878906 421.671875 233.621094 414.039062 243.125 C 404.984375 232.304688 394.363281 222.410156 382.351562 213.636719 C 340.484375 183.074219 287.1875 171.140625 235.996094 180.375 C 187.511719 189.371094 143.988281 219.414062 116.566406 262.828125 Z M 116.566406 262.828125 " clipRule="nonzero"/></clipPath></defs>
                                <path d="M 262.617188 135 C 153.125 135 67.5 230.167969 67.5 342.761719 C 67.5 401.324219 76.871094 449.550781 111.808594 500.289062 C 145.140625 548.707031 200.574219 597.5625 286.582031 662.023438 L 405 742.5 L 523.410156 662.035156 C 609.421875 597.570312 664.859375 548.707031 698.191406 500.289062 C 733.128906 449.550781 742.5 401.324219 742.5 342.761719 C 742.5 230.167969 656.875 135 547.382812 135 C 492.441406 135 444.886719 157.382812 405 197.882812 C 365.113281 157.382812 317.554688 135 262.617188 135 Z M 262.617188 202.5 C 194.921875 202.5 135 262.761719 135 342.761719 C 135 361.289062 136.046875 377.578125 138.664062 392.597656 C 143.042969 417.757812 151.8125 439.363281 167.40625 462.015625 C 193.90625 500.503906 241.265625 543.710938 327.089844 608.03125 L 405 666.542969 L 482.910156 608.03125 C 568.734375 543.710938 616.097656 500.503906 642.597656 462.015625 C 667.496094 425.84375 675 392.328125 675 342.761719 C 675 262.761719 615.078125 202.5 547.382812 202.5 C 505.679688 202.5 467.441406 222.285156 432.113281 269.941406 C 425.746094 278.53125 415.6875 283.59375 405 283.59375 C 394.3125 283.59375 384.253906 278.53125 377.886719 269.941406 C 342.558594 222.285156 304.320312 202.5 262.617188 202.5 Z M 262.617188 202.5 " fillOpacity="1" fillRule="evenodd"/>
                                <g clipPath="url(#6c326d0963)"><g clipPath="url(#54e3de31d4)">
                                    <path d="M 91.285156 177.246094 L 729.890625 177.246094 L 729.890625 713.253906 L 91.285156 713.253906 Z M 91.285156 177.246094 " fillOpacity="1" fillRule="nonzero"/></g></g>
                            </svg>
                            <p className="text-sm text-accent-red">{post.likeIds.length}</p>
                        </div>
                    ) :
                        <div className="flex flex-row gap-2 cursor-pointer text-text-secondary fill-text-secondary hover:fill-accent-red hover:text-accent-red duration-75 ease-in"
                             onClick={() => {handleLike(post.id, loggedInUser, posts, setPosts);}}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.78125 4C4.53699 4 2 6.81981 2 10.1559C2 11.8911 2.27768 13.32 3.31283 14.8234C4.3005 16.258 5.9429 17.7056 8.49134 19.6155L12 22L15.5084 19.6158C18.057 17.7058 19.6995 16.258 20.6872 14.8234C21.7223 13.32 22 11.8911 22 10.1559C22 6.81982 19.463 4 16.2188 4C14.5909 4 13.1818 4.66321 12 5.86323C10.8182 4.66321 9.40906 4 7.78125 4ZM7.78125 6C5.77551 6 4 7.7855 4 10.1559C4 10.7049 4.03107 11.1875 4.10853 11.6325C4.23826 12.378 4.49814 13.0182 4.96014 13.6893C5.74532 14.8297 7.14861 16.11 9.69156 18.0157L12 19.7494L14.3084 18.0157C16.8514 16.11 18.2547 14.8297 19.0399 13.6893C19.7777 12.6176 20 11.6245 20 10.1559C20 7.7855 18.2245 6 16.2188 6C14.9831 6 13.8501 6.58627 12.8033 7.99831C12.6147 8.25274 12.3167 8.40277 12 8.40277C11.6833 8.40277 11.3853 8.25274 11.1967 7.99831C10.1499 6.58627 9.01689 6 7.78125 6Z"/>
                            </svg>
                            <p className="text-sm">{post.likeIds.length}</p>
                        </div>
                    }
                </div>

                <div className="flex flex-row gap-3 mr-4">
                    {/* Bookmark (already bookmarked) */}
                    { loggedInUser && loggedInUser.bookmarks.indexOf(post.id) !== -1 ? (
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3 cursor-pointer"
                             onClick={() => {handleUnBookmark(post.id, loggedInUser, setUser);}}>
                            <svg className="fill-accent-blue" width="20px" height="20px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                <clipPath id="42f0bbd39a"><path d="M 182.03125 162 L 628 162 L 628 600.941406 L 182.03125 600.941406 Z M 182.03125 162 " clipRule="nonzero"/></clipPath>
                                <clipPath id="e1a312a0d5"><path d="M 220.28125 162 L 589.71875 162 C 599.863281 162 609.59375 166.03125 616.765625 173.203125 C 623.9375 180.375 627.96875 190.105469 627.96875 200.25 L 627.96875 562.691406 C 627.96875 572.835938 623.9375 582.5625 616.765625 589.738281 C 609.59375 596.910156 599.863281 600.941406 589.71875 600.941406 L 220.28125 600.941406 C 210.136719 600.941406 200.40625 596.910156 193.234375 589.738281 C 186.0625 582.5625 182.03125 572.835938 182.03125 562.691406 L 182.03125 200.25 C 182.03125 190.105469 186.0625 180.375 193.234375 173.203125 C 200.40625 166.03125 210.136719 162 220.28125 162 Z M 220.28125 162 " clipRule="nonzero"/></clipPath>
                                <clipPath id="c7ae287a16"><path d="M 167 480 L 381 480 L 381 726 L 167 726 Z M 167 480 " clipRule="nonzero"/></clipPath>
                                <clipPath id="37cce30e0d"><path d="M 167.933594 480.6875 L 381.085938 598.109375 L 278.492188 784.34375 L 65.339844 666.921875 Z M 167.933594 480.6875 " clipRule="nonzero"/></clipPath>
                                <clipPath id="8d262d0206"><path d="M 171.757812 725.546875 L 380.773438 597.9375 L 167.933594 480.6875 Z M 171.757812 725.546875 " clipRule="nonzero"/></clipPath>
                                <clipPath id="951f95fecf"><path d="M 423 479 L 636 479 L 636 725 L 423 725 Z M 423 479 " clipRule="nonzero"/></clipPath>
                                <clipPath id="20ec417e27"><path d="M 423.480469 598.828125 L 635.613281 479.574219 L 739.808594 664.921875 L 527.671875 784.171875 Z M 423.480469 598.828125 " clipRule="nonzero"/></clipPath>
                                <clipPath id="8b8040f67b"><path d="M 633.585938 724.632812 L 635.304688 479.75 L 423.480469 598.828125 Z M 633.585938 724.632812 " clipRule="nonzero"/></clipPath></defs>
                                <path d="M 330.34375 101.25 L 479.65625 101.25 C 507.28125 101.25 530.082031 101.25 548.644531 102.789062 C 567.925781 104.390625 585.640625 107.828125 602.230469 116.449219 C 626.890625 129.257812 646.996094 149.363281 659.800781 174.019531 C 668.417969 190.609375 671.859375 208.324219 673.460938 227.609375 C 675 246.171875 675 268.96875 675 296.59375 L 675 594.765625 C 675 627.261719 675 653.921875 673.222656 674.1875 C 671.539062 693.285156 667.839844 715.796875 652.996094 732.089844 C 634.753906 752.109375 608.015625 762.15625 581.109375 759.101562 C 559.207031 756.613281 541.597656 742.109375 527.753906 728.839844 C 513.074219 714.769531 495.515625 694.699219 474.117188 670.246094 L 461.386719 655.695312 C 446.722656 638.933594 437.132812 628.023438 429.1875 620.394531 C 421.492188 613.003906 417.84375 611.234375 416.007812 610.601562 C 408.875 608.140625 401.125 608.140625 393.992188 610.601562 C 392.15625 611.234375 388.507812 613.003906 380.8125 620.394531 C 372.867188 628.023438 363.277344 638.933594 348.613281 655.695312 L 335.882812 670.246094 C 314.484375 694.699219 296.925781 714.765625 282.242188 728.839844 C 268.402344 742.109375 250.792969 756.613281 228.890625 759.101562 C 201.984375 762.15625 175.246094 752.109375 157.007812 732.089844 C 142.160156 715.796875 138.457031 693.285156 136.78125 674.1875 C 135 653.921875 135 627.261719 135 594.765625 L 135 296.59375 C 135 268.96875 135 246.171875 136.539062 227.609375 C 138.140625 208.324219 141.578125 190.609375 150.199219 174.019531 C 163.007812 149.363281 183.113281 129.257812 207.769531 116.449219 C 224.359375 107.828125 242.074219 104.390625 261.359375 102.789062 C 279.921875 101.25 302.71875 101.25 330.34375 101.25 Z M 266.945312 170.058594 C 251.910156 171.308594 244.234375 173.570312 238.882812 176.347656 C 226.554688 182.753906 216.503906 192.804688 210.097656 205.132812 C 207.320312 210.484375 205.058594 218.160156 203.808594 233.195312 C 202.527344 248.632812 202.5 268.617188 202.5 298.011719 L 202.5 593.074219 C 202.5 627.675781 202.53125 651.335938 204.019531 668.277344 C 205.246094 682.21875 207.199219 686.597656 207.375 687.128906 C 210.84375 690.636719 215.671875 692.453125 220.59375 692.09375 C 221.074219 691.8125 225.429688 689.804688 235.53125 680.117188 C 247.808594 668.347656 263.410156 650.5625 286.195312 624.523438 L 298.753906 610.171875 C 312.21875 594.78125 323.738281 581.613281 334.0625 571.703125 C 344.878906 561.320312 356.84375 552.011719 371.972656 546.792969 C 393.375 539.410156 416.625 539.410156 438.027344 546.792969 C 453.15625 552.011719 465.121094 561.320312 475.9375 571.703125 C 486.261719 581.613281 497.78125 594.78125 511.25 610.171875 L 523.804688 624.523438 C 546.589844 650.5625 562.195312 668.347656 574.46875 680.117188 C 584.570312 689.804688 588.925781 691.8125 589.40625 692.09375 C 594.328125 692.453125 599.15625 690.636719 602.625 687.128906 C 602.796875 686.597656 604.753906 682.21875 605.976562 668.277344 C 607.46875 651.335938 607.5 627.675781 607.5 593.074219 L 607.5 298.011719 C 607.5 268.617188 607.472656 248.632812 606.191406 233.195312 C 604.941406 218.160156 602.679688 210.484375 599.898438 205.132812 C 593.496094 192.804688 583.441406 182.753906 571.113281 176.347656 C 565.765625 173.570312 558.089844 171.308594 543.054688 170.058594 C 527.617188 168.777344 507.632812 168.75 478.238281 168.75 L 331.761719 168.75 C 302.367188 168.75 282.382812 168.777344 266.945312 170.058594 Z M 266.945312 170.058594 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#42f0bbd39a)"><g clip-path="url(#e1a312a0d5)">
                                    <path d="M 182.03125 162 L 627.828125 162 L 627.828125 600.941406 L 182.03125 600.941406 Z M 182.03125 162 " fill-opacity="1" fill-rule="nonzero"/></g></g><g clip-path="url(#c7ae287a16)"><g clip-path="url(#37cce30e0d)"><g clip-path="url(#8d262d0206)">
                                    <path d="M 167.933594 480.6875 L 381.085938 598.109375 L 278.492188 784.34375 L 65.339844 666.921875 Z M 167.933594 480.6875 " fill-opacity="1" fill-rule="nonzero"/></g></g></g><g clip-path="url(#951f95fecf)"><g clip-path="url(#20ec417e27)"><g clip-path="url(#8b8040f67b)">
                                    <path d="M 423.480469 598.828125 L 635.613281 479.574219 L 739.808594 664.921875 L 527.671875 784.171875 Z M 423.480469 598.828125 " fill-opacity="1" fill-rule="nonzero"/></g></g></g>
                            </svg>
                        </div>
                    ) :
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3 cursor-pointer"
                             onClick={() => {handleBookmark(post.id, loggedInUser, setUser);}}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M9.78799 3H14.212C15.0305 2.99999 15.7061 2.99998 16.2561 3.04565C16.8274 3.0931 17.3523 3.19496 17.8439 3.45035C18.5745 3.82985 19.1702 4.42553 19.5497 5.1561C19.805 5.64774 19.9069 6.17258 19.9544 6.74393C20 7.29393 20 7.96946 20 8.78798V17.6227C20 18.5855 20 19.3755 19.9473 19.9759C19.8975 20.5418 19.7878 21.2088 19.348 21.6916C18.8075 22.2847 18.0153 22.5824 17.218 22.4919C16.5691 22.4182 16.0473 21.9884 15.6372 21.5953C15.2022 21.1783 14.6819 20.5837 14.0479 19.8591L13.6707 19.428C13.2362 18.9314 12.9521 18.6081 12.7167 18.3821C12.4887 18.1631 12.3806 18.1107 12.3262 18.0919C12.1148 18.019 11.8852 18.019 11.6738 18.0919C11.6194 18.1107 11.5113 18.1631 11.2833 18.3821C11.0479 18.6081 10.7638 18.9314 10.3293 19.428L9.95209 19.8591C9.31809 20.5837 8.79784 21.1782 8.36276 21.5953C7.95272 21.9884 7.43089 22.4182 6.78196 22.4919C5.9847 22.5824 5.19246 22.2847 4.65205 21.6916C4.21218 21.2088 4.10248 20.5418 4.05275 19.9759C3.99997 19.3755 3.99998 18.5855 4 17.6227V8.78799C3.99999 7.96947 3.99998 7.29393 4.04565 6.74393C4.0931 6.17258 4.19496 5.64774 4.45035 5.1561C4.82985 4.42553 5.42553 3.82985 6.1561 3.45035C6.64774 3.19496 7.17258 3.0931 7.74393 3.04565C8.29393 2.99998 8.96947 2.99999 9.78799 3ZM7.90945 5.03879C7.46401 5.07578 7.23663 5.1428 7.07805 5.22517C6.71277 5.41493 6.41493 5.71277 6.22517 6.07805C6.1428 6.23663 6.07578 6.46401 6.03879 6.90945C6.0008 7.36686 6 7.95898 6 8.83V17.5726C6 18.5978 6.00094 19.2988 6.04506 19.8008C6.08138 20.2139 6.13928 20.3436 6.14447 20.3594C6.2472 20.4633 6.39033 20.5171 6.53606 20.5065C6.55034 20.4981 6.67936 20.4386 6.97871 20.1516C7.34245 19.8029 7.80478 19.2759 8.4799 18.5044L8.85192 18.0792C9.25094 17.6232 9.59229 17.233 9.89819 16.9393C10.2186 16.6317 10.5732 16.3559 11.0214 16.2013C11.6555 15.9825 12.3445 15.9825 12.9786 16.2013C13.4268 16.3559 13.7814 16.6317 14.1018 16.9393C14.4077 17.233 14.7491 17.6232 15.1481 18.0792L15.5201 18.5044C16.1952 19.2759 16.6576 19.8029 17.0213 20.1516C17.3206 20.4386 17.4497 20.4981 17.4639 20.5065C17.6097 20.5171 17.7528 20.4633 17.8555 20.3594C17.8607 20.3436 17.9186 20.2139 17.9549 19.8008C17.9991 19.2988 18 18.5978 18 17.5726V8.83C18 7.95898 17.9992 7.36686 17.9612 6.90945C17.9242 6.46401 17.8572 6.23663 17.7748 6.07805C17.5851 5.71277 17.2872 5.41493 16.9219 5.22517C16.7634 5.1428 16.536 5.07578 16.0905 5.03879C15.6331 5.0008 15.041 5 14.17 5H9.83C8.95898 5 8.36686 5.0008 7.90945 5.03879Z"
                                />
                            </svg>
                        </div>
                    }

                    {/* Share */}
                    <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3">
                        <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M1 18.5088C1 13.1679 4.90169 8.77098 9.99995 7.84598V5.51119C9.99995 3.63887 12.1534 2.58563 13.6313 3.73514L21.9742 10.224C23.1323 11.1248 23.1324 12.8752 21.9742 13.7761L13.6314 20.2649C12.1534 21.4144 10 20.3612 10 18.4888V16.5189C7.74106 16.9525 5.9625 18.1157 4.92778 19.6838C4.33222 20.5863 3.30568 20.7735 2.55965 20.5635C1.80473 20.3511 1.00011 19.6306 1 18.5088ZM12.4034 5.31385C12.2392 5.18613 11.9999 5.30315 11.9999 5.51119V9.41672C11.9999 9.55479 11.8873 9.66637 11.7493 9.67008C8.09094 9.76836 4.97774 12.0115 3.66558 15.1656C3.46812 15.6402 3.31145 16.1354 3.19984 16.6471C3.07554 17.217 3.00713 17.8072 3.00053 18.412C3.00018 18.4442 3 18.4765 3 18.5088C3.00001 18.6437 3.18418 18.6948 3.25846 18.5822C3.27467 18.5577 3.29101 18.5332 3.30747 18.5088C3.30748 18.5088 3.30746 18.5088 3.30747 18.5088C3.63446 18.0244 4.01059 17.5765 4.42994 17.168C4.71487 16.8905 5.01975 16.6313 5.34276 16.3912C7.05882 15.1158 9.28642 14.3823 11.7496 14.3357C11.8877 14.3331 12 14.4453 12 14.5834V18.4888C12 18.6969 12.2393 18.8139 12.4035 18.6862L20.7463 12.1973C20.875 12.0973 20.875 11.9028 20.7463 11.8027L12.4034 5.31385Z"/>
                        </svg>
                    </div>
                </div>
            </div>
            {/* Comments */}
            {openComments && openComments.has(post.id) && (
                <Comments parentId={post.id} setUser={setUser} parentPost={post} />
            )}
        </div>
    )
}

export const ChildPost = (parentPost: Post | null, post: Post, postUser: User, loggedInUser: User | null,  posts: Array<PackagedPost>, renderTextWithHashtags: (text: string) => any, setUser: (user: User) => any, setPosts: (p: Array<PackagedPost>) => any) => {
    return (
        <div
            key={post.id}
            className="relative bg-background-secondary p-4 rounded-lg mb-4"
        >

            {/* Delete Button (only for our own posts)*/}
            {loggedInUser != null && postUser.id === loggedInUser.id && (
                <button
                    onClick={() => handleDeletePost(post.id, loggedInUser, posts, setPosts, parentPost)}
                    className="absolute top-2 right-2 hover:cursor-pointer"
                >
                    <svg
                        width="25px"
                        height="25px"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M5.29289 5.29289C5.68342 4.90237 6.31658 4.90237 6.70711 5.29289L12 10.5858L17.2929 5.29289C17.6834 4.90237 18.3166 4.90237 18.7071 5.29289C19.0976 5.68342 19.0976 6.31658 18.7071 6.70711L13.4142 12L18.7071 17.2929C19.0976 17.6834 19.0976 18.3166 18.7071 18.7071C18.3166 19.0976 17.6834 19.0976 17.2929 18.7071L12 13.4142L6.70711 18.7071C6.31658 19.0976 5.68342 19.0976 5.29289 18.7071C4.90237 18.3166 4.90237 17.6834 5.29289 17.2929L10.5858 12L5.29289 5.29289Z"
                            fill="#7e7e7e"
                        />
                    </svg>
                </button>)}

            <div className="flex items-center">
                <img
                    className="size-14 rounded-full mb-2 mr-3"
                    src={IconArray[postUser.icon]}
                    alt={postUser.displayname}
                />
                <div>
                    <Link to={`/profile/${postUser.username}`} className="hover:underline decoration-text-secondary">
                        <p className="text-text-main font-bold">{postUser.displayname}</p>
                        <p className="text-text-secondary">@{postUser.username}</p>
                    </Link>
                    <p className="text-text-secondary text-sm">
                        {new Date(post.time).toLocaleString()}
                    </p>
                </div>
            </div>
            <p className="mt-2 text-text-main whitespace-pre-wrap break-words mb-2">
                {renderTextWithHashtags(post.text)}
            </p>
            <div className="post-details">
                {post.embed && (
                    <img
                        src={post.embed}
                        className="w-full h-40 rounded-md"
                        alt="embedded content"
                    />
                )}
                {post.song && (
                    <div className="mt-2">
                        <iframe
                            src={post.song}
                            className="w-full h-20"
                            title={`Song for comment ${post.id}`}
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}
            </div>
            <div className="flex flex-row align-baseline mt-5 justify-end">
                <div className="flex flex-row gap-20 ml-4 mr-10">

                    {/* Like (already liked) */}
                    {loggedInUser != null && post.likeIds.indexOf(loggedInUser.id) !== -1 ? (
                        <div className="flex flex-row gap-2 cursor-pointer"
                             onClick={() => {handleUnlike(post.id, loggedInUser, posts, setPosts);}}>
                            <svg className="fill-accent-red" width="20px" height="20px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                <clipPath id="6c326d0963"><path d="M 92 177.246094 L 729 177.246094 L 729 713.253906 L 92 713.253906 Z M 92 177.246094 " clipRule="nonzero"/></clipPath>
                                <clipPath id="54e3de31d4"><path d="M 116.566406 262.828125 C 66.722656 344.660156 101.289062 424.304688 147.066406 466.578125 L 414.730469 713.253906 L 676.746094 467.457031 C 719.320312 421.984375 735.175781 373.75 726.578125 320.039062 C 714.058594 245.742188 650.320312 188.097656 571.582031 179.863281 C 523.289062 174.945312 476.640625 187.996094 440.230469 217.0625 C 430.433594 224.878906 421.671875 233.621094 414.039062 243.125 C 404.984375 232.304688 394.363281 222.410156 382.351562 213.636719 C 340.484375 183.074219 287.1875 171.140625 235.996094 180.375 C 187.511719 189.371094 143.988281 219.414062 116.566406 262.828125 Z M 116.566406 262.828125 " clipRule="nonzero"/></clipPath></defs>
                                <path d="M 262.617188 135 C 153.125 135 67.5 230.167969 67.5 342.761719 C 67.5 401.324219 76.871094 449.550781 111.808594 500.289062 C 145.140625 548.707031 200.574219 597.5625 286.582031 662.023438 L 405 742.5 L 523.410156 662.035156 C 609.421875 597.570312 664.859375 548.707031 698.191406 500.289062 C 733.128906 449.550781 742.5 401.324219 742.5 342.761719 C 742.5 230.167969 656.875 135 547.382812 135 C 492.441406 135 444.886719 157.382812 405 197.882812 C 365.113281 157.382812 317.554688 135 262.617188 135 Z M 262.617188 202.5 C 194.921875 202.5 135 262.761719 135 342.761719 C 135 361.289062 136.046875 377.578125 138.664062 392.597656 C 143.042969 417.757812 151.8125 439.363281 167.40625 462.015625 C 193.90625 500.503906 241.265625 543.710938 327.089844 608.03125 L 405 666.542969 L 482.910156 608.03125 C 568.734375 543.710938 616.097656 500.503906 642.597656 462.015625 C 667.496094 425.84375 675 392.328125 675 342.761719 C 675 262.761719 615.078125 202.5 547.382812 202.5 C 505.679688 202.5 467.441406 222.285156 432.113281 269.941406 C 425.746094 278.53125 415.6875 283.59375 405 283.59375 C 394.3125 283.59375 384.253906 278.53125 377.886719 269.941406 C 342.558594 222.285156 304.320312 202.5 262.617188 202.5 Z M 262.617188 202.5 " fillOpacity="1" fillRule="evenodd"/>
                                <g clipPath="url(#6c326d0963)"><g clipPath="url(#54e3de31d4)">
                                    <path d="M 91.285156 177.246094 L 729.890625 177.246094 L 729.890625 713.253906 L 91.285156 713.253906 Z M 91.285156 177.246094 " fillOpacity="1" fillRule="nonzero"/></g></g>
                            </svg>
                            <p className="text-sm text-accent-red">{post.likeIds.length}</p>
                        </div>
                    ) :
                        <div className="flex flex-row gap-2 cursor-pointer text-text-secondary fill-text-secondary hover:fill-accent-red hover:text-accent-red duration-75 ease-in"
                             onClick={() => {handleLike(post.id, loggedInUser, posts, setPosts);}}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.78125 4C4.53699 4 2 6.81981 2 10.1559C2 11.8911 2.27768 13.32 3.31283 14.8234C4.3005 16.258 5.9429 17.7056 8.49134 19.6155L12 22L15.5084 19.6158C18.057 17.7058 19.6995 16.258 20.6872 14.8234C21.7223 13.32 22 11.8911 22 10.1559C22 6.81982 19.463 4 16.2188 4C14.5909 4 13.1818 4.66321 12 5.86323C10.8182 4.66321 9.40906 4 7.78125 4ZM7.78125 6C5.77551 6 4 7.7855 4 10.1559C4 10.7049 4.03107 11.1875 4.10853 11.6325C4.23826 12.378 4.49814 13.0182 4.96014 13.6893C5.74532 14.8297 7.14861 16.11 9.69156 18.0157L12 19.7494L14.3084 18.0157C16.8514 16.11 18.2547 14.8297 19.0399 13.6893C19.7777 12.6176 20 11.6245 20 10.1559C20 7.7855 18.2245 6 16.2188 6C14.9831 6 13.8501 6.58627 12.8033 7.99831C12.6147 8.25274 12.3167 8.40277 12 8.40277C11.6833 8.40277 11.3853 8.25274 11.1967 7.99831C10.1499 6.58627 9.01689 6 7.78125 6Z"/>
                            </svg>
                            <p className="text-sm">{post.likeIds.length}</p>
                        </div>
                    }
                </div>

                <div className="flex flex-row gap-3 mr-4">
                    {/* Bookmark (already bookmarked) */}
                    { loggedInUser && loggedInUser.bookmarks.indexOf(post.id) !== -1 ? (
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3 cursor-pointer"
                             onClick={() => {handleUnBookmark(post.id, loggedInUser, setUser);}}>
                            <svg className="fill-accent-blue" width="20px" height="20px" zoomAndPan="magnify" viewBox="0 0 810 809.999993" preserveAspectRatio="xMidYMid meet" version="1.0"><defs>
                                <clipPath id="42f0bbd39a"><path d="M 182.03125 162 L 628 162 L 628 600.941406 L 182.03125 600.941406 Z M 182.03125 162 " clipRule="nonzero"/></clipPath>
                                <clipPath id="e1a312a0d5"><path d="M 220.28125 162 L 589.71875 162 C 599.863281 162 609.59375 166.03125 616.765625 173.203125 C 623.9375 180.375 627.96875 190.105469 627.96875 200.25 L 627.96875 562.691406 C 627.96875 572.835938 623.9375 582.5625 616.765625 589.738281 C 609.59375 596.910156 599.863281 600.941406 589.71875 600.941406 L 220.28125 600.941406 C 210.136719 600.941406 200.40625 596.910156 193.234375 589.738281 C 186.0625 582.5625 182.03125 572.835938 182.03125 562.691406 L 182.03125 200.25 C 182.03125 190.105469 186.0625 180.375 193.234375 173.203125 C 200.40625 166.03125 210.136719 162 220.28125 162 Z M 220.28125 162 " clipRule="nonzero"/></clipPath>
                                <clipPath id="c7ae287a16"><path d="M 167 480 L 381 480 L 381 726 L 167 726 Z M 167 480 " clipRule="nonzero"/></clipPath>
                                <clipPath id="37cce30e0d"><path d="M 167.933594 480.6875 L 381.085938 598.109375 L 278.492188 784.34375 L 65.339844 666.921875 Z M 167.933594 480.6875 " clipRule="nonzero"/></clipPath>
                                <clipPath id="8d262d0206"><path d="M 171.757812 725.546875 L 380.773438 597.9375 L 167.933594 480.6875 Z M 171.757812 725.546875 " clipRule="nonzero"/></clipPath>
                                <clipPath id="951f95fecf"><path d="M 423 479 L 636 479 L 636 725 L 423 725 Z M 423 479 " clipRule="nonzero"/></clipPath>
                                <clipPath id="20ec417e27"><path d="M 423.480469 598.828125 L 635.613281 479.574219 L 739.808594 664.921875 L 527.671875 784.171875 Z M 423.480469 598.828125 " clipRule="nonzero"/></clipPath>
                                <clipPath id="8b8040f67b"><path d="M 633.585938 724.632812 L 635.304688 479.75 L 423.480469 598.828125 Z M 633.585938 724.632812 " clipRule="nonzero"/></clipPath></defs>
                                <path d="M 330.34375 101.25 L 479.65625 101.25 C 507.28125 101.25 530.082031 101.25 548.644531 102.789062 C 567.925781 104.390625 585.640625 107.828125 602.230469 116.449219 C 626.890625 129.257812 646.996094 149.363281 659.800781 174.019531 C 668.417969 190.609375 671.859375 208.324219 673.460938 227.609375 C 675 246.171875 675 268.96875 675 296.59375 L 675 594.765625 C 675 627.261719 675 653.921875 673.222656 674.1875 C 671.539062 693.285156 667.839844 715.796875 652.996094 732.089844 C 634.753906 752.109375 608.015625 762.15625 581.109375 759.101562 C 559.207031 756.613281 541.597656 742.109375 527.753906 728.839844 C 513.074219 714.769531 495.515625 694.699219 474.117188 670.246094 L 461.386719 655.695312 C 446.722656 638.933594 437.132812 628.023438 429.1875 620.394531 C 421.492188 613.003906 417.84375 611.234375 416.007812 610.601562 C 408.875 608.140625 401.125 608.140625 393.992188 610.601562 C 392.15625 611.234375 388.507812 613.003906 380.8125 620.394531 C 372.867188 628.023438 363.277344 638.933594 348.613281 655.695312 L 335.882812 670.246094 C 314.484375 694.699219 296.925781 714.765625 282.242188 728.839844 C 268.402344 742.109375 250.792969 756.613281 228.890625 759.101562 C 201.984375 762.15625 175.246094 752.109375 157.007812 732.089844 C 142.160156 715.796875 138.457031 693.285156 136.78125 674.1875 C 135 653.921875 135 627.261719 135 594.765625 L 135 296.59375 C 135 268.96875 135 246.171875 136.539062 227.609375 C 138.140625 208.324219 141.578125 190.609375 150.199219 174.019531 C 163.007812 149.363281 183.113281 129.257812 207.769531 116.449219 C 224.359375 107.828125 242.074219 104.390625 261.359375 102.789062 C 279.921875 101.25 302.71875 101.25 330.34375 101.25 Z M 266.945312 170.058594 C 251.910156 171.308594 244.234375 173.570312 238.882812 176.347656 C 226.554688 182.753906 216.503906 192.804688 210.097656 205.132812 C 207.320312 210.484375 205.058594 218.160156 203.808594 233.195312 C 202.527344 248.632812 202.5 268.617188 202.5 298.011719 L 202.5 593.074219 C 202.5 627.675781 202.53125 651.335938 204.019531 668.277344 C 205.246094 682.21875 207.199219 686.597656 207.375 687.128906 C 210.84375 690.636719 215.671875 692.453125 220.59375 692.09375 C 221.074219 691.8125 225.429688 689.804688 235.53125 680.117188 C 247.808594 668.347656 263.410156 650.5625 286.195312 624.523438 L 298.753906 610.171875 C 312.21875 594.78125 323.738281 581.613281 334.0625 571.703125 C 344.878906 561.320312 356.84375 552.011719 371.972656 546.792969 C 393.375 539.410156 416.625 539.410156 438.027344 546.792969 C 453.15625 552.011719 465.121094 561.320312 475.9375 571.703125 C 486.261719 581.613281 497.78125 594.78125 511.25 610.171875 L 523.804688 624.523438 C 546.589844 650.5625 562.195312 668.347656 574.46875 680.117188 C 584.570312 689.804688 588.925781 691.8125 589.40625 692.09375 C 594.328125 692.453125 599.15625 690.636719 602.625 687.128906 C 602.796875 686.597656 604.753906 682.21875 605.976562 668.277344 C 607.46875 651.335938 607.5 627.675781 607.5 593.074219 L 607.5 298.011719 C 607.5 268.617188 607.472656 248.632812 606.191406 233.195312 C 604.941406 218.160156 602.679688 210.484375 599.898438 205.132812 C 593.496094 192.804688 583.441406 182.753906 571.113281 176.347656 C 565.765625 173.570312 558.089844 171.308594 543.054688 170.058594 C 527.617188 168.777344 507.632812 168.75 478.238281 168.75 L 331.761719 168.75 C 302.367188 168.75 282.382812 168.777344 266.945312 170.058594 Z M 266.945312 170.058594 " fill-opacity="1" fill-rule="nonzero"/><g clip-path="url(#42f0bbd39a)"><g clip-path="url(#e1a312a0d5)">
                                    <path d="M 182.03125 162 L 627.828125 162 L 627.828125 600.941406 L 182.03125 600.941406 Z M 182.03125 162 " fill-opacity="1" fill-rule="nonzero"/></g></g><g clip-path="url(#c7ae287a16)"><g clip-path="url(#37cce30e0d)"><g clip-path="url(#8d262d0206)">
                                    <path d="M 167.933594 480.6875 L 381.085938 598.109375 L 278.492188 784.34375 L 65.339844 666.921875 Z M 167.933594 480.6875 " fill-opacity="1" fill-rule="nonzero"/></g></g></g><g clip-path="url(#951f95fecf)"><g clip-path="url(#20ec417e27)"><g clip-path="url(#8b8040f67b)">
                                    <path d="M 423.480469 598.828125 L 635.613281 479.574219 L 739.808594 664.921875 L 527.671875 784.171875 Z M 423.480469 598.828125 " fill-opacity="1" fill-rule="nonzero"/></g></g></g>
                            </svg>
                        </div>
                    ) :
                        <div className="fill-text-secondary duration-75 ease-in hover:text-accent-blue-light hover:fill-accent-blue-light flex flex-row gap-3 cursor-pointer"
                             onClick={() => {handleBookmark(post.id, loggedInUser, setUser);}}>
                            <svg width="20px" height="20px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M9.78799 3H14.212C15.0305 2.99999 15.7061 2.99998 16.2561 3.04565C16.8274 3.0931 17.3523 3.19496 17.8439 3.45035C18.5745 3.82985 19.1702 4.42553 19.5497 5.1561C19.805 5.64774 19.9069 6.17258 19.9544 6.74393C20 7.29393 20 7.96946 20 8.78798V17.6227C20 18.5855 20 19.3755 19.9473 19.9759C19.8975 20.5418 19.7878 21.2088 19.348 21.6916C18.8075 22.2847 18.0153 22.5824 17.218 22.4919C16.5691 22.4182 16.0473 21.9884 15.6372 21.5953C15.2022 21.1783 14.6819 20.5837 14.0479 19.8591L13.6707 19.428C13.2362 18.9314 12.9521 18.6081 12.7167 18.3821C12.4887 18.1631 12.3806 18.1107 12.3262 18.0919C12.1148 18.019 11.8852 18.019 11.6738 18.0919C11.6194 18.1107 11.5113 18.1631 11.2833 18.3821C11.0479 18.6081 10.7638 18.9314 10.3293 19.428L9.95209 19.8591C9.31809 20.5837 8.79784 21.1782 8.36276 21.5953C7.95272 21.9884 7.43089 22.4182 6.78196 22.4919C5.9847 22.5824 5.19246 22.2847 4.65205 21.6916C4.21218 21.2088 4.10248 20.5418 4.05275 19.9759C3.99997 19.3755 3.99998 18.5855 4 17.6227V8.78799C3.99999 7.96947 3.99998 7.29393 4.04565 6.74393C4.0931 6.17258 4.19496 5.64774 4.45035 5.1561C4.82985 4.42553 5.42553 3.82985 6.1561 3.45035C6.64774 3.19496 7.17258 3.0931 7.74393 3.04565C8.29393 2.99998 8.96947 2.99999 9.78799 3ZM7.90945 5.03879C7.46401 5.07578 7.23663 5.1428 7.07805 5.22517C6.71277 5.41493 6.41493 5.71277 6.22517 6.07805C6.1428 6.23663 6.07578 6.46401 6.03879 6.90945C6.0008 7.36686 6 7.95898 6 8.83V17.5726C6 18.5978 6.00094 19.2988 6.04506 19.8008C6.08138 20.2139 6.13928 20.3436 6.14447 20.3594C6.2472 20.4633 6.39033 20.5171 6.53606 20.5065C6.55034 20.4981 6.67936 20.4386 6.97871 20.1516C7.34245 19.8029 7.80478 19.2759 8.4799 18.5044L8.85192 18.0792C9.25094 17.6232 9.59229 17.233 9.89819 16.9393C10.2186 16.6317 10.5732 16.3559 11.0214 16.2013C11.6555 15.9825 12.3445 15.9825 12.9786 16.2013C13.4268 16.3559 13.7814 16.6317 14.1018 16.9393C14.4077 17.233 14.7491 17.6232 15.1481 18.0792L15.5201 18.5044C16.1952 19.2759 16.6576 19.8029 17.0213 20.1516C17.3206 20.4386 17.4497 20.4981 17.4639 20.5065C17.6097 20.5171 17.7528 20.4633 17.8555 20.3594C17.8607 20.3436 17.9186 20.2139 17.9549 19.8008C17.9991 19.2988 18 18.5978 18 17.5726V8.83C18 7.95898 17.9992 7.36686 17.9612 6.90945C17.9242 6.46401 17.8572 6.23663 17.7748 6.07805C17.5851 5.71277 17.2872 5.41493 16.9219 5.22517C16.7634 5.1428 16.536 5.07578 16.0905 5.03879C15.6331 5.0008 15.041 5 14.17 5H9.83C8.95898 5 8.36686 5.0008 7.90945 5.03879Z"
                                />
                            </svg>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}