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
  console.log(response);
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