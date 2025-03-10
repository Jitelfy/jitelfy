import {useContext, useEffect, useState} from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray, BannerArray } from "../UserContext";
import {useParams} from "react-router-dom";
import {getPosts, getUser, RestoreUser, followUser, unfollowUser} from "../api"
import {User} from "../types";


const ProfilePage = () => {
    const { user } = useContext(UserContext);
    const [userData, setUserData] = useState<User | null>(null);
    const [isFollowing, setIsFollowing] = useState<boolean>(false);

    const { username } = useParams(); // Grab the dynamic username from the URL
    useEffect(() => {
        const fetchUser = async () => {
            if (username != null) {
                // Fetching user data
                const profileUser = await getUser(username);
                setUserData(profileUser);
                if (profileUser && user) {
                    setIsFollowing(profileUser.followers && profileUser.followers.indexOf(user.id) !== -1);
                }
            }
        };
        fetchUser();
    }, [user, username]); // Run when username changes

    console.log(userData);

    if (user == null || userData == null) {
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

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}
            <div className="flex-1 flex-col bg-background-main p-6 overflow-auto">

                {/* Container for all user data */}
                <div className="flex flex-col items-center bg-background-secondary p-4 rounded-md">
                    {/* Banner */}
                    <div className="w-full h-44 rounded-md flex items-center justify-center"
                        id="banner"
                        style={{backgroundColor: BannerArray[userData.banner]}}>
                    </div>

                    {/* Icon, display & username, profile song */}
                    <div className="flex flex-row w-full self-start justify-start items-center">
                        <img src={IconArray[userData.icon]}
                             alt="profile picture"
                             className="absolute transform translate-x-1/4 w-32 h-32 bg-background-tertiary rounded-full border-4 border-background-secondary"></img>

                        {/* Display name & username */}
                        <div className="flex-col ml-44 mt-4">
                            <h2 className="text-xl text-text-main">{userData.displayname || 'user cannot be loaded'}</h2>
                            <p className="text-md text-text-secondary">@{userData.username || 'username'}</p>
                        </div>

                        {/* DEBUG: Profile song */}
                        {user.song && (<div className="ml-auto mt-4">
                            <iframe
                                src={userData.song}
                                className="w-full h-20"
                                title="Profile song"
                            ></iframe>
                        </div>)}
                    </div>

                    {/* Bio */}
                    <p className="text-text-main self-start ml-10 mr-10 mt-10 overflow-auto text-wrap">
                        {userData.bio || "This user has no bio."}
                    </p>

                    {/* Followers & following */}
                    <div className="flex flex-row w-full my-5 justify-evenly">
                        <p className="text-text-main"><b>0</b> Followers</p>
                        <p className="text-text-main"><b>0</b> Following</p>
                    </div>

                    <hr className="border-1 w-full self-start border-background-tertiary"></hr>

                    {/* SVG for showing profile stats */}
                    <svg
                        className="self-end mt-5"
                        fill="white" width="25px" height="25px" viewBox="0 0 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g stroke="none" stroke-width="1" fill-rule="evenodd">
                            <g id="ic_fluent_poll_24_regular" fill-rule="nonzero">
                                <path d="M11.7518706,1.99956021 C13.2716867,1.99956021 14.5037411,3.23161462 14.5037411,4.75143076 L14.5037411,19.2499651 C14.5037411,20.7697812 13.2716867,22.0018356 11.7518706,22.0018356 C10.2320544,22.0018356 9,20.7697812 9,19.2499651 L9,4.75143076 C9,3.23161462 10.2320544,1.99956021 11.7518706,1.99956021 Z M18.7518706,6.99956021 C20.2716867,6.99956021 21.5037411,8.23161462 21.5037411,9.75143076 L21.5037411,19.2499651 C21.5037411,20.7697812 20.2716867,22.0018356 18.7518706,22.0018356 C17.2320544,22.0018356 16,20.7697812 16,19.2499651 L16,9.75143076 C16,8.23161462 17.2320544,6.99956021 18.7518706,6.99956021 Z M4.75187055,11.9995602 C6.27168669,11.9995602 7.5037411,13.2316146 7.5037411,14.7514308 L7.5037411,19.2499651 C7.5037411,20.7697812 6.27168669,22.0018356 4.75187055,22.0018356 C3.23205441,22.0018356 2,20.7697812 2,19.2499651 L2,14.7514308 C2,13.2316146 3.23205441,11.9995602 4.75187055,11.9995602 Z M11.7518706,3.49956021 C11.0604815,3.49956021 10.5,4.06004175 10.5,4.75143076 L10.5,19.2499651 C10.5,19.9413541 11.0604815,20.5018356 11.7518706,20.5018356 C12.4432596,20.5018356 13.0037411,19.9413541 13.0037411,19.2499651 L13.0037411,4.75143076 C13.0037411,4.06004175 12.4432596,3.49956021 11.7518706,3.49956021 Z M18.7518706,8.49956021 C18.0604815,8.49956021 17.5,9.06004175 17.5,9.75143076 L17.5,19.2499651 C17.5,19.9413541 18.0604815,20.5018356 18.7518706,20.5018356 C19.4432596,20.5018356 20.0037411,19.9413541 20.0037411,19.2499651 L20.0037411,9.75143076 C20.0037411,9.06004175 19.4432596,8.49956021 18.7518706,8.49956021 Z M4.75187055,13.4995602 C4.06048154,13.4995602 3.5,14.0600417 3.5,14.7514308 L3.5,19.2499651 C3.5,19.9413541 4.06048154,20.5018356 4.75187055,20.5018356 C5.44325957,20.5018356 6.0037411,19.9413541 6.0037411,19.2499651 L6.0037411,14.7514308 C6.0037411,14.0600417 5.44325957,13.4995602 4.75187055,13.4995602 Z">
                                </path>
                            </g>
                        </g>
                    </svg>
                </div>
            </div>

            {/* Sidebar - Right */}
            {FriendActivity()}
        </div>
    );
};

export default ProfilePage;
