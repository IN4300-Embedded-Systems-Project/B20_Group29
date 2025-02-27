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
import { ref, set, push, onValue } from "firebase/database";

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserRfid, setNewUserRfid] = useState("");
  const [schedules, setSchedules] = useState("");
  const [accessLogs, setAccessLogs] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();
  const [dbusers, setdbUsers] = useState([]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed, user: ", user);
      if (user) {
        user.getIdTokenResult().then((idTokenResult) => {
          console.log("ID Token result: ", idTokenResult);
          if (idTokenResult.claims.role === "admin") {
            console.log("User is admin");
            setIsAdmin(true);
            fetchUsers();
            fetchSchedules();
            fetchAccessLogs();
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

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const schedulesSnapshot = await getDocs(collection(db, "schedules"));
      const schedulesList = schedulesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(schedulesSnapshot);
      setSchedules(schedulesList);
    } catch (error) {
      console.error("Error fetching schedules: ", error);
    }
  };

  const fetchAccessLogs = async () => {
    try {
      const logsSnapshot = await getDocs(collection(db, "access_logs"));
      const logsList = logsSnapshot.docs.map((doc) => doc.data());
      setAccessLogs(logsList);
    } catch (error) {
      console.error("Error fetching access logs: ", error);
    }
  };

  const addUser = async (newUser) => {
    try {
      await addDoc(collection(db, "users"), {
        name: newUser.name,
        email: newUser.email,
        batch: newUser.batch,
        rfid: newUser.rfid,
        status: "active",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error adding users: ", error);
    }
  };

  const removeUser = async (userId) => {
    await deleteDoc(doc(db, "users", userId));
    fetchUsers();
  };

  const addSchedule = async (newSchedule) => {
    try {
      await addDoc(collection(db, "schedules"), {
        labName: newSchedule.labName,
        batch: newSchedule.batch,
        description: newSchedule.description,
        timestamp: newSchedule.timestamp,
        status: newSchedule.status,
      });
      fetchSchedules();
    } catch (error) {
      console.error("Error adding schedule: ", error);
    }
  };

  const updateSchedule = async (scheduleId, updatedSchedule) => {
    try {
      if (!scheduleId) {
        console.error("Error: Schedule ID is missing.");
        return;
      }

      const filteredSchedule = Object.fromEntries(
        Object.entries(updatedSchedule).filter(([_, v]) => v !== undefined)
      );

      // Ensure timestamp is in correct format
      if (filteredSchedule.timestamp) {
        filteredSchedule.timestamp = new Date(filteredSchedule.timestamp);
      }

      await updateDoc(doc(db, "schedules", scheduleId), filteredSchedule);
      console.log("Schedule updated successfully:", filteredSchedule);

      fetchSchedules();
    } catch (error) {
      console.error("Error updating schedule: ", error);
    }
  };

  const removeSchedule = async (scheduleId) => {
    await deleteDoc(doc(db, "schedules", scheduleId));
    fetchSchedules();
  };

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
          </Tabs>

          {tabIndex === 0 && (
            <ManageUsers
              {...{
                users,
                dbusers,
                newUser,
                setNewUser,
                newUserEmail,
                setNewUserEmail,
                newUserRfid,
                setNewUserRfid,
                newUserRole,
                setNewUserRole,
                addUser,
                removeUser,
              }}
            />
          )}
          {tabIndex === 1 && (
            <ManageSchedules
              schedules={schedules}
              setSchedules={setSchedules}
              addSchedule={addSchedule}
              updateSchedule={updateSchedule}
              removeSchedule={removeSchedule}
            />
          )}
          {tabIndex === 2 && <AccessLogs accessLogs={dbusers} />}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
