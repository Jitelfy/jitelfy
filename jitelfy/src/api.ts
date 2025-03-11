import { PackagedPost, Post, User } from './types';

export const BASE_URL = "http://localhost:8080";

export async function getContent(path: string): Promise<string> {
  const content = await fetch(`${BASE_URL}${path}`, { credentials: "include" });
  return content.text();
}

export async function getPosts(): Promise<PackagedPost[]> {
  const response = await getContent("/posts/top");
  return JSON.parse(response);
}

export async function getUser(path: string): Promise<User> {
  const response = await getContent("/users/" + path);
  return JSON.parse(response);
}

export async function RestoreUser(): Promise<User> {
  const response = await getContent("/users/restore");
  return JSON.parse(response);
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

export async function getNotifications(): Promise<any> {
  const response = await fetch(`${BASE_URL}/users/alerts`, {
    method: "GET",
    credentials: "include",
  });

  return response.json();
}

export async function customizeDisplayName(newName: string, user: User): Promise<any> {
  const nameData = {
    displayname: newName
  };

  const response = await fetch(`${BASE_URL}/customize/displayname`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + user?.token
    },
    body: JSON.stringify(nameData),
    credentials: "include",
  });
  return response.json();
}

export async function customizeBio(newBio: string, user: User): Promise<any> {
  const bioData = {
    bio: newBio
  };

  const response = await fetch(`${BASE_URL}/customize/bio`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + user?.token
    },
    body: JSON.stringify(bioData),
    credentials: "include",
  });
  return response.json();
}

export async function customizeSong(newSong: string, user: User): Promise<any> {
  const songData = {
    song: newSong
  };

  const response = await fetch(`${BASE_URL}/customize/favsong`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + user?.token
    },
    body: JSON.stringify(songData),
    credentials: "include",
  });

  return response.json();
}

export async function customizeBanner(newBanner: number, user: User): Promise<any> {
  const bannerData = {
    banner: newBanner
  };

  const response = await fetch(`${BASE_URL}/customize/banner`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + user?.token
    },
    body: JSON.stringify(bannerData),
    credentials: "include",
  });

  return response.json();
}

export async function customizeIcon(newIcon: number, user: User): Promise<any> {
  const iconData = {
    icon: newIcon
  };

  const response = await fetch(`${BASE_URL}/customize/icon`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + user?.token
    },
    body: JSON.stringify(iconData),
    credentials: "include",
  });

  return response.json();
}

