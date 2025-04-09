import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMangaById, getChaptersByMangaId } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function MangaDetail() {
  const { id } = useParams(); // Directly using useParams() to get id
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('chapter');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  const navigate = useNavigate(); // For navigation to Reader page

  useEffect(() => {
    if (id) {
      // Fetch manga details using id from useParams
      getMangaById(id).then(data => {
        setManga(data);
      });

      // Fetch chapters for the manga
      getChaptersByMangaId(id).then(data => {
        setChapters(data);
      });
    } else {
      // Handle the case where the id is not available
      console.error('Manga id not found!');
    }
  }, [id]); // The effect will run again when the id changes

  // Function to handle sorting
  const sortChapters = (chapters, sortBy, sortOrder) => {
    return chapters.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'chapter') {
        comparison = a.attributes.chapter - b.attributes.chapter;
      } else if (sortBy === 'uploaded') {
        comparison = new Date(a.attributes.createdAt) - new Date(b.attributes.createdAt);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const filteredChapters = chapters.filter((ch) =>
    ch.attributes?.chapter.toString().includes(searchQuery)
  );

  const sortedChapters = sortChapters(filteredChapters, sortBy, sortOrder);

  // Format the upload date from the `createdAt` field
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get the uploader information (either username or something related from the chapter data)
  const getUploader = (chapter) => {
    return chapter.relationships?.find((r) => r.type === 'user')?.attributes?.username || 'Unknown';
  };

  // Safe access to Manga Info
  const getMangaAttribute = (path) => {
    return path?.join(', ') || 'N/A';
  };

  if (!manga) return <div className="text-center py-10">Loading...</div>;

  const coverArt = manga.relationships?.find(r => r.type === 'cover_art');
  const filename = coverArt?.attributes?.fileName;
  const imageUrl = filename
    ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.512.jpg`
    : 'https://placehold.co/300x450?text=No+Cover';

  return (
    <div className="bg-gray-900 min-h-screen text-white p-20">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Manga Cover */}
          <div className="flex-shrink-0 w-60 md:w-72">
            <img
              src={imageUrl}
              alt={manga.attributes?.title?.en}
              onError={(e) => (e.target.src = 'https://placehold.co/300x450?text=No+Cover')}
              className="rounded-lg shadow-lg"
            />
          </div>

          {/* Manga Details */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-4">{manga.attributes?.title?.en}</h1>
            <p className="text-gray-400 mb-4">{manga.attributes?.description?.en}</p>

            {/* Chapter Table */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Chapters</h2>
              {/* Search Bar */}
              <div className="mb-4 flex items-center">
                <input
                  type="text"
                  placeholder="Search by chapter"
                  className="p-2 rounded bg-gray-800 text-white w-full md:w-56"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  value={searchQuery}
                />
              </div>

              {/* Chapter Table */}
              <table className="min-w-full table-auto text-sm">
                <thead>
                  <tr>
                    <th
                      onClick={() => {
                        setSortBy('chapter');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="cursor-pointer text-left p-2"
                    >
                      Chap {sortBy === 'chapter' && (sortOrder === 'asc' ? '↓' : '↑')}
                    </th>
                    <th
                      onClick={() => {
                        setSortBy('uploaded');
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      }}
                      className="cursor-pointer text-left p-2"
                    >
                      Uploaded {sortBy === 'uploaded' && (sortOrder === 'asc' ? '↓' : '↑')}
                    </th>
                    <th className="text-left p-2">Uploader</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedChapters.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500 py-4">
                        No chapters found
                      </td>
                    </tr>
                  ) : (
                    sortedChapters.map((ch) => {
                      const formattedDate = formatDate(ch.attributes?.createdAt);

                      return (
                        <tr key={ch.id} className="border-t border-gray-700">
                          <td className="p-2">
                            <Link
                              to={`/reader/${id}/${ch.id}`}
                              className="text-blue-400 hover:underline"
                            >
                              Chapter {ch.attributes?.chapter || 'N/A'}
                            </Link>
                          </td>
                          <td className="p-2">{formattedDate}</td>
                          <td className="p-2">{getUploader(ch)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* More Info Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">More Info</h2>
          <ul>
            <li><strong>Artists:</strong> {getMangaAttribute(manga.attributes?.artists)}</li>
            <li><strong>Authors:</strong> {getMangaAttribute(manga.attributes?.authors)}</li>
            <li><strong>Genres:</strong> {getMangaAttribute(manga.attributes?.genres)}</li>
            <li><strong>Theme:</strong> {manga.attributes?.theme || 'N/A'}</li>
            <li><strong>Format:</strong> {manga.attributes?.format || 'N/A'}</li>
            <li><strong>Publishers:</strong> {getMangaAttribute(manga.attributes?.publishers)}</li>
          </ul>
        </div>

        {/* Relations Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Relations</h2>
          <p>{manga.relationships?.find(r => r.type === 'related')?.attributes?.title || 'No related manga'}</p>
        </div>

        {/* Tags Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {manga.attributes?.tags?.map((tag, index) => (
              <span
                key={index}
                className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
