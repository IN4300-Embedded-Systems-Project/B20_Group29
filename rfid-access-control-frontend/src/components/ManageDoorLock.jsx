import React, { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  IconButton,
  TableHead,
  TableRow,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import { database } from "../firebase/firebaseConfig";
import { ref, set, onValue } from "firebase/database";
import { Lock, LockOpen } from "@mui/icons-material";
import { motion } from "framer-motion"; // Import Framer Motion
import Lottie from "lottie-react";
import lockAnimation from "../assets/lock.json"; 

// Custom Styled Switch
const ManualSwitch = styled(Switch)(({ theme }) => ({
  width: 50,
  height: 28,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 3,
    transform: "translateX(2px)",
    "&.Mui-checked": {
      transform: "translateX(22px)",
      "& + .MuiSwitch-track": {
        backgroundColor: "#6D42CE",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    width: 20,
    height: 20,
    backgroundColor: "#fff",
  },
  "& .MuiSwitch-track": {
    backgroundColor: "#ccc",
    borderRadius: 16,
  },
}));

function ManageDoorLock() {
  const [lockStatuses, setLockStatuses] = useState({});
  const [labsList, setLabsList] = useState([]);
  const [accessControl, setAccessControl] = useState("manual");

  useEffect(() => {
    const accessControlRef = ref(database, "/access_control");
    const lockStatusRef = ref(database, "/door_lock");

    onValue(accessControlRef, (snapshot) => {
      if (snapshot.exists()) {
        setAccessControl(snapshot.val());
      }
    });

    onValue(lockStatusRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLockStatuses(data);
        setLabsList(Object.keys(data));
      }
    });
  }, []);

  const toggleAccessControl = () => {
    const newMode = accessControl === "manual" ? "automatic" : "manual";
    setAccessControl(newMode);
    set(ref(database, "/access_control"), newMode).catch(console.error);
  };

  const toggleLock = (labName) => {
    const newStatus = lockStatuses[labName] === "Locked" ? "Unlocked" : "Locked";

    setLockStatuses((prevState) => ({
      ...prevState,
      [labName]: newStatus,
    }));

    set(ref(database, `/door_lock/${labName}`), newStatus).catch(console.error);
  };

  return (
    <div className="p-6 rounded-lg">
      {/* Access Control Toggle with Animation */}
      <motion.div 
        className="mb-6 flex items-center gap-2 justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ManualSwitch
          checked={accessControl === "manual"}
          onChange={toggleAccessControl}
        />
        <motion.span 
          className="text-lg font-semibold"
          style={{ color: "#6D42CE" }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5 }}
        >
          {accessControl === "manual" ? "Disable Manual Lock" : "Enable Manual Lock"}
        </motion.span>
      </motion.div>

      {accessControl === "manual" ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#7393B3" }}>
                <TableCell><strong>Lab Name</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {labsList.length > 0 ? (
                labsList.map((lab) => (
                  <TableRow key={lab}>
                    <TableCell>{lab}</TableCell>
                    <TableCell align="center">
                      <motion.span
                        animate={{ color: lockStatuses[lab] === "Unlocked" ? "#4CAF50" : "#E53935" }}
                        transition={{ duration: 0.5 }}
                      >
                        {lockStatuses[lab] || "Locked"}
                      </motion.span>
                    </TableCell>
                    <TableCell align="center">
                      <motion.div 
                        whileTap={{ scale: 0.8 }} 
                        whileHover={{ scale: 1.2 }}
                      >
                        <IconButton
                          onClick={() => toggleLock(lab)}
                          color={lockStatuses[lab] === "Unlocked" ? "success" : "error"}
                        >
                          {lockStatuses[lab] === "Unlocked" ? <LockOpen /> : <Lock />}
                        </IconButton>
                      </motion.div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">No labs found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Lottie Lock Animation for Automatic Mode
        <Lottie animationData={lockAnimation} className="flex w-96 justify-center mx-auto mt-20" loop />
      )}
    </div>
  );
}

export default ManageDoorLock;
