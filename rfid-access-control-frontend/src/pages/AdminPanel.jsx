import React, { useState, useEffect } from "react";
import {
  db,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  database,
} from "../firebase/firebaseConfig";
import { Button, Paper, Typography, Tabs, Tab } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import ManageUsers from "../components/ManageUsers";
import ManageSchedules from "../components/ManageSchedules";
import AccessLogs from "../components/AccessLogs";
import ManageDoorLock from "../components/ManageDoorLock"; // New Component

function AdminPanel() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed, user: ", user);
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          console.log("ID Token result: ", idTokenResult);
          if (idTokenResult.claims.role === "admin") {
            console.log("User is admin");
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            navigate("/");
          }
        });
      } else {
        console.log("No user logged in");
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const logout = () => {
    signOut(auth).then(() => {
      navigate("/");
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <Paper className="p-6 rounded-lg shadow-md w-full max-w-md">
          <Typography variant="h6" align="center" color="error">
            Loading!!
          </Typography>
        </Paper>
      </div>
    );
  }

  return (
    <div>
      <div className="flex w-full flex-end justify-between p-4 bg-gray-700">
        <div className="flex gap-4 text-white">
          <p className="font-bold text-xl my-auto">XIRTAM</p>
          <p className="font-light my-auto">RFID Based Access Control System</p>
        </div>
        <Button
          variant="contained"
          color="secondary"
          onClick={logout}
          className="mr-4"
        >
          Logout
        </Button>
      </div>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto p-6 rounded-lg ">
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            className="mb-10"
          >
            <Tab label="Manage Users" />
            <Tab label="Manage Schedules" />
            <Tab label="Access Logs" />
            <Tab label="Manual Door Lock" /> {/* New Tab */}
          </Tabs>

          {tabIndex === 0 && <ManageUsers />}
          {tabIndex === 1 && <ManageSchedules />}
          {tabIndex === 2 && <AccessLogs />}
          {tabIndex === 3 && <ManageDoorLock />} {/* New Component */}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
