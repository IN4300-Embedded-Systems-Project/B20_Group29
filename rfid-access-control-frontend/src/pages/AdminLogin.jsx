import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { TextField, Button, Paper, Typography } from "@mui/material";
import bgImage from "../assets/bg.jpg"; // ✅ Import image

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin"); // Redirect to the admin panel
    } catch (err) {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center  bg-opacity-20"
      style={{ backgroundImage: `url(${bgImage})` }} // ✅ Use imported image
    >
      <div elevation={3} className="rounded-xl w-120 bg-white bg-opacity-90">
        {" "}
        <div
          className="flex items-center justify-center bg-cover bg-center h-60 rounded-t-xl"
          style={{ backgroundImage: `url(${bgImage})` }} // ✅ Use imported image
        >
          <p className="text-white text-3xl font-bold">Welcome back!</p>
        </div>
        <div className="p-8 ">
          <p className="flex font-light pb-4 text-xl justify-center">Admin Login</p>
          <form onSubmit={handleLogin} >
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              variant="outlined"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="contained" color="primary" fullWidth type="submit">
              Login
            </Button>
            {error && (
              <Typography color="error" className="mt-2">
                {error}
              </Typography>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
