import React, { useState, useEffect } from "react";
import {
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import { database } from "../firebase/firebaseConfig"; // Adjust path if needed
import { ref, set, push, onValue, remove, update } from "firebase/database";

function ManageSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [schedule, setSchedule] = useState({
    labName: "",
    batch: "",
    start: "",
    end: "",
    status: "active",
  });
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteScheduleId, setDeleteScheduleId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const schedulesRef = ref(database, "schedules");
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const scheduleList = [];
        Object.keys(data).forEach((labName) => {
          Object.keys(data[labName]).forEach((batch) => {
            scheduleList.push({
              id: `${labName}-${batch}`,
              labName,
              batch,
              start: data[labName][batch].start,
              end: data[labName][batch].end,
              status: data[labName][batch].status,
            });
          });
        });
        setSchedules(scheduleList);
      } else {
        setSchedules([]);
      }
    });
  }, []);

  const handleOpenDialog = (scheduleToEdit = null) => {
    if (scheduleToEdit) {
      setSchedule(scheduleToEdit);
      setEditMode(true);
    } else {
      setSchedule({
        labName: "",
        batch: "",
        start: "",
        end: "",
        status: "active",
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleSaveSchedule = () => {
    const scheduleRef = ref(
      database,
      `schedules/${schedule.labName}/${schedule.batch}`
    );
    set(scheduleRef, {
      start: schedule.start,
      end: schedule.end,
      status: schedule.status,
    })
      .then(() => {
        setSnackbarMessage(
          editMode
            ? "Schedule updated successfully!"
            : "Schedule added successfully!"
        );
        setSnackbarOpen(true);
        setOpen(false);
      })
      .catch((error) => {
        console.error("Error saving schedule: ", error);
      });
  };

  const handleDeleteSchedule = () => {
    const scheduleRef = ref(
      database,
      `schedules/${deleteScheduleId.replace("-", "/")}`
    );
    remove(scheduleRef)
      .then(() => {
        setSnackbarMessage("Schedule deleted successfully!");
        setSnackbarOpen(true);
        setConfirmDeleteOpen(false);
      })
      .catch((error) => {
        console.error("Error deleting schedule: ", error);
      });
  };

  return (
    <div className="p-6 rounded-lg">
      <div className="flex my-auto justify-between mb-6">
        <div className="flex font-light text-sm">
          {" "}
          All the lab schedules are shown here
        </div>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Add Schedule
        </Button>
      </div>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editMode ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Lab Name"
            value={schedule.labName}
            onChange={(e) =>
              setSchedule({ ...schedule, labName: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Batch"
            value={schedule.batch}
            onChange={(e) =>
              setSchedule({ ...schedule, batch: e.target.value })
            }
            fullWidth
          />
          <TextField
            label="Start Time"
            type="datetime-local"
            value={schedule.start}
            onChange={(e) =>
              setSchedule({ ...schedule, start: e.target.value })
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Time"
            type="datetime-local"
            value={schedule.end}
            onChange={(e) => setSchedule({ ...schedule, end: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={schedule.status}
              onChange={(e) =>
                setSchedule({ ...schedule, status: e.target.value })
              }
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleSaveSchedule}
            variant="contained"
            color="primary"
          >
            {editMode ? "Update" : "Add"} Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#7393B3" }}>
              <TableCell>Lab Name</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.labName}</TableCell>
                <TableCell>{s.batch}</TableCell>
                <TableCell>{new Date(s.start).toLocaleString()}</TableCell>
                <TableCell>{new Date(s.end).toLocaleString()}</TableCell>
                <TableCell>{s.status}</TableCell>
                <TableCell>
                  <div className="flex gap-4">
                    <div
                      className="text-sm text-gray-400 hover:text-gray-500"
                      onClick={() => handleOpenDialog(s)}
                    >
                      <Edit />
                    </div>
                    <div
                      onClick={() =>
                        setDeleteScheduleId(s.id) || setConfirmDeleteOpen(true)
                      }
                      className="text-sm text-red-400 hover:text-red-500"
                    >
                      <Delete />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default ManageSchedules;
