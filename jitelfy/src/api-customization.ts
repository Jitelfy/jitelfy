/*
    For server POST, GET, etc. requests corresponding to customization.
 */

import {User} from "./types";
import {BASE_URL} from "./api";

/**
 * Changes the logged-in user's display name.
 * @param newName the new name to change to
 * @param user the currently logged-in user
 */
export async function requestCustomizeDisplayName(newName: string, user: User): Promise<any> {
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
    return response.ok;
}

/**
 * Changes the logged-in user's biography.
 * @param newBio the new biography to change to
 * @param user the currently logged-in user
 */
export async function requestCustomizeBio(newBio: string, user: User): Promise<any> {
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
    return response.ok;
}

/**
 * Changes the logged-in user's profile song.
 * @param newSong the new song to change to
 * @param user the currently logged-in user
 */
export async function requestCustomizeSong(newSong: string, user: User): Promise<any> {
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
    return response.ok;
}

/**
 * Changes the logged-in user's banner.
 * @param newBanner the new banner to change to
 * @param user the currently logged-in user
 */
export async function requestCustomizeBanner(newBanner: number, user: User): Promise<any> {
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
    return response.ok;
}

/**
 * Changes the logged-in user's icon.
 * @param newIcon the new icon to change to
 * @param user the currently logged-in user
 */
export async function requestCustomizeIcon(newIcon: number, user: User): Promise<any> {
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
    return response.ok;
}