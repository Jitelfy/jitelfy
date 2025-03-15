import {useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { User } from '../types';
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import * as API from "../api";
import {BASE_URL, getUser} from "../api";

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


const handleIconClick = async (imgID: string) => {
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

const handleBannerClick = async (banID: string) => {
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
    }
};

const handleChangeBanner = async (banner: number, user: User) => {
    if (!user) return; // Ensure user exists

    if (banner != user?.banner) {
        let response = await requestCustomizeBanner(banner, user);
    }
};

const handleChangeDisplayName = async (newName: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newName.length > 0 && newName.length <= 40 && newName != user?.displayname) {
        let response = await requestCustomizeDisplayName(newName, user);
    }
};

const handleChangeBio = async (newBio: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newBio != null && newBio.length <= 250 && newBio != user?.bio) {
        let response = await requestCustomizeBio(newBio, user);
    }
};

const handleChangeSong = async (newSong: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newSong != null && newSong != user?.song) {
        let response = await requestCustomizeSong(newSong, user);
    }
};

const SettingsPage = () => {
    const { user, setUser } = useContext(UserContext);

    const [userData, setUserData] = useState<User | null>(null);
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

        const getUserData = async () => {
            if (!user) return;

            const loggedInUser: User = await API.getUser(user.id);
            if (loggedInUser.id != null) {
                setUserData(loggedInUser);
            }
        };

        if (user == null) {
            restore();
        }
        getUserData();

        NewIcon = -1;
        NewBanner = -1;

        const SelectedIcon = (userData && userData.icon) || 0;
        const SelectedBanner = (userData && userData.banner) || 0;

        handleBannerClick(SelectedBanner.toString(10));
        handleIconClick(IconArray[SelectedIcon]);
  }, [user]);

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

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 px-20 overflow-auto hide-scrollbar flex-col">
                <div className="fixed z-20 bg-background-main opacity-95 w-full">
                    <h1 className="text-white text-2xl top-0 my-6">Settings</h1>
                </div>

                <div className="mt-20">
                    {/* Display name changer */}
                    <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                        <div className="flex flex-row items-baseline w-full justify-between">
                            <h2 className="text-text-main text-lg">Display name</h2>
                            <p id="showDisplaynameSaved" className="invisible text-accent-green text-sm mr-10">Saved!</p>
                        </div>

                        <div className="flex flex-row w-full mt-2 gap-4">
                            <input
                                type="text"
                                value={newDisplayName}
                                onChange={(e) => setNewDisplayName(e.target.value)}
                                placeholder={user?.displayname || "What should others call you?"}
                                className="w-full p-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
                                maxLength={40}
                            />

                            <button className="w-1/4"
                                    onClick={() => {
                                        handleChangeDisplayName(newDisplayName, user);
                                        const label = document.getElementById("showDisplaynameSaved");
                                        if (label) label.style.visibility = "visible";

                                        const userDN = document.getElementById("userDisplayname");
                                        if (userDN) userDN.textContent = newDisplayName;

                                        user.displayname = newDisplayName;
                                        setUser(user);
                                    }}>
                                <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                    Save
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Bio changer */}
                    <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                        <div className="flex flex-row items-baseline w-full justify-between">
                            <h2 className="text-text-main text-lg">Biography</h2>
                            <p id="showBioSaved" className="invisible text-accent-green text-sm mr-10">Saved!</p>
                        </div>

                        <textarea
                            placeholder={userData && userData.bio || "What are you all about?"}
                            value={newBio}
                            onChange={(e) => setNewBio(e.target.value)}
                            rows={3}
                            maxLength={160}
                            className="resize-none whitespace-pre-wrap bg-background-main w-full mt-2 text-text-main rounded-lg border border-background-tertiary p-2 focus:outline-none focus:ring-2 focus:ring-accent-blue"
                        >
                        </textarea>

                        <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                        <button className="w-1/4 self-end"
                                onClick={() => {
                                    handleChangeBio(newBio, user);
                                    const label = document.getElementById("showBioSaved");
                                    if (label) label.style.visibility = "visible";
                                }}>
                            <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                Save
                            </p>
                        </button>
                    </div>

                    {/* Profile picture selector */}
                    <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md gap-3">

                        <div className="flex flex-row items-baseline w-full justify-between">
                            <h2 className="text-text-main text-lg">Profile icon</h2>
                            <p id="showIconSaved" className="invisible text-accent-green text-sm mr-10">Saved!</p>
                        </div>

                        {/* Container for default icons */}
                        <div id="iconContainer"
                             className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                            {IconArray.map((imgIndex) => (
                                <img
                                    id={imgIndex}
                                    src={imgIndex}
                                    alt="Default"
                                    width = "140px"
                                    height = "140px"
                                    className="p-3 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                                    onClick={() => handleIconClick(imgIndex)}
                                />
                            ))}

                        </div>

                        <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                        <button className="w-1/4 self-end"
                                onClick={() => {
                                    handleChangeIcon(NewIcon, user);
                                    const label = document.getElementById("showIconSaved");
                                    if (label) label.style.visibility = "visible"

                                    const userIcon = document.getElementById("userIcon");
                                    if (userIcon) userIcon.setAttribute("src", IconArray[NewIcon]);

                                    user.icon = NewIcon;
                                    setUser(user);
                                }}>
                            <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                Save
                            </p>
                        </button>
                    </div>

                    {/* Profile banner selector */}
                    <div className="flex flex-col items-start bg-background-secondary mt-10 p-4 rounded-md gap-3">
                        <div className="flex flex-row items-baseline w-full justify-between">
                            <h2 className="text-text-main text-lg">Profile banner</h2>
                            <p id="showBannerChanged" className="invisible text-accent-green text-sm mr-10">Saved!</p>
                        </div>

                        {/* Container for banner colours */}
                        <div id="bannerContainer"
                             className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar justify-evenly rounded-mb">

                            {BannerArray.map((color) => (
                                <svg height="140" width="140"
                                     id={BannerArray.indexOf(color).toString(10)}
                                     className="p-3 rounded-lg bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                                     onClick={() => handleBannerClick(BannerArray.indexOf(color).toString(10))}>
                                    <rect width="110" height="110" x="3" y="3" rx="10" ry="10" fill={color} />
                                </svg>
                            ))}

                        </div>

                        <hr className="border-1 border-background-tertiary w-full my-3"></hr>

                        <button className="w-1/4 self-end"
                                onClick={() => {
                                    handleChangeBanner(NewBanner, user);
                                    const label = document.getElementById("showBannerChanged");
                                    if (label) label.style.visibility = "visible";
                                }}>
                            <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                Save
                            </p>
                        </button>

                    </div>


                    {/* Profile song changer */}
                    <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                        <div className="flex flex-row items-baseline w-full justify-between">
                            <h2 className="text-text-main text-lg">Profile song</h2>
                            <p id="showSongChanged" className="invisible text-accent-green text-sm mr-10">Saved!</p>
                        </div>

                        <div className="flex flex-row w-full mt-2 gap-4">
                            <input
                                type="url"
                                value={newProfileSong}
                                onChange={(e) => setNewProfileSong(e.target.value)}
                                placeholder={user?.song || "What song best represents you?"}
                                className="w-full p-3 border border-background-tertiary rounded-lg text-text-main bg-background-main focus:outline-none focus:ring-2 focus:ring-accent"
                            />

                            <button className="w-1/4"
                                    onClick={() => {
                                        handleChangeSong(newProfileSong, user);
                                        const label = document.getElementById("showSongChanged");
                                        if (label) label.style.visibility = "visible";
                                    }}>
                                <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                                    Save
                                </p>
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* Sidebar - Right */}
            {FriendActivity(user)}
        </div>
    );
};

export default SettingsPage;
