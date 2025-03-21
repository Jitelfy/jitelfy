/*
    For server POST, GET, etc. requests.
 */

import {PackagedPost, PackagedUserAlert, Post, User, UserAlerts} from './types';

export const BASE_URL = "http://localhost:8080";

/**
 * Gets content (without a header)
 * @param path the path to request from the server
 */
export async function getContent(path: string): Promise<string> {
  const content = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  return content.text();
}

/**
 * Gets all top-level (parent) posts.
 */
export async function getPosts(): Promise<PackagedPost[]> {
  const response = await getContent("/posts/top");
  return JSON.parse(response);
}

/**
 * Gets all posts from a user.
 * @param userID the ID of the user to get posts from
 */
export async function getPostsByUser(userID: string): Promise<PackagedPost[]> {
  const response = await getContent("/posts/from?userid=" + userID);
  return JSON.parse(response);
}

/**
 * Gets user data of a user.
 * @param userID the ID of the user
 */
export async function getUser(userID: string): Promise<User> {
  const response = await getContent("/users/" + userID);
  return JSON.parse(response);
}

/**
 * Gets the current logged-in user's activity.
 */
export async function getUserActivity(): Promise<PackagedUserAlert[]> {
  const response = await getContent("/users/alerts");
  return JSON.parse(response);
}

/**
 * Restores the user's context.
 */
export async function RestoreUser(): Promise<User> {
  const response = await getContent("/users/restore");
  return JSON.parse(response);
}

/**
 * Attempts to link the logged-in user with Spotify.
 */
export async function linkWithSpotify(): Promise<void> {
  const response = await fetch(`${BASE_URL}/spotify/sauth`, {
    method: "GET",
    headers: { "SameSite": "None",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization",
              "Access-Control-Allow-Credentials": "true"},
    credentials: "include"
  });

  return response.json();
}

/**
 * Follows a given user.
 * @param userID the ID of the user to follow
 */
export async function followUser(userID: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/users/follow/${userID}`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}

/**
 * Unfollows a given user.
 * @param userID the ID of the user to unfollow
 */
export async function unfollowUser(userID: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/users/unfollow/${userID}`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}

/**
 * Attempts to delete a given post.
 * @param postID the ID of the post to delete
 */
export async function requestDeletePost(postID: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/posts?id=${postID}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return response.ok;
}

/**
 * Gets the current Song of the Day (SOTD).
 */
export async function getSongOfTheDay(): Promise<{ song: string; lastUpdated: string }> {
  const response = await getContent("/sotd");
  return JSON.parse(response);
}

/**
 * Requests to create a Thread Playlist with the given top-level (parent) post.
 * @param parentID the ID of the top-level post
 * @param userID the logged-in user's ID
 * @param title the title of the Thread Playlist
 * @param desc the description of the Thread Playlist
 * @param pub whether the playlist is public or not
 */
export async function requestThreadPlaylist(parentID: string, userID: User, title: string, desc: string, pub: boolean): Promise<string> {
  const tpData = {
    id: parentID,
    name: title,
    description: desc,
    public: pub
  }

  const response = await fetch(`${BASE_URL}/spotify/tp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + userID.token },
    body: JSON.stringify(tpData),
    credentials: "include"
  });

  return response.json();
}

/**
 * Handles the thread playlist customization (before sending the request).
 * @param parentID the ID of the top-level (parent) post
 * @param user the currently logged-in user
 */
export const handleThreadPlaylist = async(parentID: string, user: User | null) => {
  if (!user) return;

  const title = "Jitelfy Thread Playlist";
  const desc = "A thread playlist made with Jitelfy.";

  const response = await requestThreadPlaylist(parentID, user, title, desc, true);
};

/**
 * Likes a post.
 * @param postID the ID of the post to like
 * @param user the currently logged-in user
 * @param posts an array of posts
 * @param setPosts a function to set the above array of posts
 */
export const handleLike = async (postID: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/like/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });

    if (response.ok) {
      setPosts(posts.map((post) => {
        if (post.post.id === postID) {
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

/**
 * Unlikes a post.
 * @param postID the ID of the post to like
 * @param user the currently logged-in user
 * @param posts an array of posts
 * @param setPosts a function to set the above array of posts
 */
export const handleUnlike = async (postID: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/unlike/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });
    if (response.ok) {
      setPosts(posts.map((post) => {
        if (post.post.id === postID) {
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


/**
 * Reposts a post.
 * @param postID the ID of the post to like
 * @param user the currently logged-in user
 * @param setUser a function to set the logged-in user
 */
export const handleRepost = async (postID: string, user: User | null, setUser: (u: User) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/repost/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });
    if (response.ok) {
      setUser({ ...user, reposts: [...user.reposts, postID] });
    }
  } catch (error) {
    console.error("Error reposting:", error);
  }
};

/**
 * Un-reposts a post.
 * @param postID the ID of the post to like
 * @param user the currently logged-in user
 * @param setUser a function to set the logged-in user
 */
export const handleUnRepost = async (postID: string, user: User | null, setUser: (u: User) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/unrepost/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });
    if (response.ok) {
      setUser({ ...user, reposts: user.reposts.filter((id) => id !== postID) });
    }
  } catch (error) {
    console.error("Error un-reposting:", error);
  }
};

/**
 * Handles a post delete request.
 * @param postID the ID of the post to delete
 * @param user the currently logged-in user
 * @param posts an array of posts
 * @param setPosts a function to set the above array of posts
 * @param parentPost the parent post of the post to delete (or null)
 */
export const handleDeletePost = async (postID: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any, parentPost: Post | null) => {
  if (!user) return; // ensure user exists
  const response = await requestDeletePost(postID);
  if (!response) {
    console.error("Failed to delete post");
    return;
  }

  // Remove the deleted post from state without refetching/reloading
  setPosts(posts.map((post) => {
    if (post.post.id === postID) {
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

  {/* Mock decrease the comment number so we don't have to reload */}
  if (parentPost) {
    const commentText = document.getElementById("commentNum" + parentPost.id);
    if (commentText && commentText.textContent) commentText.textContent = (parseInt(commentText.textContent) - 1).toString(10);
  }
};

/**
 * Bookmarks a post.
 * @param postID the ID of the post to bookmark
 * @param user the currently logged-in user
 * @param setUser a function to set the currently logged-in user
 */
export const handleBookmark = async (postID: string, user: User | null, setUser: (u: User) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/bookmark/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });

    if (response.ok) {
      const updatedUser = {...user, bookmarks: [...user.bookmarks, postID]};
      setUser(updatedUser);
    }
  }
  catch (error) {
    console.log("Error bookmarking post:", error);
  }
}

/**
 * Un-bookmarks a post.
 * @param postID the ID of the post to bookmark
 * @param user the currently logged-in user
 * @param setUser a function to set the currently logged-in user
 */
export const handleUnBookmark = async (postID: string, user: User | null, setUser: (u: User) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/unbookmark/${postID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + user.token
      },
      credentials: "include",
    });

    if (response.ok) {
      const updatedUser = { ...user, bookmarks: user.bookmarks.filter((id: string) => id !== postID) };
      setUser(updatedUser);
    }
  }
  catch (error) {
    console.log("Error bookmarking post:", error);
  }
}