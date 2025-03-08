import { useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";


const ProfilePage = () => {
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
  
    return (
      <div className="h-screen bg-background-main flex">
      {/* Sidebar - Left */}
      {Quicklinks(user)}
  
        {/* Main Content - Middle */}
        <div className="flex-1 bg-background-main p-6 overflow-auto">
          <div className="bg-background-secondary p-6 rounded-lg flex flex-col items-center">
            <div className="relative w-full">
              <div className="w-full h-48 bg-green-500 flex items-center justify-center">
                <h1 className="text-4xl text-text-main">WE'RE COOKED</h1>
              </div>
              <img src={IconArray[parseInt(user?.icon, 10)]} className="absolute top-32 left-1/2 transform -translate-x-1/2 w-32 h-32 bg-background-tertiary rounded-full border-4 border-background-main"></img>
            </div>
            <div className="text-center mt-16">
              <h2 className="text-2xl text-text-main">{user?.displayname || 'user cannot be loaded'}</h2>
              <p className="text-text-secondary">@{user?.username || 'username'}</p>
            </div>
          </div>
        </div>
  
        {/* Sidebar - Right */}
        {FriendActivity()}
      </div>
    );
  };

export default ProfilePage;