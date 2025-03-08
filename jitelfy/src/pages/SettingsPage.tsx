import { useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";
import { IconArray } from "../UserContext";


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

    return (
        <div className="h-screen bg-background-main flex">
            {/* Sidebar - Left */}
            {Quicklinks(user)}

            {/* Main Content - Middle */}

            {/* Sidebar - Right */}
            {FriendActivity()}
        </div>
    );
};

export default SettingsPage;