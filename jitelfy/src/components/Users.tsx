import {User} from "../types";
import React from "react";
import {Link} from "react-router-dom";
import {IconArray} from "../UserContext";
import * as API from "../api";

const isFollowing = (loggedInUser: User, otherUser: User) => {
    if (!loggedInUser) return false;
    return loggedInUser.following.includes(otherUser.id);
}

const handleToggleFollow = async (loggedInUser: User, otherUser: User, setUser: (user: User) => any) => {
    if (!loggedInUser) return;

    let unfollow_button = document.getElementById(otherUser.id + "unfollow_button");
    let follow_button = document.getElementById(otherUser.id + "follow_button");

    if (!isFollowing(loggedInUser, otherUser)) {
        await API.followUser(otherUser.id);

        // Add user to following
        loggedInUser.following.push(otherUser.id);
        setUser(loggedInUser);

        console.log("Showing following button...");
        if (unfollow_button && follow_button) {
            unfollow_button.style.display = "none";
            follow_button.style.display = "block";
        }

    } else {
        await API.unfollowUser(otherUser.id);

        // Remove user from following
        loggedInUser.following.filter(id => id !== otherUser.id);
        setUser(loggedInUser);

        console.log("Showing unfollowing button...");
        if (unfollow_button && follow_button) {
            unfollow_button.style.display = "block";
            follow_button.style.display = "none";
        }
    }
};

const handleMouseOver = (userID: string)=> {
    let el = document.getElementById(userID + "unfollow_button");
    if (el != null) {
        if (el.textContent == "Following") {
            el.textContent = "Unfollow";
        } else {
            el.textContent = "Following";
        }
    }
};

export const mapUsers = (users: Array<User>, loggedInUser: User | null, setUser: (user: User) => any, filter:(user: User) => boolean) => {
    return (
        users.filter(filter).map((user) => (
            <div
                key={user.id}
                className="flex flex-row bg-background-secondary p-4 rounded-md my-6">

                <div className="flex flex-row w-full">

                    {/* Profile picture */}
                    <Link to={"/profile/" + user.username}>
                        <img
                            className="size-16 rounded-full mr-3"
                            src={IconArray[user.icon]}
                            alt={user.displayname}
                        />
                    </Link>

                    <div className="flex flex-col w-full ml-3">

                        <div className="flex flex-row">

                            {/* Display name and username */}
                            <div className="flex flex-col">
                                <Link to={"/profile/" + user.username}
                                      className="hover:underline hover:decoration-background-tertiary">
                                    <p className="text-text-main font-bold">
                                        {user.displayname || user.username}
                                    </p>
                                    <p className="text-text-secondary font-normal">
                                        @{user.username}
                                    </p>
                                </Link>
                            </div>

                            {/* Follow/unfollow button (WIP)
                            {loggedInUser && !isFollowing(loggedInUser, user) && (
                                <button
                                    id = {user.id + "follow_button"}
                                    onClick={() => {handleToggleFollow(loggedInUser, user, setUser)}}
                                    className="px-8 py-2 w-1/3 ml-auto border border-background-tertiary bg-background-tertiary text-white rounded-lg hover:bg-background-fourth">
                                    <p>Follow</p>
                                </button>
                            )}
                            {loggedInUser && isFollowing(loggedInUser, user) && (
                                <button
                                    id = {user.id + "unfollow_button"}
                                    onClick={() => {handleToggleFollow(loggedInUser, user, setUser)}}
                                    onMouseEnter={() => handleMouseOver(user.id)}
                                    onMouseLeave={() => handleMouseOver(user.id)}
                                    className="px-8 py-2 w-1/3 ml-auto border border-text-main bg-background-secondary text-white rounded-lg hover:bg-background-tertiary">
                                    <p>Following</p>
                                </button>
                            )}*/}
                        </div>

                        {/* User bio */}
                        <p className="text-text-main mt-1">{user.bio}</p>
                    </div>
                </div>

                {/*{loggedInUser && user.username !== loggedInUser.username && isFollowing && (
                    <button
                        onClick={handleToggleFollow}
                        className="px-4 w-1/4 py-2 ml-auto bg-transparent text-white border border-white rounded-full hover:bg-background-tertiary"
                        onMouseEnter={handleMouseOver}
                        onMouseLeave={handleMouseOver}>
                        <p id="followedText">Following</p>
                    </button>
                )}*/}

            </div>
        ))
    )
};