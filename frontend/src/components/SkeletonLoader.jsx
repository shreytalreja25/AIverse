import React from 'react';

// Skeleton for post cards
export const PostSkeleton = () => (
  <div className="card mb-4 shadow-sm border-0 bg-dark text-light skeleton-card">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="skeleton skeleton-avatar me-3"></div>
        <div className="flex-grow-1">
          <div className="skeleton skeleton-line" style={{ width: '60%', height: '1.2rem' }}></div>
          <div className="skeleton skeleton-line" style={{ width: '40%', height: '0.8rem', marginTop: '0.5rem' }}></div>
        </div>
      </div>
      <div className="skeleton skeleton-line mb-3" style={{ height: '1rem' }}></div>
      <div className="skeleton skeleton-line mb-3" style={{ height: '1rem', width: '80%' }}></div>
      <div className="d-flex justify-content-between align-items-center">
        <div className="skeleton skeleton-line" style={{ width: '80px', height: '2rem' }}></div>
        <div className="skeleton skeleton-line" style={{ width: '100px', height: '2rem' }}></div>
        <div className="skeleton skeleton-line" style={{ width: '60px', height: '2rem' }}></div>
      </div>
    </div>
  </div>
);

// Skeleton for profile cards
export const ProfileSkeleton = () => (
  <div className="card p-4 shadow-lg border-0 bg-dark text-light skeleton-card">
    <div className="row align-items-center">
      <div className="col-md-4 text-center">
        <div className="skeleton skeleton-avatar mx-auto" style={{ width: '150px', height: '150px' }}></div>
      </div>
      <div className="col-md-8 text-center text-md-start">
        <div className="skeleton skeleton-line mb-2" style={{ width: '50%', height: '2rem' }}></div>
        <div className="skeleton skeleton-line mb-3" style={{ width: '80%', height: '1rem' }}></div>
        <div className="d-flex justify-content-center justify-content-md-start mb-3">
          <div className="me-4 text-center">
            <div className="skeleton skeleton-line" style={{ width: '40px', height: '1.5rem' }}></div>
            <div className="skeleton skeleton-line mt-1" style={{ width: '30px', height: '0.8rem' }}></div>
          </div>
          <div className="me-4 text-center">
            <div className="skeleton skeleton-line" style={{ width: '40px', height: '1.5rem' }}></div>
            <div className="skeleton skeleton-line mt-1" style={{ width: '50px', height: '0.8rem' }}></div>
          </div>
          <div className="text-center">
            <div className="skeleton skeleton-line" style={{ width: '40px', height: '1.5rem' }}></div>
            <div className="skeleton skeleton-line mt-1" style={{ width: '50px', height: '0.8rem' }}></div>
          </div>
        </div>
        <div className="d-flex gap-2">
          <div className="skeleton skeleton-line" style={{ width: '80px', height: '2.5rem' }}></div>
          <div className="skeleton skeleton-line" style={{ width: '60px', height: '2.5rem' }}></div>
        </div>
      </div>
    </div>
  </div>
);

// Skeleton for comment cards
export const CommentSkeleton = () => (
  <div className="border-bottom pb-2 mb-2">
    <div className="d-flex align-items-center mb-2">
      <div className="skeleton skeleton-avatar me-2" style={{ width: '30px', height: '30px' }}></div>
      <div className="skeleton skeleton-line" style={{ width: '40%', height: '1rem' }}></div>
    </div>
    <div className="skeleton skeleton-line" style={{ width: '90%', height: '0.8rem' }}></div>
    <div className="skeleton skeleton-line" style={{ width: '60%', height: '0.8rem', marginTop: '0.5rem' }}></div>
  </div>
);

// Skeleton for user cards in search results
export const UserCardSkeleton = () => (
  <div className="text-center skeleton-card" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
    <div className="skeleton skeleton-avatar mx-auto mb-2" style={{ width: '100px', height: '100px' }}></div>
    <div className="skeleton skeleton-line mx-auto mb-1" style={{ width: '60%', height: '1.2rem' }}></div>
    <div className="skeleton skeleton-line mx-auto" style={{ width: '40%', height: '0.8rem' }}></div>
  </div>
);

// Skeleton for navigation items
export const NavSkeleton = () => (
  <div className="d-flex align-items-center">
    <div className="skeleton skeleton-avatar me-2" style={{ width: '40px', height: '40px' }}></div>
    <div className="skeleton skeleton-line" style={{ width: '100px', height: '1rem' }}></div>
  </div>
);

// Skeleton for form inputs
export const FormSkeleton = () => (
  <div className="mb-3">
    <div className="skeleton skeleton-line mb-2" style={{ width: '30%', height: '1rem' }}></div>
    <div className="skeleton skeleton-line" style={{ width: '100%', height: '2.5rem' }}></div>
  </div>
);

// Skeleton for sidebar content
export const SidebarSkeleton = () => (
  <div className="card p-3 shadow-sm border-0 bg-dark text-light">
    <div className="skeleton skeleton-line mb-3" style={{ width: '60%', height: '1.5rem' }}></div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="d-flex align-items-center mb-3">
        <div className="skeleton skeleton-avatar me-2" style={{ width: '40px', height: '40px' }}></div>
        <div className="flex-grow-1">
          <div className="skeleton skeleton-line mb-1" style={{ width: '70%', height: '1rem' }}></div>
          <div className="skeleton skeleton-line" style={{ width: '50%', height: '0.8rem' }}></div>
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for stories section
export const StoriesSkeleton = () => (
  <div className="mb-4">
    <div className="d-flex justify-content-center gap-3 overflow-auto py-2" style={{ maxWidth: "100%" }}>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="text-center"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div 
            className="skeleton skeleton-avatar rounded-circle border border-primary shadow-lg" 
            style={{ 
              width: "70px", 
              height: "70px", 
              borderWidth: "3px" 
            }}
          ></div>
          <div className="skeleton skeleton-line mt-1" style={{ width: '50px', height: '0.8rem' }}></div>
        </div>
      ))}
    </div>
  </div>
);

// Main skeleton loader with customizable count
export const SkeletonLoader = ({ count = 1, component: Component = PostSkeleton }) => (
  <>
    {[...Array(count)].map((_, index) => (
      <Component key={index} />
    ))}
  </>
);

export default SkeletonLoader;
