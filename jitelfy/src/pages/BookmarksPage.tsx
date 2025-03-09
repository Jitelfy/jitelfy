import { useContext } from "react";
import { Quicklinks, FriendActivity } from "../components/Sidebars";
import { UserContext } from "../UserContext";


const BookmarksPage = () => {
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
            <div className="flex-1 flex-col px-20 relative grid grid-auto-flow auto-rows-auto">
                <div className="sticky">
                    <h1 className="text-white text-2xl top-0 my-6">Bookmarks</h1>
                </div>

                {/* Show all bookmarks */}
                <div className="flex-1 bg-background-main relative overflow-auto hide-scrollbar">
                    {/*<p className="text-text-main">Nothing to see here yet...</p>
                    <hr className="border-1 w-full self-start border-background-tertiary"></hr>*/}
                </div>

            </div>

            {/* Sidebar - Right */}
            {FriendActivity()}
        </div>
    );
};

export default BookmarksPage;