import { useEffect, useMemo, useState, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import API_BASE_URL from "../utils/config";
import { generateActivities } from "../services/activities/geminiClient";
import ActivitiesList from "../components/activities/ActivitiesList";
import ActivitiesMap from "../components/activities/ActivitiesMap";
import { useNotify } from "../components/Notify.jsx";
import api from "../utils/apiClient";
import Post from "../components/Post";

// Animated background (module scope to avoid styled-components warnings)
const fall = keyframes`
  0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
  10% { opacity: 0.8; }
  100% { transform: translateY(120vh) translateX(20px) rotate(30deg); opacity: 0; }
`;
const twinkle = keyframes`
  0% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
  100% { opacity: 0.2; transform: scale(1); }
`;

const AnimationLayer = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 0;
`;

const Particle = styled.span`
  position: absolute;
  top: -20px;
  left: ${({ $left }) => $left}%;
  animation: ${fall} ${({ $dur }) => $dur}s linear ${({ $delay }) => $delay}s infinite;
  filter: drop-shadow(0 2px 2px rgba(0,0,0,0.2));
`;

const NightLayer = styled.div`
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
`;

const Star = styled.span`
  position: absolute;
  width: 2px;
  height: 2px;
  background: rgba(255,255,255,0.9);
  border-radius: 50%;
  top: ${({ $top }) => $top}%;
  left: ${({ $left }) => $left}%;
  animation: ${twinkle} ${({ $dur }) => $dur}s ease-in-out ${({ $delay }) => $delay}s infinite;
`;

const Container = styled.div`
  position: relative;
  z-index: 1;
`;

// Generate random particles for animation
const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  dur: 3 + Math.random() * 4,
  delay: Math.random() * 2,
  emoji: ['🌟', '✨', '💫', '⭐', '🌙'][Math.floor(Math.random() * 5)]
}));

// Generate random stars for night effect
const stars = Array.from({ length: 50 }, (_, i) => ({
  id: i,
  top: Math.random() * 100,
  left: Math.random() * 100,
  dur: 2 + Math.random() * 3,
  delay: Math.random() * 2
}));

export default function Activities() {
  const { warning } = useNotify();
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState("reels");
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [lastMapView, setLastMapView] = useState(() => {
    try {
      const saved = localStorage.getItem('activities:lastMapView');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  // Load user's stored location
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;
      fetch(`${API_BASE_URL}/api/profile/${user.id}`)
        .then(r => r.json())
        .then(data => {
          if (data?.location) {
            setCity(data.location.city || "");
            setCountry(data.location.country || "");
          }
        }).catch(() => {});
    } catch {}
  }, []);

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  }, []);

  const fetchActivities = async ({ hint } = {}) => {
    if (!city && !country) return;
    setLoading(true);
    try {
      // Basic weather placeholders for now; can expand to call weather API later
      const weatherText = "clear";
      const tempC = 24;
      const list = await generateActivities({ city, country, weatherText, tempC, timeOfDay, hint });
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts?limit=20');
      // Sort by likes count and take top posts
      const sortedPosts = response.data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      
      // Transform posts to match Post component expectations
      const transformedPosts = sortedPosts.map(post => ({
        id: post._id,
        _id: post._id,
        authorId: post.author, // Add author ID for profile navigation
        content: post.content,
        likes: post.likes || [],
        comments: post.comments || [],
        liked: false, // Will be set based on current user
        firstName: post.authorInfo?.firstName || 'Unknown',
        lastName: post.authorInfo?.lastName || 'User',
        username: post.authorInfo?.username || 'unknown',
        profileImage: post.authorInfo?.profileImage || null,
        time: new Date(post.createdAt).toLocaleString(),
        image: post.content?.image || null
      }));
      
      setPosts(transformedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  useEffect(() => {
    if ((city || country) && items.length === 0) fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, country]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) return warning("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
        const json = await res.json();
        setCity(json.city || json.locality || "");
        setCountry(json.countryName || "");
        // cache user location
        try { localStorage.setItem('activities:userLocation', JSON.stringify({ latitude, longitude, city: json.city || json.locality || "", country: json.countryName || "" })); } catch {}
      } catch {}
    });
  };

  // Persist last selected item and map view
  useEffect(() => {
    if (selectedItem) {
      try { localStorage.setItem('activities:selected', JSON.stringify(selectedItem)); } catch {}
    }
  }, [selectedItem]);

  const handleMapViewChange = useCallback((view) => {
    setLastMapView(view);
    try { localStorage.setItem('activities:lastMapView', JSON.stringify(view)); } catch {}
  }, []);

  // Create mixed content for reels (activities + posts)
  const mixedContent = useMemo(() => {
    const content = [];
    let activityIndex = 0;
    let postIndex = 0;
    
    for (let i = 0; i < Math.max(items.length, posts.length) * 2; i++) {
      if (i % 3 === 2 && posts[postIndex]) {
        // Every 3rd item is a post
        content.push({ type: 'post', data: posts[postIndex], id: `post-${postIndex}` });
        postIndex++;
      } else if (items[activityIndex]) {
        // Activities
        content.push({ type: 'activity', data: items[activityIndex], id: `activity-${activityIndex}` });
        activityIndex++;
      }
    }
    return content;
  }, [items, posts]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % mixedContent.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + mixedContent.length) % mixedContent.length);
  };

  return (
    <Container className="container my-4">
      <AnimationLayer>
        {["☀️","☁️","🌧️","❄️","⛈️"][new Date().getSeconds() % 5] && (
          [...Array(8)].map((_, j) => (
            <Particle key={`p-${j}`} $left={(j * 12) % 100} $dur={9 + j} $delay={j * 0.6}>✨</Particle>
          ))
        )}
      </AnimationLayer>
      <NightLayer>
        {[...Array(30)].map((_, i) => (
          <Star key={`s-${i}`} $top={(i * 7) % 100} $left={(i * 13) % 100} $dur={3 + (i % 5)} $delay={(i % 10) * 0.2} />
        ))}
      </NightLayer>
      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <div>
          <label className="form-label mb-1">City</label>
          <input className="form-control" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Sydney" />
        </div>
        <div>
          <label className="form-label mb-1">Country</label>
          <input className="form-control" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Australia" />
        </div>
        <div className="ms-auto d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={useMyLocation}><i className="fas fa-location-arrow"></i> Use My Location</button>
          <button className="btn btn-primary" disabled={loading} onClick={() => fetchActivities()}>{loading ? "Generating..." : "Generate"}</button>
        </div>
      </div>

      <ul className="nav nav-tabs mb-3 sticky-top bg-dark-subtle p-1 rounded" style={{ top: 64, zIndex: 2 }}>
        <li className="nav-item">
          <button className={`nav-link ${view === "reels" ? "active" : ""}`} onClick={() => setView("reels")}>Reels</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>List</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map (prototype)</button>
        </li>
      </ul>

      {view === "reels" && (
        <div className="position-relative" style={{ height: '80vh', overflow: 'hidden' }}>
          {mixedContent.length > 0 && (
            <div className="position-relative h-100">
              <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center">
                {mixedContent[currentIndex]?.type === 'activity' ? (
                  <div className="card w-100 h-100 d-flex flex-column justify-content-center align-items-center text-center p-4" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 className="mb-3">{mixedContent[currentIndex].data.title}</h3>
                    <p className="mb-3">{mixedContent[currentIndex].data.description}</p>
                    <div className="d-flex gap-2">
                      <button className="btn btn-light" onClick={() => window.open(mixedContent[currentIndex].data.directions, '_blank')}>
                        <i className="fas fa-directions"></i> Directions
                      </button>
                      <button className="btn btn-outline-light" onClick={() => window.open(mixedContent[currentIndex].data.website, '_blank')}>
                        <i className="fas fa-external-link-alt"></i> Website
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                    {mixedContent[currentIndex].type === 'post' ? (
                      <Post post={mixedContent[currentIndex].data} />
                    ) : (
                      <div className="text-center text-white">
                        <h4>{mixedContent[currentIndex].data.title}</h4>
                        <p>{mixedContent[currentIndex].data.description}</p>
                        {mixedContent[currentIndex].data.image && (
                          <img 
                            src={mixedContent[currentIndex].data.image} 
                            alt={mixedContent[currentIndex].data.title}
                            className="img-fluid rounded"
                            style={{ maxHeight: '300px' }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              <button 
                className="btn btn-light position-absolute" 
                style={{ top: '50%', left: '10px', transform: 'translateY(-50%)' }}
                onClick={handlePrev}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button 
                className="btn btn-light position-absolute" 
                style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}
                onClick={handleNext}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
              
              {/* Progress indicator */}
              <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3">
                <div className="d-flex gap-1">
                  {mixedContent.map((_, index) => (
                    <div 
                      key={index}
                      className={`rounded-pill ${index === currentIndex ? 'bg-white' : 'bg-white-50'}`}
                      style={{ width: '8px', height: '8px' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "list" && (
        <ActivitiesList
          items={items}
          city={city}
          country={country}
          onRefresh={fetchActivities}
          onSelectItem={(it) => { setSelectedItem(it); setView('map'); }}
        />
      )}
      {view === "map" && (
        <ActivitiesMap
          items={items}
          city={city}
          country={country}
          selectedItem={selectedItem}
          lastMapView={lastMapView}
          onMapViewChange={handleMapViewChange}
        />
      )}
      </Container>
    );
  }

