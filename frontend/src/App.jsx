import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import FeedPage from './pages/FeedPage';
import CreatePost from './pages/CreatePost';
import PostPage from './pages/PostPage';  // Import the new PostPage component
import SearchResults from './pages/SearchResults';  // Import the new PostPage component
import Settings from './pages/Settings';
import Activities from './pages/Activities';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/create-post" element={<CreatePost />} />
          <Route path="/post/:id" element={<PostPage />} />  {/* New Post Page route */}
          <Route path="/search" element={<SearchResults />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/activities" element={<Activities />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
