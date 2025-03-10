import { useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import {IconArray, UserContext} from "../UserContext";
import {getUser, RestoreUser} from "../api";
import {User} from "../types";
import {Link} from "react-router-dom";

const ActivityPage = () => {
  const { user, setUser } = useContext(UserContext);
  const [mutualFriend, setMutualFriend] = useState<any>(null);

  useEffect(() => {
    const restore = async () => {
      const loggedInUser: User = await RestoreUser();
      if (loggedInUser.id != null) {
        setUser(loggedInUser);
      }

    };

    if (user == null) {
      // Keep user logged in
      restore();
    }

    if (user) {
      // Calculate mutual friendships using the arrays of user IDs
      const mutuals = user.followers.filter((follower: string) =>
        user.following.includes(follower)
      );

      if (mutuals.length > 0) {
        // Fetch details for the first mutual friend
        getUser(mutuals[0])
          .then((friend) => setMutualFriend(friend))
          .catch((err) => console.error("Error fetching mutual friend:", err));
      } else {
        setMutualFriend(null);
      }
    }
  }, [user]); 

  if (!user) {
    return (
      <div className="h-screen bg-background-main flex">
        {Quicklinks(user!)}
        <div className="flex-1 bg-background-main p-6 overflow-auto">
          <div className="relative w-full"></div>
        </div>
        {FriendActivity()}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-main flex">
      {/* Sidebar - Left */}
      {Quicklinks(user)}

      {/* Main Content - Middle */}
      <div className="flex-1 flex-col px-20 relative grid grid-auto-flow auto-rows-auto">
        <div className="sticky">
          <h1 className="text-white text-2xl top-0 my-6">Activity</h1>
          {mutualFriend && (
            <div className="flex flex-row content-center bg-background-secondary p-4 rounded mt-2">
              <img
                  className="size-14 rounded-full mr-3"
                  src={IconArray[mutualFriend.icon]}
                  alt={mutualFriend.displayname}
              />
              <div className="flex flex-row text-white gap-2 text-center content-center">
                <Link to={"/profile/" + mutualFriend.username}
                      className="hover:underline hover:decoration-text-main text-center content-center">
                  <p>
                    @<b>{mutualFriend.username}</b>
                  </p>
                </Link>
                <p className="text-center content-center">is now friends with you!</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 flex-1 bg-background-main relative overflow-auto hide-scrollbar">
          {/* Other notifications can go here */}
        </div>
      </div>
      {/* Sidebar - Right */}
      {FriendActivity()}
    </div>
  );
};

export default ActivityPage;
