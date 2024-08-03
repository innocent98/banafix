import "./data.scss";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
// import axios from "axios";
import { axiosInstance } from "../../config";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Context } from "../../context/Context";
import { decode } from "jsonwebtoken";

const columns = [
  { id: "fullName", label: "Full Name", minWidth: 170 },
  { id: "gender", label: "Gender", minWidth: 100 },
  {
    id: "cetreChoice",
    label: "Center Choice",
    minWidth: 170,
  },
  {
    id: "instrument",
    label: "Instrument",
    minWidth: 100,
  },
  {
    id: "level",
    label: "Level",
    minWidth: 100,
  },
  {
    id: "phone",
    label: "Phone Number",
    minWidth: 100,
  },
  {
    id: "applicationDate",
    label: "Application Date",
    minWidth: 100,
  },
  {
    id: "actions",
    label: "Actions",
    minWidth: 100,
  },
];

const Data = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [students, setStudents] = useState([]);

  const accessToken = useContext(Context);
  const { dispatch } = useContext(Context);

  // fetch all applicants
  useEffect(() => {
    const fetchStudents = async () => {
      const res = await axiosInstance.get("/student/students");
      setStudents(res.data);
    };
    fetchStudents();
  }, [setStudents]);

  // filter applicants
  const [query, setQuery] = useState("");

  const handleChange = (e) => {
    setQuery(e.target.value.toLowerCase());
  };
  useEffect(() => {
    const fetchStudents = async () => {
      const res = await axiosInstance.get(
        `/student/students/filter/?students=${query}`
      );
      setStudents(res.data);
    };
    fetchStudents();
  }, [query, setStudents]);

  // data table
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  //logout a user automatically when session expired
  const handleLogout = async () => {
    dispatch({ type: "LOGOUT" });
  };

  useEffect(() => {
    const token = accessToken.accessToken;
    if (token) {
      const decodedToken = decode(token);
      if (decodedToken.exp * 1000 < new Date().getTime()) {
        handleLogout();
        return alert("Session expired! kindly login again to continue");
      }
    }
  });

  return (
    <div className="data">
      <div className="search">
        <form className="searchForm">
          <input
            className="form-control shadow-none"
            type="search"
            placeholder="Search"
            aria-label="Search"
            onChange={handleChange}
          />
          <span className="material-icons searchIcon">search</span>
        </form>
      </div>
      <Paper sx={{ width: "100%", overflow: "hidden" }} className="paper">
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead className="tableHead">
              <TableRow className="tableRow">
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align}
                    style={{ minWidth: column.minWidth }}
                    className="tableCell"
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody className="tableBody">
              {students
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((s) => {
                  return (
                    <>
                      <tr key={s._id}>
                        <td>{s.firstName + " " + s.lastName}</td>
                        <td>{s.gender}</td>
                        <td>{s.centreChoice}</td>
                        <td>{s.instrument}</td>
                        <td>{s.level}</td>
                        <td>{s.phone}</td>
                        <td>{s.createdAt}</td>
                        <td>
                          <Link to={`/student/${s._id}`} className="actions">
                            Actions
                          </Link>
                        </td>
                        <td>
                          <div
                            className={s.isActive ? "active" : "inactive"}
                          ></div>
                        </td>
                      </tr>
                      <br />
                    </>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={students.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </div>
  );
};

export default Data;
