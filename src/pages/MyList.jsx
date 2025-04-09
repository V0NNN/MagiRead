import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function MyList() {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("magiread-bookmarks");
    if (saved) setBookmarks(JSON.parse(saved));
  }, []);

  return (
    <div className="p-20">
      <h1 className="text-2xl font-bold mb-4">Your Bookmarked Manga</h1>
      {bookmarks.length === 0 ? (
        <p>You have no bookmarks yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {bookmarks.map((manga) => (
            <Link
              to={`/manga/${manga.id}`}
              key={manga.id}
              className="bg-gray-800 p-2 rounded hover:bg-gray-700"
            >
              <img
                src={manga.image}
                alt={manga.title}
                className="w-full rounded"
              />
              <h2 className="text-sm mt-2">{manga.title}</h2>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
