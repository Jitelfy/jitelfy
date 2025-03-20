import {PackagedPost, PackagedUserAlert, Post, User, UserAlerts} from './types';

export const BASE_URL = "http://localhost:8080";

export async function getContent(path: string): Promise<string> {
  const content = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  return content.text();
}

export async function getPosts(): Promise<PackagedPost[]> {
  const response = await getContent("/posts/top");
  return JSON.parse(response);
}

export async function getPostsByUser(userID: string): Promise<PackagedPost[]> {
  const response = await getContent("/posts/from?userid=" + userID);
  return JSON.parse(response);
}

export async function getUser(path: string): Promise<User> {
  const response = await getContent("/users/" + path);
  return JSON.parse(response);
}

export async function getUserActivity(): Promise<PackagedUserAlert[]> {
  const response = await getContent("/users/alerts");
  return JSON.parse(response);
}

export async function RestoreUser(): Promise<User> {
  const response = await getContent("/users/restore");
  return JSON.parse(response);
}

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

export async function followUser(userId: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/users/follow/${userId}`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}

export async function unfollowUser(userId: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/users/unfollow/${userId}`, {
    method: "POST",
    credentials: "include",
  });

  return response.json();
}

export async function requestDeletePost(id: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/posts?id=${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });
  return response.ok;
}

export async function getSongOfTheDay(): Promise<{ song: string; lastUpdated: string }> {
  const response = await getContent("/sotd");
  return JSON.parse(response);
}

export async function requestThreadPlaylist(parentId: string, user: User, title: string, desc: string, pub: boolean): Promise<string> {
  const tpData = {
    id: parentId,
    name: title,
    description: desc,
    public: pub
  }

  const response = await fetch(`${BASE_URL}/spotify/tp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + user.token },
    body: JSON.stringify(tpData),
    credentials: "include"
  });

  return response.json();
}

export const handleThreadPlaylist = async(parentId: string, user: User | null) => {
  if (!user) return;

  const title = "Jitelfy Thread Playlist";
  const desc = "A thread playlist made with Jitelfy.";

  const response = await requestThreadPlaylist(parentId, user, title, desc, true);
};

export const handleLike = async (postId: string, user: User | null, posts: Array<PackagedPost>, setPosts: (p: Array<PackagedPost>) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/like/${postId}`, {
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
    const response = await fetch(`${BASE_URL}/posts/unlike/${postId}`, {
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
    const response = await fetch(`${BASE_URL}/posts/repost/${postId}`, {
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
    const response = await fetch(`${BASE_URL}/posts/unrepost/${postId}`, {
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
  const response = await requestDeletePost(id);
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

  {/* Mock decrease the comment number so we don't have to reload */}
  if (parentPost) {
    const commentText = document.getElementById("commentNum" + parentPost.id);
    if (commentText && commentText.textContent) commentText.textContent = (parseInt(commentText.textContent) - 1).toString(10);
  }
};

export const handleBookmark = async (postId: string, user: User | null, setUser: (u: User) => any) => {
  if (!user) return;
  try {
    const response = await fetch(`${BASE_URL}/posts/bookmark/${postId}`, {
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
    const response = await fetch(`${BASE_URL}/posts/unbookmark/${postId}`, {
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