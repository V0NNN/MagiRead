import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { getPagesByChapterId } from '../services/api';

export default function Reader() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const chapters = location.state?.chapters || []; // Accessing the chapter list passed from MangaDetails

  const [pages, setPages] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [hash, setHash] = useState('');
  const [imageSize, setImageSize] = useState(100); // Image size in percentage
  const [isButtonsVisible, setIsButtonsVisible] = useState(true); // To track visibility of buttons
  const previousButtonRef = useRef(null);
  const nextButtonRef = useRef(null);

  useEffect(() => {
    // Retrieve the image size from localStorage if available
    const savedSize = localStorage.getItem('imageSize');
    if (savedSize) {
      setImageSize(Number(savedSize));
    }

    getPagesByChapterId(chapterId).then(data => {
      setPages(data.chapter.data);
      setBaseUrl(data.baseUrl);
      setHash(data.chapter.hash);
    });
  }, [chapterId]);

  // Function to handle the image size change (increments of 5)
  const changeImageSize = (delta) => {
    setImageSize((prevSize) => {
      let newSize = prevSize + delta;
      if (newSize < 20) newSize = 20; // Minimum size of 20%
      if (newSize > 200) newSize = 200; // Maximum size of 200%
      localStorage.setItem('imageSize', newSize); // Save the new size to localStorage
      return newSize;
    });
  };

  // Arrow key navigation for Next and Previous Chapter
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'ArrowRight') {
      goToNextChapter();
    } else if (event.key === 'ArrowLeft' && parseInt(chapterId) > 1) {
      goToPreviousChapter();
    }
  }, [chapterId]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Get the current chapter index
  const currentChapterIndex = chapters.findIndex(chapter => chapter.id === chapterId);

  // Function to navigate to the next chapter
  const goToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      const nextChapterId = chapters[currentChapterIndex + 1].id;
      navigate(`/reader/${nextChapterId}`);
    }
  };

  // Function to navigate to the previous chapter
  const goToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      const prevChapterId = chapters[currentChapterIndex - 1].id;
      navigate(`/reader/${prevChapterId}`);
    }
  };

  // Intersection Observer to detect visibility of buttons and fade in/out image resizer control
  useEffect(() => {
    const options = {
      root: null, // relative to viewport
      rootMargin: '0px',
      threshold: 1.0 // Fully in view
    };

    const observer = new IntersectionObserver(([entry]) => {
      setIsButtonsVisible(!entry.isIntersecting); // Toggle visibility of image resizer control
    }, options);

    if (previousButtonRef.current && nextButtonRef.current) {
      observer.observe(previousButtonRef.current);
      observer.observe(nextButtonRef.current);
    }

    return () => {
      if (previousButtonRef.current && nextButtonRef.current) {
        observer.unobserve(previousButtonRef.current);
        observer.unobserve(nextButtonRef.current);
      }
    };
  }, []);

  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === chapters.length - 1;

  return (
    <div className="bg-gray-900 min-h-screen text-white p-0 flex flex-col">
      {/* Image Pages */}
      <div className="flex justify-center flex-wrap gap-4 flex-grow">
        {pages.map((page, i) => (
          <img
            key={i}
            src={`${baseUrl}/data/${hash}/${page}`}
            alt={`Page ${i + 1}`}
            className="transition-all duration-300"
            style={{ width: `${imageSize}%`, maxWidth: '100%' }}
            onError={(e) => (e.target.src = "https://placehold.co/400x600?text=No+Page")}
          />
        ))}
      </div>

      {/* Image Size Control */}
      <div
        className={`fixed bottom-20 left-20 flex items-center gap-4 transition-opacity duration-500 ${isButtonsVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ zIndex: 10 }}
      >
        <button
          onClick={() => changeImageSize(-5)}  // Change in increments of 5
          className="bg-gray-800 p-3 rounded hover:bg-gray-700 text-white text-2xl"
        >
          -
        </button>
        <div className="bg-gray-800 p-3 rounded text-white text-xl">
          {imageSize}%
        </div>
        <button
          onClick={() => changeImageSize(5)}   // Change in increments of 5
          className="bg-gray-800 p-3 rounded hover:bg-gray-700 text-white text-2xl"
        >
          +
        </button>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-grow flex justify-center items-center mb-8 pt-10">
        <div className="w-full flex justify-between">
          {/* Previous Button */}
          {!isFirstChapter && (
            <button
              ref={previousButtonRef}
              onClick={goToPreviousChapter}
              className="bg-gray-800 w-1/3 h-36 text-white text-xl font-bold hover:bg-gray-700 border-r border-gray-700"
            >
              Previous
            </button>
          )}

          {/* Next Button */}
          <button
            ref={nextButtonRef}
            onClick={goToNextChapter}
            className={`bg-gray-800 ${isFirstChapter || isLastChapter ? 'w-full' : 'w-2/3'} h-36 text-white text-xl font-bold hover:bg-gray-700`}
          >
            Next Chapter
          </button>
        </div>
      </div>
    </div>
  );
}
