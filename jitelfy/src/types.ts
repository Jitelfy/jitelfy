export interface Post {
    id: string;
    userid: string;
    parentId: string;
    childIds: string[];
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
    icon: string;
    following: string[];
    followers: string[];
    token: string;
  }
  
  export interface PackagedPost {
    post: Post;
    user: User;
  }
