import { PackagedPost, Post, User } from './types';

export const BASE_URL = "https://mafjre94nh.execute-api.us-west-2.amazonaws.com";

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
