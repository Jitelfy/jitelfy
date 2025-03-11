import { useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import {IconArray, UserContext} from "../UserContext";
import {getUser, getUserActivity, RestoreUser} from "../api";
import {User, UserAlerts} from "../types";
import {Link} from "react-router-dom";

const ActivityPage = () => {
  const { user, setUser } = useContext(UserContext);
  const [ userAlerts, setUserAlerts ] = useState<UserAlerts>();

  useEffect(() => {
    const restore = async () => {
      const loggedInUser: User = await RestoreUser();
      if (loggedInUser.id != null) {
        setUser(loggedInUser);
      }

    };

    const requestActivity= async () => {
      const response = await getUserActivity();
      setUserAlerts(response);
    }

    if (user == null) {
      // Keep user logged in
      restore();
    }

    requestActivity();
    console.log(userAlerts);
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
          {userAlerts && userAlerts?.alerts && (
              userAlerts.alerts.map((alert) => (
                  <div className="flex flex-row content-center bg-background-secondary p-4 rounded mt-2">
                    <img
                        className="size-14 rounded-full mr-3"
                        src={IconArray[15]}
                        alt="Poop"
                    />
                    <div className="flex flex-col text-white gap-2 text-center content-center">
                      <div>
                        <Link to={"/profile/"}
                              className="hover:underline hover:decoration-text-main text-center content-center">
                          <p>
                            @<b>{alert.AlerterId}</b>
                          </p>
                        </Link>

                        <p className="text-center content-center">is now friends with you!</p>
                      </div>
                      <p>{alert.created_at}</p>
                    </div>
                  </div>
              ))
          )};
        </div>
      </div>

      {/* Sidebar - Right */}
      {FriendActivity()}
    </div>
  );
};

export default ActivityPage;
