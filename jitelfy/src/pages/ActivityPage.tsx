import { useContext, useState, useEffect } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import {IconArray, UserContext} from "../UserContext";
import { getUserActivity, RestoreUser} from "../api";
import { PackagedUserAlert, User} from "../types";
import {Link} from "react-router-dom";

const ActivityPage = () => {
  const { user, setUser } = useContext(UserContext);
  const [ userAlerts, setUserAlerts ] = useState<PackagedUserAlert[]>();

  useEffect(() => {
    const restore = async () => {
      const loggedInUser: User = await RestoreUser();
      if (loggedInUser.id != null) {
        setUser(loggedInUser);
      }

    };

    const requestActivity= async () => {
      const response = await getUserActivity();
      if (response && response.length > 0) {
        response.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      setUserAlerts(response);
    }

    if (user == null) {
      // Keep user logged in
      restore();
    }

    requestActivity();
  }, [user]); 

  if (!user) {
    return (
      <div className="h-screen bg-background-main flex">
        {Quicklinks(user!)}
        <div className="flex-1 bg-background-main p-6 overflow-auto">
          <div className="relative w-full"></div>
        </div>
        {FriendActivity(user)}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background-main flex">
      {/* Sidebar - Left */}
      {Quicklinks(user)}

      {/* Main Content - Middle */}
      <div className="flex-1 flex-col px-20 overflow-auto hide-scrollbar">
        <div className="fixed z-20 bg-background-main opacity-95 w-full">
          <h1 className="text-white text-2xl top-0 my-6">Activity</h1>
        </div>

        {/* Alerts */}
          <div className="mt-20">
            {userAlerts && userAlerts.length > 0 ? (
                    userAlerts.map((alert) => (
                        <div className="flex flex-row content-center bg-background-secondary p-4 rounded my-4">
                          <img
                              className="size-14 rounded-full mr-3"
                              src={IconArray[alert.user.icon]}
                              alt="User icon"
                          />
                          <div className="flex flex-col text-white gap-2 w-full text-center content-center">
                            <div className="flex flex-row">
                              <Link to={"/profile/" + alert.user.username}
                                    className="hover:underline hover:decoration-text-main text-center content-center">
                                <p>
                                  @<b>{alert.user.username}</b>
                                </p>
                              </Link>

                              {/* Change text based on alert type */}
                              {alert.type == "like" && (<p className="text-center content-center ml-1">liked your post!</p>)}
                              {alert.type == "follow" && (<p className="text-center content-center ml-1">followed you!</p>)}
                            </div>
                            <p className="text-text-secondary text-left text-sm">{new Date(alert.created_at).toLocaleString().trim()}</p>
                          </div>
                        </div>
                    ))
                ) :
                (
                    <p className="text-background-tertiary text-center mt-40">Nothing to see here yet...</p>
                )
            }
          </div>
      </div>

      {/* Sidebar - Right */}
      {FriendActivity(user)}
    </div>
  );
};

export default ActivityPage;
