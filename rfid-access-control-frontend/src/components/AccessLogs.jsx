import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import { database } from "../firebase/firebaseConfig"; // Adjust path if needed
import { ref, onValue } from "firebase/database";
import _ from "lodash"; // Import lodash for sorting

function AccessLogs() {
  const [accessLogs, setAccessLogs] = useState([]);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  useEffect(() => {
    const logsRef = ref(database, "/access_logs");

    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const logsArray = Object.keys(data).map((cardUid) => ({
          user: data[cardUid]?.user || "Unknown",
          rfid: data[cardUid]?.CardID,
          timestamp: data[cardUid]?.Time || null,
          status: data[cardUid]?.Status || "Unknown",
        }));

        const parseDate = (timestamp) => {
          return new Date(
            timestamp.replace(
              /(\d{4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})/,
              (match, year, month, day, hour, minute, second) =>
                `${year}-${month.padStart(2, "0")}-${day.padStart(
                  2,
                  "0"
                )}T${hour.padStart(2, "0")}:${minute.padStart(
                  2,
                  "0"
                )}:${second.padStart(2, "0")}`
            )
          );
        };

        const sortedLogs = _.orderBy(
          logsArray,
          [(log) => parseDate(log.timestamp)],
          ["desc"]
        );
        setAccessLogs(sortedLogs);
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, []);

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <div className="p-4">
      <div className="font-light text-sm mb-8">
        This table contains the access logs of all students accessing the labs.
      </div>

      <TableContainer
        component={Paper}
        sx={{ borderRadius: "4px", boxShadow: 1, overflow: "hidden" }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#7393B3" }}>
              <TableCell sx={{ fontWeight: "bold" }}>User ID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>RFID</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accessLogs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log, index) => (
                <TableRow
                  key={index}
                  sx={{ "&:nth-of-type(odd)": { backgroundColor: "#f9f9f9" } }}
                >
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.rfid}</TableCell>
                  <TableCell>{log.timestamp}</TableCell>
                  <TableCell>{log.status}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <TablePagination
        component="div"
        count={accessLogs.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10]}
        onPageChange={handleChangePage}
      />
    </div>
  );
}

export default AccessLogs;
