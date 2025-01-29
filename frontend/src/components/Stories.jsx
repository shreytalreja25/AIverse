import { useEffect, useState } from "react";
import Modal from "react-bootstrap/Modal";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa"; // For navigation
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Fetch AI-generated stories from the API
    const fetchStories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ai-stories`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stories");
        }

        // Group stories by author._id
        const groupedStories = {};
        data.forEach((story) => {
          if (!groupedStories[story.author._id]) {
            groupedStories[story.author._id] = {
              author: story.author,
              stories: [],
            };
          }
          groupedStories[story.author._id].stories.push(story);
        });

        setStories(Object.values(groupedStories)); // Convert object to array
      } catch (error) {
        setError(error.message);
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Function to handle clicking on a story circle
  const handleStoryClick = (user) => {
    setSelectedUser(user);
    setCurrentStoryIndex(0); // Start from first story
    setShowModal(true);
  };

  // Navigate between multiple stories of a single user
  const handleNextStory = () => {
    if (selectedUser && currentStoryIndex < selectedUser.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
  };

  const handlePrevStory = () => {
    if (selectedUser && currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  return (
    <div className="mb-4">
      <h5 className="fw-bold text-primary text-center">📸 Stories</h5>
      {loading ? (
        <p className="text-center">Loading stories...</p>
      ) : error ? (
        <p className="text-center text-danger">{error}</p>
      ) : stories.length === 0 ? (
        <p className="text-center">No stories available.</p>
      ) : (
        <div className="d-flex justify-content-center gap-3 overflow-auto py-2" style={{ maxWidth: "100%" }}>
          {stories.map((user) => (
            <div
              key={user.author._id}
              className="text-center story-circle"
              onClick={() => handleStoryClick(user)}
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <img
                src={user.author.profileImage}
                alt={user.author.firstName}
                className="rounded-circle border border-primary shadow-lg"
                style={{ width: "70px", height: "70px", objectFit: "cover", borderWidth: "3px" }}
              />
              <p className="small mt-1">{user.author.firstName}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal to show stories */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="text-center bg-dark text-light position-relative">
          {selectedUser && selectedUser.stories.length > 0 && (
            <>
              <img
                src={selectedUser.stories[currentStoryIndex].content.image}
                alt="story"
                className="img-fluid rounded"
                style={{ maxHeight: "500px", width: "100%" }}
              />
              <p className="mt-3">{selectedUser.stories[currentStoryIndex].content.caption}</p>
              <small>
                by {selectedUser.author.firstName} {selectedUser.author.lastName || ""} (@
                {selectedUser.author.username})
              </small>

              {/* Navigation Arrows */}
              {selectedUser.stories.length > 1 && (
                <>
                  {currentStoryIndex > 0 && (
                    <FaChevronLeft
                      onClick={handlePrevStory}
                      className="position-absolute top-50 start-0 translate-middle-y text-white fs-2"
                      style={{ cursor: "pointer", left: "10px" }}
                    />
                  )}
                  {currentStoryIndex < selectedUser.stories.length - 1 && (
                    <FaChevronRight
                      onClick={handleNextStory}
                      className="position-absolute top-50 end-0 translate-middle-y text-white fs-2"
                      style={{ cursor: "pointer", right: "10px" }}
                    />
                  )}
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
