import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import FeedPage from './pages/FeedPage';
import CreatePost from './pages/CreatePost';
import PostPage from './pages/PostPage';  // Import the new PostPage component
import SearchResults from './pages/SearchResults';  // Import the new PostPage component
import Settings from './pages/Settings';
import Activities from './pages/Activities';
import AdminDashboard from './pages/AdminDashboard';
import websocketService from './services/websocketService';

function App() {
  // Initialize WebSocket connection
  useEffect(() => {
    websocketService.connect();
    
    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/profile/:id/edit" element={<EditProfilePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostPage />} />  {/* New Post Page route */}
          <Route path="/search" element={<SearchResults />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/admin" element={<AdminDashboard />} />
          {/* Catch-all route for SPA routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
