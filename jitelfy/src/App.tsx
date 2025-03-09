import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ExplorePage from "./pages/ExplorePage";
import ActivityPage from "./pages/ActivityPage";
import BookmarksPage from "./pages/BookmarksPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
          <Route index element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

export class User {
}