"use client";

//? React and Next imports
import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

//? Component imports
import ConformationDialogue from "../components/conformationDialogue";
import CreateUpdateModal from "../components/createUpdateModal";

//? UI package imports
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import IconButton from "@mui/material/IconButton";
import { Box, Modal, Typography, Button, Tooltip, Checkbox } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Fab from "@mui/material/Fab";

//? Icons and Image Imports
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

export default function TableUI({
  rows,
  columns,
  showActions,
  stateOptions,
  cityOptions,
  createUpdateDetails,
  conformationDetails,
  deleteurl,
  deleteMethod,
  onDeleteSuccess,
  onAddSuccess,
  specialActions,
  onScrollToEnd,
  selectedUserId,
  selectedRows,
  setSelectedRows,
  onExchangeClick,
}) {
  const router = useRouter();
  // console.log(rows);
  //? FrontEnd extracted data states
  let [token, setToken] = useState(null);
  let [user, setUser] = useState();

  //? Modal and Alert States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openConformationModal, setOpenConformationModal] = useState(false);
  const [openCreateUpdateModal, setOpenCreateUpdateModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const [showFab, setShowFab] = useState(false);

  const [leadsOwner, setLeadsOwner] = useState([]);

  // Use the rows prop directly for rendering
  const [tableRows, setTableRows] = useState(rows);

  useEffect(() => {
    // console.log("Rows passed to TableUI:", rows);
    setTableRows(rows);
  }, [rows]);

  const leadsOptions = [
    { name: "person1 " },
    { name: "person2" },
    { name: "person 3" },
    { name: "person 4" },
  ];

  let getOwnerName = async (ownerId) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/customer/getOwnerName/${ownerId}`;

    // const response = await fetch(url, {
    //   method: "GET",
    //   headers: {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   },
    // });

    // let ownerName = await response.json();
    // // console.log({ ownerName });
    // return ownerName;
     try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

   if (!ownerId) return { username: "Unknown" };

    // Check content type before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return data;
    } else {
      const text = await response.text(); // fallback: get raw response
      console.warn("API returned non-JSON:", text);
      return { username: "Unknown" };
    }
  } catch (err) {
    console.error("Fetch failed:", err);
    return { username: "Unknown" };
  }
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const scrollToTopButtonDisplay = (event, setShowFab) => {
    const { scrollTop } = event.target;
    setShowFab(scrollTop > 10); // Show FAB after scrolling down 200px
  };

  const handleScrollToTop = () => {
    const container = document.getElementById("scrollable-table");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleScroll = (event) => {
    // Update FAB visibility
    scrollToTopButtonDisplay(event, setShowFab);

    const { scrollTop, scrollHeight, clientHeight } = event.target;
    // Load more when user scrolls to bottom (with some buffer)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      onScrollToEnd?.();
    }
  };

  const actions = (row) => {
    const reorderedRow = {
      type: row.type,
      leads_owner: row.leads_owner,
      prefix: row.prefix,
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      phone: row.phone,
      state: row.state,
      city: row.city,
      street: row.street,
      // person:row.person,
      reference: row.reference,
      referred_by: row.referred_by,
    };

    return (
       <Box display="flex" gap={1} alignItems="center">
        {specialActions &&
          specialActions.map((iconObj, index) => (
            <Tooltip key={index} title={iconObj.tooltip || ""}>
              <IconButton
                onClick={() => {
                  iconObj.function(token, router, reorderedRow, user);
                  setSelectedRow(row);
                }}
              >
                <iconObj.icon />
              </IconButton>
            </Tooltip>
          ))}
        <IconButton
          onClick={async () => {
 try {
      const owner = await getOwnerName(reorderedRow.leads_owner);
      const updatedRow = { ...reorderedRow, leads_owner: owner.username || reorderedRow.leads_owner };
      setSelectedRow(updatedRow);
      setOpenCreateUpdateModal(true);
    } catch (err) {
      console.error("Error fetching owner:", err);
      setSelectedRow(reorderedRow); // fallback in case API fails
      setOpenCreateUpdateModal(true);
    }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            setSelectedRow(row);
            setOpenConformationModal(true);
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>
    );
  };

  const handleAddSuccess = (newRow) => {
    setTableRows((prevRows) => {
      const index = prevRows.findIndex(
        (row) => row.customer_id === newRow.customer_id
      );
      if (index !== -1) {
        // Update existing row
        const updatedRows = [...prevRows];
        updatedRows[index] = newRow;
        return updatedRows;
      } else {
        // Add new row
        return [...prevRows, newRow];
      }
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedToken = Cookies.get("token");
      setToken(storedToken);

      let storedUser = Cookies.get("user");
      setUser(storedUser);
    }
  }, []);

  // Handle select all checkbox
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const userRows = tableRows
        .filter(row => row.leads_owner === selectedUserId)
        .map(row => row.customer_id);
      setSelectedRows(userRows);
    } else {
      setSelectedRows([]);
    }
  };

  // Handle individual checkbox selection
  const handleCheckboxChange = (customerId, isChecked) => {
    setSelectedRows(prev => {
      if (isChecked) {
        return [...prev, customerId];
      } else {
        return prev.filter(id => id !== customerId);
      }
    });
  };

  return (
//     <Box
//   sx={{
//     "& .sticky-actions-header": {
//       position: "sticky",
//       top: 0,
//       zIndex: 3,
//       backgroundColor: "#fff"
//     }
//   }}
// >
    <TableContainer
      id="scrollable-table"
      component={Paper}
      sx={{
        maxHeight: "70vh",
        overflowY: "auto",
        "& .sticky-header": {
  position: "sticky",
  top: 0,
  zIndex: 5,
  background: "#fff"
},
        "@media (max-width: 600px)": {
          // padding: "10px",
           paddingBottom: "80px", 
          backgroundColor: "#f9f9f9",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        },
      }}
      onScroll={handleScroll}
    >
      {/* //? Desktop View */}
      <Table
        sx={{
          minWidth: 650,
          "@media (max-width: 600px)": {
            display: "none", // Hide traditional table on mobile
          },
        }}
        aria-label="simple table"
      >
        <TableHead className="sticky-header">
          <TableRow>
            {/* Add select all checkbox in header */}
            {selectedUserId && (
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={
                    selectedRows.length > 0 &&
                    selectedRows.length < tableRows.filter(row => row.leads_owner === selectedUserId).length
                  }
                  checked={
                    tableRows.filter(row => row.leads_owner === selectedUserId).length > 0 &&
                    selectedRows.length === tableRows.filter(row => row.leads_owner === selectedUserId).length
                  }
                  onChange={handleSelectAll}
                />
              </TableCell>
            )}
            {columns.map((column, index) => (
              <TableCell key={index}>{column.headerName}</TableCell>
            ))}
            {showActions ?  <TableCell>Actions</TableCell> : <></>}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.length > 0 ? (
            tableRows.map((row, index) => (
              <TableRow key={index}>
                {/* Add checkbox for rows belonging to selected user */}
                {selectedUserId && row.leads_owner === selectedUserId && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={selectedRows.includes(row.customer_id)}
                      onChange={(e) => handleCheckboxChange(row.customer_id, e.target.checked)}
                    />
                  </TableCell>
                )}
                {/* Loop through columns */}
                {columns.map((column) => (
                  <TableCell key={column.field}>
                    {/*  Combine Prefix + Customer Name */}
                    {column.field === "customer_name" ? (
                      // `${row.prefix || ""} ${row.customer_name || ""}`
                      `${row.customer_name || ""}`
                    ) : column.options ? (
                      <Autocomplete
                        options={column.options}
                        renderInput={(params) => (
                          <TextField {...params} label={column.headerName} />
                        )}
                        value={row[column.field] || ""}
                        onChange={(event, newValue) => {
                          // Handle change logic
                        }}
                      />
                    ) : (
                      row[column.field]
                    )}
                  </TableCell>
                ))}

                {/*  Edit and Delete Buttons */}
                {showActions ? (
                  <TableCell key="more" sx={{ zIndex: 2, textAlign: "left",minWidth: 200, whiteSpace: "nowrap" }}>
                    {actions(row)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length + (showActions ? 1 : 0)}
                align="center"
                sx={{
                  py: 3,
                  fontSize: "1rem",
                  color: "text.secondary",
                }}
              >
                No data found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* //? Mobile view */}
      <Box
        sx={{
          "@media (max-width: 600px)": {
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            maxHeight: "70vh", // Set maximum height
            overflowY: "auto", // Enable vertical scrolling
            padding: "10px",
          },
          display: "none",
        }}
      >
        {tableRows.length > 0 ? (
          tableRows.map(
            (
              row,
              index // Remove slice(0, 3) to show all rows
            ) => (
              <Box
                key={index}
                sx={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  flexWrap: "wrap",
                }}
              >
                {columns.map((column, index) => {
                  if (index < 3) {
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          width: "100%",
                          marginBottom: "8px",
                        }}
                      >
                        <Box
                          sx={{
                            fontWeight: "bold",
                            marginRight: "8px",
                          }}
                        >
                          {column.headerName}:
                        </Box>
                        <Box>{row[column.field]}</Box>
                      </Box>
                    );
                  }

                  if (index === 4) {
                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          width: "100%",
                          justifyContent: "space-between",
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{
                            alignSelf: "center",
                            marginTop: "10px",
                          }}
                          onClick={() => {
                            handleOpenModal();
                            setSelectedRow(row);
                          }}
                        >
                          More Details
                        </Button>

                        {showActions ? actions(row) : null}
                      </Box>
                    );
                  }
                })}
              </Box>
            )
          )
        ) : (
          <Box
            sx={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            No data found
          </Box>
        )}
      </Box>

      {/* //? Modal for More Detials */}
      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            borderRadius: "8px",
          }}
        >
          <Box>
            <Typography
              variant="h5"
              component="h2"
              sx={{ marginBottom: "20px" }}
            >
              Complete Data
            </Typography>

            {Object.keys(selectedRow).map((key) => {
              return (
                <Box
                  key={key}
                  sx={{
                    display: "flex",
                    width: "100%",
                    marginBottom: "8px",
                  }}
                >
                  <Box
                    sx={{
                      fontWeight: "bold",
                      marginRight: "8px",
                    }}
                  >
                    {key}:
                  </Box>
                  <Box>{selectedRow[key]}</Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Modal>

      {/* //? Conformation Dialog */}
      <ConformationDialogue
        openConformationModal={openConformationModal}
        setOpenConformationModal={setOpenConformationModal}
        details={conformationDetails}
        selectedRow={selectedRow}
        deleteurl={deleteurl}
        deleteMethod={deleteMethod}
        onDeleteSuccess={onDeleteSuccess}
      />

      {/* //? Create and Update Modal */}
      <CreateUpdateModal
        openCreateUpdateModal={openCreateUpdateModal}
        setOpenCreateUpdateModal={setOpenCreateUpdateModal}
        details={createUpdateDetails}
        data={selectedRow}
        stateOptions={stateOptions}
        cityOptions={cityOptions}
        disabledFields={["customer_id"]}
        url={`${process.env.NEXT_PUBLIC_API_URL}/customer`}
        method="PUT"
        onAddSuccess={(newRow) => {
          handleAddSuccess(newRow); // Update local state
          onAddSuccess(newRow); // Update parent state
        }}
      />
      {/* Back to Top FAB */}
      {showFab && (
        <Fab
          size="small"
          onClick={handleScrollToTop}
          style={{
            backgroundColor: "white",
            color: "primary",
            position: "absolute",
            bottom: 70,
            right: 40,
            zIndex: 10,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}

      {/* Show exchange button when rows are selected */}
      {selectedRows.length > 0 && (
  <Box sx={{ 
    position: 'sticky',
    mt:2, 
    bottom: 2, 
    right: 0, 
    width: 'auto',
    zIndex: 2, 
    // backgroundColor: 'white',
    padding: '12px',
    display: 'flex',
    justifyContent: 'flex-end',
    borderRadius: '8px', 
    marginTop: '10px',
    // boxShadow: '0 -2px 10px rgba(0,0,0,0.15)' // Enhanced shadow for better visibility
  }}>
    <Button
      variant="contained"
      color="primary"
      onClick={onExchangeClick}
      startIcon={<TrendingFlatIcon />}
      sx={{ padding: '8px 16px' }}
    >
      Exchange Selected ({selectedRows.length})
    </Button>
  </Box>
)}


    </TableContainer>
  
  );
}
