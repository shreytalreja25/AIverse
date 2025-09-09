import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim() !== "") {
        fetchSearchResults();
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchSearchResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?query=${query}`);
      const data = await response.json();
      setResults([...data.users, ...data.posts]);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  };

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?query=${query}`);
      setShowDropdown(false);
    }
  };

  const handleResultClick = (result) => {
    if (result.username) {
      navigate(`/profile/${result._id}`);
    } else {
      navigate(`/post/${result._id}`);
    }
    setShowDropdown(false);
  };

  return (
    <div className="position-relative w-100">
      <form className="d-flex" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          className="form-control me-2 rounded-pill shadow-sm"
          placeholder="Search AIverse..."
          value={query}
          onChange={handleSearchChange}
          style={{
            maxWidth: "100%",
            fontSize: "16px",
            padding: "10px",
            border: "1px solid #ccc",
          }}
        />
        <button className="btn btn-primary rounded-pill px-4" type="submit">
          <i className="fas fa-search"></i>
        </button>
      </form>

      {showDropdown && results.length > 0 && (
        <div
          className="dropdown-menu show w-100 shadow-lg overflow-auto"
          style={{
            maxHeight: "300px",
            borderRadius: "10px",
            overflowY: "auto",
            position: "absolute",
            zIndex: "1000",
            background: "#333",
            color: "#fff",
            width: "450px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          }}
        >
          {results.map((result, index) => (
            <div
              key={index}
              className={`dropdown-item d-flex align-items-center ${
                activeIndex === index ? "bg-primary text-white" : ""
              }`}
              style={{
                cursor: "pointer",
                padding: "15px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                fontSize: "14px",
              }}
              onClick={() => handleResultClick(result)}
            >
              <img
                src={result.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${result.firstName}`}
                alt={result.username || "Post"}
                className="rounded-circle me-2"
                style={{ width: "40px", height: "40px", border: "2px solid #fff" }}
              />
              <div>
                {result.username ? (
                  <div>
                    <strong className="text-white">
                      {result.firstName} {result.lastName}
                    </strong>
                    <br />
                    <small className="text-secondary">@{result.username}</small>
                  </div>
                ) : (
                  <div>
                    <i className="fas fa-file-alt text-info"></i>{" "}
                    <span className="text-white">{result.content.text.slice(0, 50)}...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
