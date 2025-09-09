import React from 'react';

const LoadingSpinner = ({ 
  message = "Loading...", 
  emoji = "🚀", 
  size = "large",
  showMessage = true,
  className = ""
}) => {
  const sizeClasses = {
    small: "spinner-border-sm",
    medium: "",
    large: "spinner-border-lg"
  };

  return (
    <div className={`d-flex flex-column align-items-center justify-content-center ${className}`} 
         style={{ minHeight: size === 'large' ? '300px' : '150px' }}>
      
      {/* Animated Emoji Container */}
      <div className="position-relative mb-3">
        <div 
          className="emoji-bounce"
          style={{
            fontSize: size === 'large' ? '3rem' : size === 'medium' ? '2rem' : '1.5rem',
            animation: 'bounce 1s infinite',
            display: 'inline-block'
          }}
        >
          {emoji}
        </div>
        
        {/* Orbiting dots */}
        <div className="orbit-dots">
          <div className="orbit-dot" style={{ '--delay': '0s' }}>✨</div>
          <div className="orbit-dot" style={{ '--delay': '0.3s' }}>⭐</div>
          <div className="orbit-dot" style={{ '--delay': '0.6s' }}>💫</div>
        </div>
      </div>

      {/* Spinner */}
      <div className={`spinner-border text-primary ${sizeClasses[size]}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>

      {/* Loading Message */}
      {showMessage && (
        <div className="mt-3 text-center">
          <h5 className="text-primary mb-2">{message}</h5>
          <div className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Page-specific loading components
export const PageLoading = ({ message = "Loading page..." }) => (
  <div className="container-fluid d-flex align-items-center justify-content-center" 
       style={{ minHeight: '80vh' }}>
    <LoadingSpinner 
      message={message}
      emoji="🌐"
      size="large"
      className="text-center"
    />
  </div>
);

export const PostLoading = ({ message = "Loading posts..." }) => (
  <div className="d-flex justify-content-center my-5">
    <LoadingSpinner 
      message={message}
      emoji="📝"
      size="medium"
    />
  </div>
);

export const ProfileLoading = ({ message = "Loading profile..." }) => (
  <div className="d-flex justify-content-center my-5">
    <LoadingSpinner 
      message={message}
      emoji="👤"
      size="medium"
    />
  </div>
);

export const CommentLoading = ({ message = "Adding comment..." }) => (
  <div className="d-flex justify-content-center my-3">
    <LoadingSpinner 
      message={message}
      emoji="💬"
      size="small"
    />
  </div>
);

export const SearchLoading = ({ message = "Searching..." }) => (
  <div className="d-flex justify-content-center my-3">
    <LoadingSpinner 
      message={message}
      emoji="🔍"
      size="small"
    />
  </div>
);

export const AuthLoading = ({ message = "Authenticating..." }) => (
  <div className="d-flex justify-content-center my-5">
    <LoadingSpinner 
      message={message}
      emoji="🔐"
      size="medium"
    />
  </div>
);

export const DataLoading = ({ message = "Fetching data..." }) => (
  <div className="d-flex justify-content-center my-3">
    <LoadingSpinner 
      message={message}
      emoji="📊"
      size="small"
    />
  </div>
);

export default LoadingSpinner;
