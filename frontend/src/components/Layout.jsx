import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Sticky Navbar */}
      <header className="sticky-top shadow-sm bg-light">
        <Navbar />
      </header>

      {/* Main Content Area (Scrollable) */}
      <main className="flex-grow-1 overflow-auto">
        {children}
      </main>

      {/* Sticky Footer */}
      <Footer />
    </div>
  );
}
