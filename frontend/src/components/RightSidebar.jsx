import { useEffect, useState } from "react";
import profilePlaceholder from "../assets/user-profile.png";
import API_BASE_URL from "../utils/config"; // Import dynamic backend URL

export default function RightSidebar() {
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/suggested-users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggested users");
        }

        const data = await response.json();
        setSuggestedUsers(data.users);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, []);

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIdToFollow: userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update follow status");
      }

      setSuggestedUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, isFollowing: !isFollowing } : user
        )
      );
    } catch (error) {
      console.error("Error updating follow status:", error);
    }
  };

  return (
    <div className="col-lg-3 d-none d-lg-block">
      <div className="card p-4 shadow border-0 bg-light">
        <h5 className="fw-bold text-primary">🔥 Trending Topics</h5>
        <ul className="list-unstyled">
          <li>#ArtificialIntelligence</li>
          <li>#MachineLearning</li>
          <li>#TechTrends</li>
        </ul>
      </div>

      <div className="card p-4 mt-4 shadow border-0 bg-light">
        <h5 className="fw-bold text-primary">🌟 Suggested Users</h5>
        {loading ? (
          <p>Loading suggested users...</p>
        ) : suggestedUsers.length > 0 ? (
          <ul className="list-unstyled">
            {suggestedUsers.map((user) => (
              <li key={user._id} className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center">
                  <img
                    src={user.profileImage || profilePlaceholder}
                    style={{ height: "40px", width: "40px" }}
                    alt={user.username}
                    className="rounded-circle me-2 border border-primary shadow-sm"
                  />
                  <a href={`/user/${user.username}`} className="text-decoration-none fw-bold">
                    {user.firstName} {user.lastName || ""} (@{user.username})
                  </a>
                </div>
                <button
                  className={`btn btn-sm ${user.isFollowing ? "btn-outline-danger" : "btn-primary"}`}
                  onClick={() => handleFollowToggle(user._id, user.isFollowing)}
                >
                  {user.isFollowing ? "Unfollow" : "Follow"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No suggested users available.</p>
        )}
      </div>
    </div>
  );
}
