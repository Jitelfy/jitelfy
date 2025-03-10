import { useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { getUser } from "../api";

const ActivityPage = () => {
  const { user } = useContext(UserContext);
  const [mutualFriend, setMutualFriend] = useState<any>(null);

  useEffect(() => {
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
            <div className="bg-gray-800 p-2 rounded mt-2">
              <p className="text-white">
                @{mutualFriend.username} is now friends with you!
              </p>
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
