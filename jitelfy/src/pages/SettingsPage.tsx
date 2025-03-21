import {useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { User } from '../types';
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import * as API from "../api";
import * as API_CUSTOM from "../api-customization";

let NewIcon = -1;
let NewBanner = -1;

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
        let response = await API_CUSTOM.requestCustomizeIcon(icon, user);
    }
};

const handleChangeBanner = async (banner: number, user: User) => {
    if (!user) return; // Ensure user exists

    if (banner != user?.banner) {
        let response = await API_CUSTOM.requestCustomizeBanner(banner, user);
    }
};

const handleChangeDisplayName = async (newName: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newName.length >= 0 && newName.length <= 40 && newName != user?.displayname) {
        let response = await API_CUSTOM.requestCustomizeDisplayName(newName, user);
    }
};

const handleChangeBio = async (newBio: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newBio != null && newBio.length <= 250 && newBio != user?.bio) {
        let response = await API_CUSTOM.requestCustomizeBio(newBio, user);
    }
};

const handleChangeSong = async (newSong: string, user: User) => {
    if (!user) return; // Ensure user exists

    if (newSong != null && newSong != user?.song) {
        let response = await API_CUSTOM.requestCustomizeSong(newSong, user);
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

                const SelectedIcon = (loggedInUser && loggedInUser.icon) || 0;
                const SelectedBanner = (loggedInUser && loggedInUser.banner) || 0;

                handleBannerClick(SelectedBanner.toString(10));
                handleIconClick(IconArray[SelectedIcon]);
            }
        };

        NewIcon = -1;
        NewBanner = -1;

        if (user == null) {
            restore();
        }
        getUserData();
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
                                        if (userDN) {
                                            userDN.textContent = newDisplayName;
                                            if (userDN.textContent === "") userDN.textContent = user?.username;
                                        }

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

                    {/* Link with Spotify button */}
                    <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md my-10 gap-3">
                        <div className="flex flex-row items-center gap-2 w-full fill-accent-green justify-items-start">
                            <h2 className="text-text-main text-lg">Link with Spotify</h2>
                            {/* Spotify logo (taken from their "Spotify for developers" website) */}
                            <svg width="25px" height="25px" viewBox="0 0 236.05 225.25"><path d="m122.37,3.31C61.99.91,11.1,47.91,8.71,108.29c-2.4,60.38,44.61,111.26,104.98,113.66,60.38,2.4,111.26-44.6,113.66-104.98C229.74,56.59,182.74,5.7,122.37,3.31Zm46.18,160.28c-1.36,2.4-4.01,3.6-6.59,3.24-.79-.11-1.58-.37-2.32-.79-14.46-8.23-30.22-13.59-46.84-15.93-16.62-2.34-33.25-1.53-49.42,2.4-3.51.85-7.04-1.3-7.89-4.81-.85-3.51,1.3-7.04,4.81-7.89,17.78-4.32,36.06-5.21,54.32-2.64,18.26,2.57,35.58,8.46,51.49,17.51,3.13,1.79,4.23,5.77,2.45,8.91Zm14.38-28.72c-2.23,4.12-7.39,5.66-11.51,3.43-16.92-9.15-35.24-15.16-54.45-17.86-19.21-2.7-38.47-1.97-57.26,2.16-1.02.22-2.03.26-3.01.12-3.41-.48-6.33-3.02-7.11-6.59-1.01-4.58,1.89-9.11,6.47-10.12,20.77-4.57,42.06-5.38,63.28-2.4,21.21,2.98,41.46,9.62,60.16,19.74,4.13,2.23,5.66,7.38,3.43,11.51Zm15.94-32.38c-2.1,4.04-6.47,6.13-10.73,5.53-1.15-.16-2.28-.52-3.37-1.08-19.7-10.25-40.92-17.02-63.07-20.13-22.15-3.11-44.42-2.45-66.18,1.97-5.66,1.15-11.17-2.51-12.32-8.16-1.15-5.66,2.51-11.17,8.16-12.32,24.1-4.89,48.74-5.62,73.25-2.18,24.51,3.44,47.99,10.94,69.81,22.29,5.12,2.66,7.11,8.97,4.45,14.09Z"/></svg>
                        </div>

                        <button className="bg-accent-green px-6 py-2 w-full rounded-xl hover:bg-accent-green-light text-text-main hover:text-text-tertiary transition-colors"
                            onClick={API.linkWithSpotify}>
                            <p>
                                Link
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
