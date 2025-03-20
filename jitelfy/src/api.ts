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
    credentials: "include"
  });

  return response.json();
}

export async function requestThreadPlaylist(parentId: string, title: string, desc: string, pub: boolean): Promise<string> {
  const tpData = {
    id: parentId,
    name: title,
    description: desc,
    public: pub
  }

  const response = await fetch(`${BASE_URL}/spotify/tp`, {
    method: "POST",
    body: JSON.stringify(tpData),
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