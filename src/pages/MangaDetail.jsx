import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getMangaById, getChaptersByMangaId } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid'; // Importing UUID library
import {
  updateReadingStatus,
  getCustomLists,
  updateCustomList,
} from '../services/api';

export default function MangaDetail() {
  const { id } = useParams();
  const [manga, setManga] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('chapter');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [hasMoreChapters, setHasMoreChapters] = useState(true); // Track if there are more chapters to load
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [customLists, setCustomLists] = useState([]); // ✅ moved here
  const token = localStorage.getItem("userToken"); // ✅ also moved here

  const mangaPerPage = 80;
  const navigate = useNavigate();

  // Fetch Manga Details
  useEffect(() => {
    if (id) {
      getMangaById(id).then(data => {
        setManga(data?.data?.data);
      });

      fetchChapters(1); // Initial fetch for chapters

      if (token) {
        getCustomLists(token)
          .then(res => setCustomLists(res.data))
          .catch(err => console.error('Error fetching lists:', err));
      }
    } else {
      console.error('Manga id not found!');
    }
  }, [id]);

  // Fetch Chapters
  const fetchChapters = async (page = 1) => {
    const limit = 100; // Maximum number of chapters per API request
    const offset = (page - 1) * limit;

    setIsLoading(true); // Set loading to true while fetching chapters

    try {
      const data = await getChaptersByMangaId(id, limit, offset);

      // If no new chapters were returned, set hasMoreChapters to false
      if (data.length === 0) {
        setHasMoreChapters(false);
      } else {
        // Append new chapters to the existing list
        setChapters(prevChapters => [...prevChapters, ...data]);
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
    } finally {
      setIsLoading(false); // Set loading to false once the fetch is complete
    }
  };

  // Sort chapters by chapter number or created date
  const sortChapters = (chapters) => {
    return chapters.sort((a, b) => {
      const chapterA = parseInt(a.attributes.chapter, 10);
      const chapterB = parseInt(b.attributes.chapter, 10);
      return chapterA - chapterB; // Sort chapters numerically
    });
  };

  // Filter unique chapters and sort them
  const uniqueChapters = chapters.filter((value, index, self) => 
    index === self.findIndex((t) => (
      t.attributes.chapter === value.attributes.chapter
    ))
  );
  
  const sortedChapters = sortChapters(uniqueChapters);

  // Pagination: Show current page chapters
  const filteredChapters = sortedChapters.filter((ch) =>
    ch.attributes?.chapter != null && ch.attributes?.chapter.toString().includes(searchQuery)
  );

  const currentChapters = filteredChapters.slice((page - 1) * mangaPerPage, page * mangaPerPage);
  
  // Handle next and previous page actions
  const handleNextPage = () => {
    if (hasMoreChapters) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchChapters(nextPage);
    }
  };

  const handlePreviousPage = () => {
    const prevPage = page > 1 ? page - 1 : 1;
    setPage(prevPage);
  };

  const hasNextPage = hasMoreChapters && filteredChapters.length > page * mangaPerPage;
  const hasPreviousPage = page > 1;

  // Format date
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get uploader info
  const getUploader = (chapter) => {
    return chapter.relationships?.find((r) => r.type === 'user')?.attributes?.username || 'Unknown';
  };

  const handleReadingStatusChange = async (e) => {
    const status = e.target.value;
    try {
      await updateReadingStatus(id, status, token);
      alert(`Status set to "${status}"`);
    } catch (err) {
      console.error('Failed to update reading status:', err);
    }
  };
  
  const handleAddToList = async (listId) => {
    try {
      const list = customLists.find(l => l._id === listId);
      if (!list) return alert("List not found");
  
      if (list.mangaIds.includes(id)) {
        return alert("Manga already in this list");
      }
  
      const updatedIds = [...list.mangaIds, id];
      await updateCustomList(listId, updatedIds, token);
      alert("Manga added to list");
    } catch (err) {
      console.error('Failed to add to list:', err);
    }
  };

  // Safely accessing manga data
  const coverArt = manga?.relationships?.find(r => r.type === 'cover_art');
  const filename = coverArt?.attributes?.fileName;
  const imageUrl = filename
    ? `https://uploads.mangadex.org/covers/${manga.id}/${filename}.512.jpg`
    : 'https://placehold.co/300x450?text=No+Cover';

  if (!manga) return <div className="text-center py-10">Loading...</div>;

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

            {token && (
              <>
                {/* Reading Status Dropdown */}
                <div className="mb-6">
                  <label className="block font-semibold mb-2">Add to Reading List</label>
                  <select
                    onChange={handleReadingStatusChange}
                    className="bg-gray-800 text-white p-2 rounded"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a status</option>
                    <option value="reading">Reading</option>
                    <option value="on_hold">On Hold</option>
                    <option value="dropped">Dropped</option>
                    <option value="plan_to_read">Plan to Read</option>
                    <option value="completed">Completed</option>
                    <option value="re_reading">Re-Reading</option>
                  </select>
                </div>

                {/* Custom List Buttons */}
                <div className="mb-6">
                  <label className="block font-semibold mb-2">Add to Custom List</label>
                  <div className="flex flex-wrap gap-2">
                    {customLists.map((list) => (
                      <button
                        key={list._id}
                        onClick={() => handleAddToList(list._id)}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-white"
                      >
                        {list.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Chapter Table */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Chapters</h2>
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
                  {currentChapters.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-gray-500 py-4">
                        No chapters found
                      </td>
                    </tr>
                  ) : (
                    currentChapters.map((ch) => {
                      const formattedDate = formatDate(ch.attributes?.createdAt);

                      const chapterKey = uuidv4(); 

                      return (
                        <tr key={chapterKey} className="border-t border-gray-700">
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

              {/* Pagination */}
              <div className="flex justify-between mt-4">
                {hasPreviousPage && (
                  <button
                    onClick={handlePreviousPage}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600"
                  >
                    Previous
                  </button>
                )}
                {hasNextPage && !isLoading && (
                  <button
                    onClick={handleNextPage}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 ml-auto"
                  >
                    Next
                  </button>
                )}
                {isLoading && (
                  <div className="text-white ml-auto py-2">Loading...</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* More Info Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">More Info</h2>
          <ul>
            <li><strong>Artists:</strong> {manga.relationships?.filter(r => r.type === 'artist').map(r => r.attributes.name).join(', ') || 'N/A'}</li>
            <li><strong>Authors:</strong> {manga.relationships?.filter(r => r.type === 'author').map(r => r.attributes.name).join(', ') || 'N/A'}</li>
            <li><strong>Genres:</strong> {manga.attributes?.tags?.filter(tag => tag.attributes?.group === 'genre').map(tag => tag.attributes?.name?.en).join(', ') || 'N/A'}</li>
            <li><strong>Theme:</strong> {manga.attributes?.tags?.filter(tag => tag.attributes?.group === 'theme').map(tag => tag.attributes?.name?.en).join(', ') || 'N/A'}</li>
            <li><strong>Format:</strong> {manga.attributes?.tags?.filter(tag => tag.attributes?.group === 'format').map(tag => tag.attributes?.name?.en).join(', ') || 'N/A'}</li>
            <li><strong>Publisher:</strong> {manga.relationships?.find(r => r.type === 'creator')?.attributes?.username || 'N/A'}</li>
            <li><strong>Year:</strong> {manga.attributes?.year || 'N/A'}</li>
            <li><strong>Content Rating:</strong> {manga.attributes?.contentRating || 'N/A'}</li>
          </ul>
        </div>

        {/* Tags Section */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {manga.attributes?.tags?.map((tag, index) => (
              <span key={index} className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm">
                {tag.attributes?.name?.en || 'N/A'}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}