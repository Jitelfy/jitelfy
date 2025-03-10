import {useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { User } from '../types.ts';
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import {BASE_URL, RestoreUser } from "../api";

let NewIcon = -1;
let NewBanner = -1;

const handleChangeIcon = async (icon: number, user: User) => {
    if (!user) return; // ensure user exists

    console.log("New icon will be of index " + icon);
    if (icon != user?.icon) {
        console.log("Sending request for icon change and reloading...");

        const iconData = {
            icon: icon
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

        if (!response.ok) {
            console.error("Failed to change icon", await response.text());
            return;
        }
        window.location.reload();
    }
};

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
    console.log("Handle banner click" + banID);
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

const handleChangeBanner = async (banner: number, user: User) => {
    if (!user) return; // ensure user exists

    console.log("New banner will be of index " + banner);
    if (banner != user?.banner) {
        console.log("Sending request for banner change and reloading...");

        const bannerData = {
            banner: banner
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

        if (!response.ok) {
            console.error("Failed to change banner", await response.text());
            return;
        }
        window.location.reload();
    }
};

const handleChangeDisplayName = async (newName: string, user: User) => {
    if (!user) return; // ensure user exists

    console.log("New display name will be " + newName);
    if (newName.length > 0 && newName != user?.displayname) {
        console.log("Sending request for name change and reloading...");

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

        if (!response.ok) {
            console.error("Failed to change display name", await response.text());
            return;
        }
        window.location.reload();
    }
};

const handleChangeBio = async (newBio: string, user: User) => {
    if (!user) return; // ensure user exists

    if (newBio != null && newBio != user?.bio) {
        console.log("New bio will be " + newBio);
        console.log("Sending request for bio change and reloading...");

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

        if (!response.ok) {
            console.error("Failed to change bio", await response.text());
            return;
        }
        window.location.reload();
    }
};

const handleChangeSong = async (newSong: string, user: User) => {
    if (!user) return; // ensure user exists

    if (newSong != null && newSong != user?.song) {
        console.log("New song will be " + newSong);
        console.log("Sending request for song change and reloading...");

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

        if (!response.ok) {
            console.error("Failed to change song", await response.text());
            return;
        }
        window.location.reload();
    }
};

const SettingsPage = () => {
    const { user, setUser } = useContext(UserContext);

    const [newDisplayName, setNewDisplayName] = useState("");
    const [newBio, setNewBio] = useState("");
    const [newProfileSong, setNewProfileSong] = useState("");

    useEffect(() => {
        const restore = async () => {
            const loggedInUser: User = await RestoreUser();
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
                {FriendActivity()}
            </div>
        );
    }

    const SelectedIcon = user?.icon;
    const SelectedBanner = user?.banner;
    NewIcon = -1;
    NewBanner = -1;

    return (
        <div className="h-screen bg-background-main flex"
             onLoad={() => handleBannerClick(SelectedBanner, user)}>
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
                            placeholder={user?.displayname}
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
                         className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar items-start p-2  rounded-mb">

                        {IconArray.map((img) => (
                            <img
                                id={img}
                                src={img}
                                alt="Default"
                                width = "140px"
                                height = "140px"
                                className="p-3 rounded-full bg-background-secondary hover:bg-background-tertiary transition-colors duration-100 ease-in-out"
                                onClick={() => handleIconClick(img, user)}
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
                         onLoad={() => handleBannerClick(SelectedBanner, user)}
                         className="flex flex-row flex-wrap max-h-64 overflow-auto hide-scrollbar items-start p-2  rounded-mb">

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
            {FriendActivity()}
        </div>
    );
};

export default SettingsPage;
