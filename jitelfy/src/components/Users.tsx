import {User} from "../types";
import React from "react";
import {Link} from "react-router-dom";
import {IconArray} from "../UserContext";
import * as COMMON from "../common";

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

                            {/* Follow/unfollow button */}
                            {loggedInUser && user.username !== loggedInUser.username && (
                                <button
                                    className="px-8 py-2 ml-auto border border-background-tertiary bg-background-tertiary text-white rounded-lg hover:bg-background-fourth">
                                    <p>Follow</p>
                                </button>
                            )}
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