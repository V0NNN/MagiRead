import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { getPagesByChapterId, getChaptersByMangaId } from '../services/api';

export default function Reader() {
  const { mangaId, chapterId } = useParams(); // Use mangaId and chapterId from route params
  const navigate = useNavigate();
  const location = useLocation();
  const chapters = location.state?.chapters || []; // Accessing the chapter list passed from MangaDetail
  const [pages, setPages] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [hash, setHash] = useState('');
  const [imageSize, setImageSize] = useState(100); // Image size in percentage
  const [isButtonsVisible, setIsButtonsVisible] = useState(true); // To track visibility of buttons
  const [nextChapterId, setNextChapterId] = useState(null);
  const [previousChapterId, setPreviousChapterId] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state for pages

  // Refs for the buttons
  const previousButtonRef = useRef(null);
  const nextButtonRef = useRef(null);
  const imageSizeControllerRef = useRef(null);

  useEffect(() => {
    // Retrieve the image size from localStorage if available
    const savedSize = localStorage.getItem('imageSize');
    if (savedSize) {
      setImageSize(Number(savedSize));
    }

    // Fetch the current chapter's pages
    setIsLoading(true); // Set loading state to true before fetching pages
    getPagesByChapterId(chapterId).then(data => {
      setPages(data.chapter.data);
      setBaseUrl(data.baseUrl);
      setHash(data.chapter.hash);
      setIsLoading(false); // Set loading state to false after pages are loaded
    });

    // Fetch the chapters list
    getChaptersByMangaId(mangaId).then(chaptersList => {
      const currentChapterIndex = chaptersList.findIndex(chapter => chapter.id === chapterId);
      setNextChapterId(currentChapterIndex < chaptersList.length - 1 ? chaptersList[currentChapterIndex + 1].id : null);
      setPreviousChapterId(currentChapterIndex > 0 ? chaptersList[currentChapterIndex - 1].id : null);
    });
  }, [chapterId, mangaId]);

  const changeImageSize = (delta) => {
    setImageSize((prevSize) => {
      let newSize = prevSize + delta;
      if (newSize < 20) newSize = 20; // Minimum size of 20%
      if (newSize > 200) newSize = 200; // Maximum size of 200%
      localStorage.setItem('imageSize', newSize); // Save the new size to localStorage
      return newSize;
    });
  };

  const goToNextChapter = () => {
    if (nextChapterId) {
      // Clear the current pages before navigating to the next chapter
      setPages([]); 
      setIsLoading(true); // Start loading new chapter
      window.scrollTo(0, 0); // Immediately scroll to top
      navigate(`/reader/${mangaId}/${nextChapterId}`);
    }
  };

  const goToPreviousChapter = () => {
    if (previousChapterId) {
      // Clear the current pages before navigating to the previous chapter
      setPages([]); 
      setIsLoading(true); // Start loading new chapter
      window.scrollTo(0, 0); // Immediately scroll to top
      navigate(`/reader/${mangaId}/${previousChapterId}`);
    }
  };

  // Scroll event listener to control the image size controller visibility
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY; // Current scroll position
      const nearBottom = document.documentElement.scrollHeight - scrollPosition <= window.innerHeight + 500; // 500px from the bottom

      if (nearBottom) {
        setIsButtonsVisible(false); // Hide when near bottom
      } else {
        setIsButtonsVisible(true); // Show when not near the bottom
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll); // Cleanup listener
    };
  }, []);

  return (
    <div className="bg-gray-900 min-h-screen text-white pt-20 flex flex-col">
      {/* Image Pages */}
      <div className="flex justify-center items-center flex-col gap-4 flex-grow" style={{ width: '50%', margin: '0 auto' }}>
        {isLoading ? (
          <div className="flex justify-center items-center text-white">
            <div className="w-12 h-12 rounded-full border-t-4 border-white animate-spin"></div> {/* Spinning circle */}
            <span className="ml-4 text-xl">Loading...</span>
          </div>
        ) : (
          pages.map((page, i) => (
            <img
              key={i}
              src={`${baseUrl}/data/${hash}/${page}`}
              alt={`Page ${i + 1}`}
              className="transition-all duration-300"
              style={{ width: `${imageSize}%`, maxWidth: '100%' }}
              onError={(e) => (e.target.src = "https://placehold.co/400x600?text=No+Page")}
            />
          ))
        )}
      </div>

      {/* Image Size Control */}
      <div
        ref={imageSizeControllerRef}
        className={`fixed bottom-20 left-20 flex items-center gap-4 transition-opacity duration-500 ${isButtonsVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => changeImageSize(-5)}  // Change in increments of 5
          className="bg-gray-800 p-2 rounded hover:bg-gray-700 text-white text-xl"
        >
          -
        </button>
        <div className="bg-gray-800 p-2 rounded text-white text-lg">
          {imageSize}%
        </div>
        <button
          onClick={() => changeImageSize(5)}   // Change in increments of 5
          className="bg-gray-800 p-2 rounded hover:bg-gray-700 text-white text-xl"
        >
          +
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-grow flex justify-center items-center mb-8 pt-10">
        <div className="w-full flex justify-between">
          {/* Previous Button (hidden on first chapter) */}
          {previousChapterId && !isLoading && (
            <button
              ref={previousButtonRef}
              onClick={goToPreviousChapter}
              className="bg-gray-800 w-1/3 h-36 text-white text-xl font-bold hover:bg-gray-700 border-r border-gray-700"
            >
              Previous
            </button>
          )}

          {/* Next Button (100% width if it's the first chapter) */}
          {nextChapterId && !isLoading && (
            <button
              ref={nextButtonRef}
              onClick={goToNextChapter}
              className={`bg-gray-800 ${!previousChapterId ? 'w-full' : 'w-2/3'} h-36 text-white text-xl font-bold hover:bg-gray-700`}
            >
              Next Chapter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}