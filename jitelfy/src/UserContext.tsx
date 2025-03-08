import React, { createContext, useState, ReactNode } from "react";
import { User } from "./App";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const IconArray = ["/src/user_icons/icon_1.png", "/src/user_icons/icon_2.png", "/src/user_icons/icon_3.png", "/src/user_icons/icon_4.png", "/src/user_icons/icon_5.png", "/src/user_icons/icon_6.png", "/src/user_icons/icon_6.png", "/src/user_icons/icon_7.png", "/src/user_icons/icon_8.png", "/src/user_icons/icon_9.png", "/src/user_icons/icon_10.png", "/src/user_icons/icon_11.png", "/src/user_icons/icon_12.png", "/src/user_icons/icon_13.png", "/src/user_icons/icon_14.png", "src/user_icons/icon_15.png", "/src/user_icons/icon_16.png"];