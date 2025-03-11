import {useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { User } from '../types';
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import * as API from "../api";
import {BASE_URL} from "../api";

let NewIcon = -1;
let NewBanner = -1;

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


const handleIconClick = async (imgID: string, user: User) => {
    const img = document.getElementById(imgID);
    if (img != null) {
        const iconIndex = IconArray.indexOf(img.id);

        if (NewIcon != iconIndex) {
            { /* Unselect the old new icon */ }
            let oldImg = document.getElementById(IconArray[NewIcon]);
            if (oldImg != null) {
                oldImg.style.padding = "0.75rem"
                oldImg.style.border = "none";
            }

            { /* Select the new icon */ }
            NewIcon = iconIndex;
            img.style.padding = "0.63rem"
            img.style.border = "2px solid #3354c8";
        }
    }
};

const handleBannerClick = async (banID: string, user: User) => {
    const ban = document.getElementById(banID);

    if (ban != null) {
        if (NewBanner != parseInt(banID)) {
            { /* Unselect the old new icon */ }
            let oldBan = document.getElementById(NewBanner.toString(10));
            if (oldBan != null) {
                oldBan.style.padding = "0.75rem";
                oldBan.style.border = "none";
            }

            { /* Select the new banner */ }
            NewBanner = parseInt(banID);
            ban.style.padding = "0.63rem"
            ban.style.border = "2px solid #3354c8";
        }
    }
};

const handleChangeIcon = async (icon: number, user: User) => {
    if (!user) return; // Ensure user exists

    if (icon != user?.icon) {
        let response = await requestCustomizeIcon(icon, user);
        if (response) window.location.reload();
    }
};

const handleChangeBanner = async (banner: number, user: User) => {
    if (!user) return; // Ensure user exists

    if (banner != user?.banner) {
        let response = await requestCustomizeBanner(banner, user);
        if(response) window.location.reload();
    }
};

const handleChangeDisplayName = async (newName: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newName.length > 0 && newName != user?.displayname) {
        let response = await requestCustomizeDisplayName(newName, user);
        if (response) window.location.reload();
    }
};

const handleChangeBio = async (newBio: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newBio != null && newBio != user?.bio) {
        let response = await requestCustomizeBio(newBio, user);
        if (response) window.location.reload();
    }
};

const handleChangeSong = async (newSong: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newSong != null && newSong != user?.song) {
        let response = await requestCustomizeSong(newSong, user);
        if (response) window.location.reload();
    }
};

const SettingsPage = () => {
    const { user, setUser } = useContext(UserContext);

    const [newDisplayName, setNewDisplayName] = useState("");
    const [newBio, setNewBio] = useState("");
    const [newProfileSong, setNewProfileSong] = useState("");

    useEffect(() => {
        const restore = async () => {
            const loggedInUser: User = await API.RestoreUser();
            if (loggedInUser.id != null) {
                setUser(loggedInUser);
            }

        };

        if (user == null) {
            restore();
        }
  });

    if (user == null) {
        return (
            <div className="h-screen bg-background-main flex">
                {/* Sidebar - Left */}
                {Quicklinks(user!)}
                <div className="flex-1 bg-background-main p-6 overflow-auto">
                    <div className="relative w-full">
                    </div>
                </div>
                {/* Sidebar - Right */}
                {FriendActivity(user)}
            </div>
        );
    }

    const SelectedIcon = user?.icon;
    const SelectedBanner = user?.banner;
    NewIcon = -1;
    NewBanner = -1;

    return (
        <div className="h-screen bg-background-main flex"
             onLoad={() => handleBannerClick(SelectedBanner.toString(10), user)}>
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 px-20 overflow-auto hide-scrollbar flex-col">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6">Settings</h1>
                </div>

                {/* Display name changer */}
                <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                    <h2 className=" text-text-main text-lg">Display name</h2>

                    <div className="flex flex-row w-full mt-2 gap-4">
                        <input
                            type="text"
                            value={newDisplayName}
                            onChange={(e) => setNewDisplayName(e.target.value)}
                            placeholder={user?.displayname || "What should others call you?"}
                            className="w-full p-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
                        />

                        <button className="w-1/4"
                                onClick={() => handleChangeDisplayName(newDisplayName, user)}>
                            <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                Save
                            </p>
                        </button>
                    </div>
                </div>

                {/* Bio changer */}
                <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                    <h2 className=" text-text-main text-lg">Biography</h2>

                    <textarea
                        placeholder={user?.bio || "What are you all about?"}
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        rows={3}
                        className="resize-none whitespace-pre-wrap bg-background-main w-full mt-2 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                    >
                    </textarea>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    <button className="w-1/4 self-end"
                            onClick={() => handleChangeBio(newBio, user)}>
                        <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                            Save
                        </p>
                    </button>
                </div>

                {/* Profile picture selector */}
                <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">
                    <h2 className=" text-text-main text-lg">Profile picture</h2>

                    {/* Container for default icons */}
                    <div id="iconContainer"
                         onLoad={() => handleIconClick(IconArray[SelectedIcon], user)}
                         className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                        {IconArray.map((imgIndex) => (
                            <img
                                id={imgIndex}
                                src={imgIndex}
                                alt="Default"
                                width = "140px"
                                height = "140px"
                                className="p-3 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                                onClick={() => handleIconClick(imgIndex, user)}
                            />
                        ))}

                    </div>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    <button className="w-1/4 self-end"
                            onClick={() => handleChangeIcon(NewIcon, user)}>
                        <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                            Save
                        </p>
                    </button>
                </div>

                {/* Profile banner selector */}
                <div className="flex flex-col items-start bg-background-secondary mt-10 p-4 rounded-md gap-3">
                    <h2 className=" text-text-main text-lg">Profile banner</h2>

                    {/* Container for banner colours */}
                    <div id="bannerContainer"
                         onLoad={() => handleBannerClick(SelectedBanner.toString(10), user)}
                         className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                        {BannerArray.map((color) => (
                            <svg height="140" width="140"
                                 id={BannerArray.indexOf(color).toString(10)}
                                 className="p-3 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                                 onClick={() => handleBannerClick(BannerArray.indexOf(color).toString(10), user)}
                            >
                                <rect width="110" height="110" x="3" y="3" rx="10" ry="10" fill={color} />
                            </svg>
                        ))}

                    </div>

                    <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                    <button className="w-1/4 self-end"
                            onClick={() => handleChangeBanner(NewBanner, user)}>
                        <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                            Save
                        </p>
                    </button>

                </div>


                {/* Profile song changer */}
                <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                    <h2 className=" text-text-main text-lg">Profile song</h2>

                    <div className="flex flex-row w-full mt-2 gap-4">
                        <input
                            type="url"
                            value={newProfileSong}
                            onChange={(e) => setNewProfileSong(e.target.value)}
                            placeholder={user?.song || "What song best represents you?"}
                            className="w-full p-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
                        />

                        <button className="w-1/4"
                                onClick={() => handleChangeSong(newProfileSong, user)}>
                            <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                Save
                            </p>
                        </button>
                    </div>
                </div>

            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default SettingsPage;
