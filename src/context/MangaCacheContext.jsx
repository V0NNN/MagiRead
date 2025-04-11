import { createContext, useContext, useState } from "react";

const MangaCacheContext = createContext();

export const useMangaCache = () => useContext(MangaCacheContext);

export const MangaCacheProvider = ({ children }) => {
  const [popularCache, setPopularCache] = useState([]);
  const [updatesCache, setUpdatesCache] = useState([]);
  const [myListCache, setMyListCache] = useState([]);

  return (
    <MangaCacheContext.Provider value={{
      popularCache, setPopularCache,
      updatesCache, setUpdatesCache,
      myListCache, setMyListCache,
    }}>
      {children}
    </MangaCacheContext.Provider>
  );
};