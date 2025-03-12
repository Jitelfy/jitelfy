export interface Post {
    id: string;
    userid: string;
    parentid: string;
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
    reposts:   string[];
    token: string;
}

export interface PackagedPost {
    post: Post;
    user: User;
}

export interface Alert {
    AlerterId: string;
    postid: string;
    created_at: string;
    type: string;
    message: string;
}

export interface UserAlerts {
    id: string;
    userid: string;
    alerts: Alert[];
}

export interface PackagedUserAlert {
    AlerterId: string;
    postid: string;
    created_at: string;
    type: string;
    message: string;
    user: User;
    post: Post;
}


