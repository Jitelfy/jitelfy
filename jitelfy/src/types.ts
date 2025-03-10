export interface Post {
    id: string;
    userid: string;
    parentId: string;
    childids: number;
    likeIds: string[];
    time: string;
    text: string;
    embed: string;
    song: string;
}

export interface User {
    id: string;
    displayname: string;
    username: string;
    icon: number;
    banner: number;
    bio: string;
    song: string;
    following: string[];
    followers: string[];
    bookmarks: string[];
    token: string;
}

export interface PackagedPost {
    post: Post;
    user: User;
}
