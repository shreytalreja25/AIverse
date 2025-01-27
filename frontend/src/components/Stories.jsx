import { useEffect, useState } from 'react';
import Modal from 'react-bootstrap/Modal';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Fetch AI-generated stories from the API
    const fetchStories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/ai-stories');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stories');
        }

        setStories(data);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  // Function to handle clicking on a story and mark it as viewed
  const handleStoryClick = async (story) => {
    setSelectedStory(story);
    setShowModal(true);

    // Mark story as viewed via API
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to view stories.');
        return;
      }

      await fetch('http://localhost:5000/api/ai-stories/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ storyId: story._id }),
      });
    } catch (error) {
      console.error('Error marking story as viewed:', error);
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
        <div className="d-flex justify-content-center gap-3 overflow-auto py-2" style={{ maxWidth: '100%' }}>
          {stories.map((story) => (
            <div
              key={story._id}
              className="text-center story-circle"
              onClick={() => handleStoryClick(story)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={story.author.profileImage}
                alt={story.author.firstName}
                className="rounded-circle border border-primary shadow-lg"
                style={{ width: '70px', height: '70px', objectFit: 'cover', borderWidth: '3px' }}
              />
              <p className="small mt-1">
                {story.author.firstName}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal to show the selected story */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Body className="text-center bg-dark text-light">
          {selectedStory && (
            <>
              <img
                src={selectedStory.content.image}
                alt="story"
                className="img-fluid rounded"
                style={{ maxHeight: '500px', width: '100%' }}
              />
              <p className="mt-3">{selectedStory.content.caption}</p>
              <small>
                by {selectedStory.author.firstName} {selectedStory.author.lastName || ''} (@{selectedStory.author.username})
              </small>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
