import React, { useEffect, useState } from "react";

const Homepage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Parse and set user data
    }
  }, []);

  return (
    <div>
      <h1>Homepage</h1>
      {user ? (
        <div>
          <h2>Welcome, {user.username}!</h2>
          <p>Email: {user.email}</p>
          {/* Display other user details as needed */}
        </div>
      ) : (
        <p>Loading user information...</p>
      )}
    </div>
  );
};

export default Homepage;
