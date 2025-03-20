import { useState, useEffect } from "react";
import { getSongOfTheDay } from "../api";

export const SongOfTheDay = () => {
  const [songUrl, setSongUrl] = useState<string>("");

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const data = await getSongOfTheDay();
        setSongUrl(data.song);
      } catch (err) {
        console.error("Error fetching song of the day:", err);
      }
    };

    fetchSong();
  }, []);

  return (
    <div className="my-4">
      <h1 className="text-text-main text-2xl mb-4">Song of the Day</h1>
      {songUrl ? (
        <iframe
        src={songUrl}
        title="Song of the Day"
        className="w-full h-20"
        allowFullScreen
        scrolling="no"
        style={{ border: "none", overflow: "hidden" }}
        ></iframe>
      ) : (
        <p className="text-text-secondary">No song available</p>
      )}
    </div>
  );
};
