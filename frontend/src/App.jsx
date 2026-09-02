import { useState } from "react";
import "./App.css";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
// import axios from "axios";

function App() {
  const [user, setUser] = useState({
    name: "Demo User",
    email: "demo@mamatrust.com",
  });

  const [error, setError] = useState("");

  /*
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");

      if (token) {
        try {
          const response = await axios.get("/api/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.status === 200) {
            const data = response.data;
            setUser(data);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user:", error);
          setError("Failed to fetch user data.");
          localStorage.removeItem("token");
          setUser(null);
        }
      }
    };

    fetchUser();
  }, []);
  */

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/chat" element={<Chat user={user} />} />

          <Route
            path="/login"
            element={<Login setUser={setUser} setError={setError} />}
          />

          <Route path="/signup" element={<Signup />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
