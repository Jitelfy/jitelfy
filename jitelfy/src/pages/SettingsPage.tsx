import { useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { User } from '../App.tsx';
import { UserContext } from "../UserContext";
import { IconArray} from "../UserContext";
import {BASE_URL} from "../api";

let NewIcon = -1;

const handleChangeIcon = async (icon: number, user: User) => {
    if (!user) return; // ensure user exists

    console.log("New icon will be of index " + icon);
    if (icon != user?.icon) {
        console.log("Sending request for icon change and reloading...");

        const iconData = {
            icon: icon
        };

        const response = await fetch(`${BASE_URL}/users/icon`, {
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
                oldImg.style.padding = "0.78rem"
                oldImg.style.border = "none";
            }

            { /* Select the new icon */ }
            NewIcon = iconIndex;
            img.style.padding = "0.65rem"
            img.style.border = "2px solid #3354c8";
        }
    }
};

const SettingsPage = () => {
    const { user } = useContext(UserContext);
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
    NewIcon = -1;
    let rv = handleIconClick(IconArray[SelectedIcon], user);

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6 mx-10">Settings</h1>
                </div>

                {/* Profile picture selector */}
                <div className="flex flex-col items-start bg-background-secondary p-4 rounded-md mb-8 mx-10 gap-3">
                    <h2 className=" text-text-main text-lg">Profile picture</h2>

                    {/* Container for default icons */}
                    <div id="iconContainer" onLoad={() => handleIconClick(IconArray[SelectedIcon], user)} className="flex flex-row overflow-auto hide-scrollbar items-start p-4 gap-4 rounded-mb">

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

                    <button className="w-1/4 self-end" onClick={() => handleChangeIcon(NewIcon, user)}>
                        <p className="text-text-main bg-accent-blue-light px-6 py-2 rounded-xl hover:bg-accent-blue transition-colors">
                            Save
                        </p>
                    </button>

                </div>

            </div>

            {/* Sidebar - Right */}
            {FriendActivity()}
        </div>
    );
};

export default SettingsPage;