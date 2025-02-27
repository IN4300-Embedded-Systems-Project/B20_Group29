import React, { useEffect, useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { ref, set, push, onValue, remove } from "firebase/database";
import { database } from "../firebase/firebaseConfig"; // Adjust path if needed

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRfid, setNewUserRfid] = useState("");
  const [newUserBatch, setNewUserBatch] = useState("");
  const [newUserStatus, setNewUserStatus] = useState("");
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const usersRef = ref(database, "users");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setUsers(usersArray);
      } else {
        setUsers([]);
      }
    });
  }, []);

  const handleOpen = (user = null) => {
    if (user) {
      setIsEditing(true);
      setEditingUserId(user.id);
      setNewUser(user.name);
      setNewUserEmail(user.email);
      setNewUserRfid(user.id);
      setNewUserBatch(user.batch);
      setNewUserStatus(user.status);
    } else {
      setIsEditing(false);
      setEditingUserId(null);
      setNewUser("");
      setNewUserEmail("");
      setNewUserRfid("");
      setNewUserBatch("");
      setNewUserStatus("");
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleAddUser = () => {
    if (newUser && newUserEmail && newUserRfid && newUserBatch) {
      const newUserRef = ref(database, `users/${newUserRfid}`);
      set(newUserRef, {
        name: newUser,
        email: newUserEmail,
        rfid: newUserRfid,
        batch: newUserBatch,
        status: "Allowed",
      });
      setSnackbarMessage("User added successfully!");
      setSnackbarOpen(true);
      handleClose();
    }
  };

  const handleEditUser = () => {
    if (
      editingUserId &&
      newUser &&
      newUserEmail &&
      newUserRfid &&
      newUserBatch
    ) {
      const userRef = ref(database, `users/${editingUserId}`);
      set(userRef, {
        name: newUser,
        email: newUserEmail,
        rfid: newUserRfid,
        batch: newUserBatch,
        status: "Not Allowed",
      });
      setSnackbarMessage("User updated successfully!");
      setSnackbarOpen(true);
      handleClose();
    }
  };

  const removeUser = (id) => {
    const userRef = ref(database, `users/${id}`);
    remove(userRef);
    setSnackbarMessage("User deleted successfully!");
    setSnackbarOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex my-auto justify-between mb-6">
        <div className="flex font-light text-sm">
          {" "}
          All the students registered to the system are shown here
        </div>
        <Button
          onClick={() => handleOpen()}
          variant="contained"
          color="primary"
        >
          Add Student
        </Button>
      </div>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <TextField
            label="User Name"
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="RFID"
            value={newUserRfid}
            onChange={(e) => setNewUserRfid(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Batch"
            value={newUserBatch}
            onChange={(e) => setNewUserBatch(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="status"
            value={newUserStatus}
            onChange={(e) => setNewUserStatus(e.target.value)}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={isEditing ? handleEditUser : handleAddUser}
            color="primary"
            variant="contained"
          >
            {isEditing ? "Update User" : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: "8px", boxShadow: 3, mt: 2 }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#7393B3" }}>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>RFID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users available.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.batch}</TableCell>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <div
                        onClick={() => handleOpen(user)}
                        className="text-sm text-gray-400 hover:text-gray-500"
                      >
                        <Edit className="text-sm" />
                      </div>
                      <div
                        onClick={() => removeUser(user.id)}
                        className="text-sm text-red-400 hover:text-red-500"
                      >
                        <Delete />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
    </div>
  );
}

export default ManageUsers;
