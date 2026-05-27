// "use client";
// import React, { useState, useEffect } from "react";

// import Navbar from "@/components/navbar";
// import BackButton from "@/components/backButton";

// import * as XLSX from "xlsx";

// import {
//   handleEditClick,
//   handleSaveClick,
//   handleCancelClick,
//   handleInputChange,
//   handleAddClick,
//   handleSaveNewRow,
//   validatePhoneNumber,
//   handleDeleteClick,
//   confirmDelete,
//   filterRows,
// } from "./materialsHelper.js";

// import { styled } from "@mui/material/styles";
// import {
//   Box,
//   Button,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   TextField,
//   Tooltip,
//   Snackbar,
//   Alert,
//   Select,
//   MenuItem,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import EditIcon from "@mui/icons-material/Edit";
// import FileUploadIcon from "@mui/icons-material/FileUpload";
// import FileDownloadIcon from "@mui/icons-material/FileDownload";
// import DeleteIcon from "@mui/icons-material/Delete";
// import SaveIcon from "@mui/icons-material/Save";
// import CancelIcon from "@mui/icons-material/Cancel";
// import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

// export default function Inventory() {
//   const token = Cookies.get("token");
//   const [rows, setRows] = useState([
//     {
//       inventory_id: "",
//       part_name: "",
//       part_number: "",
//       description: "",
//       category: "",
//       quantity: "",
//       price: "",
//     },
//   ]);

//   const [editRowId, setEditRowId] = useState(null);
//   const [editedData, setEditedData] = useState({});
//   const [isAdding, setIsAdding] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [showError, setShowError] = useState(false);
//   const [jsonData, setJsonData] = useState(null);
//   const [deleteRowId, setDeleteRowId] = useState(null);
//   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [filterType, setFilterType] = useState("");

//   const VisuallyHiddenInput = styled("input")({
//     clip: "rect(0 0 0 0)",
//     clipPath: "inset(50%)",
//     overflow: "hidden",
//     position: "absolute",
//     bottom: 0,
//     left: 0,
//   });

//   const filteredRows = filterRows(rows, searchQuery, filterType);

//   useEffect(() => {
//     async function fetchInventory() {
//       try {
//         const token = Cookies.get("token");
//         if (!token) {
//           throw new Error("No token found. Please log in.");
//         }

//         const response = await fetch(
//           `${process.env.NEXT_PUBLIC_API_URL}/inventory`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//             },
//           }
//         );

//         if (!response.ok) throw new Error("Failed to fetch entries");

//         const data = await response.json();
//         setRows(data);

//         // setFilteredEntries(data);
//         setLoading(false);
//       } catch (err) {
//         // setError(err.message);
//         // setSnackbarMessage(err.message); // Set error message for Snackbar
//         // setOpenSnackbar(true); // Show Snackbar with error message
//         // setLoading(false);
//       }
//     }
//     fetchInventory();
//   }, []);

//   // Close Error Message
//   const handleCloseError = () => {
//     setShowError(false);
//   };

//   const handleExcelUpload = async (event) => {
//     const file = event.target.files[0];

//     const reader = new FileReader();

//     reader.onload = async (e) => {
//       const arrayBuffer = e.target.result;
//       const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
//       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//       const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
//       const header = jsonData[4];
//       const rows = jsonData.slice(5);
//       const uniquePhoneNumbers = new Set();
//       const result = [];

//       //! remove later
//       let inc = 0;
//       //!

//       rows.forEach((row, index) => {
//         const rowData = {
//           category: row[0],
//           part_name: row[1],
//           quantity: row[2],
//           price: row[3],
//           description: row[4],
//         };

//         inc++;

//         if (rowData.category != undefined) {
//           result.push(rowData);
//           console.log("rd", rowData);
//         } else {
//           console.warn("Missing category in row:", rowData);
//         }
//       });

//       // setRows((existingRows) => [...result, ...existingRows]);

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/inventory/bulkUpload`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//           body: JSON.stringify({ items: result }),
//         }
//       );
//       console.log(response);

//       if (!response.ok) {
//         setShowError(response.statusText);
//       } else {
//         location.reload();
//       }
//     };

//     reader.readAsArrayBuffer(file);
//   };

//   return (
//     <div>
//       <Navbar />
//       <Box
//         sx={{
//           backgroundImage: "url('../../assets/images/bg.jpg')",
//           backgroundSize: "cover",

//           minHeight: "89vh",
//         }}
//       >
//         <Box paddingX="1%">
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               marginBottom: "16px",
//             }}
//           >
//             <div style={{ display: "flex" }}>
//               <BackButton />
//               <h1 style={{ marginLeft: "10px", color: "white" }}>
//                 Inventory Master
//               </h1>
//             </div>
//             <div style={{ display: "flex", gap: 5 }}>
//               {/* Search Field */}
//               <TextField
//                 label="Search"
//                 variant="outlined"
//                 disabled={editRowId ? true : false}
//                 size="small"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 sx={{ backgroundColor: "white", borderRadius: 1 }}
//               />

//               {/* Filter Dropdown */}
//               <Select
//                 value={filterType}
//                 onChange={(e) => setFilterType(e.target.value)}
//                 displayEmpty
//                 disabled={editRowId ? true : false}
//                 variant="outlined"
//                 size="small"
//                 sx={{ backgroundColor: "white", borderRadius: 1 }}
//               >
//                 <MenuItem value="">All</MenuItem>
//                 <MenuItem value="spares">spares</MenuItem>
//                 <MenuItem value="accessories">accessories</MenuItem>
//               </Select>
//               <Tooltip title="Add Item">
//                 <IconButton
//                   aria-label="addItem"
//                   disabled={editRowId ? true : false}
//                   onClick={() =>
//                     handleAddClick(setEditRowId, setEditedData, setIsAdding)
//                   }
//                   sx={{
//                     borderRadius: 1,
//                     padding: "0 10px",
//                     backgroundColor: "white",
//                     "&:hover": {
//                       backgroundColor: "white",
//                     },
//                   }}
//                 >
//                   <AddIcon fontSize="small" />
//                 </IconButton>
//               </Tooltip>

//               <Tooltip title="Download Template">
//                 <IconButton
//                   aria-label="downloadTemplate"
//                   disabled={editRowId ? true : false}
//                   href="/Auto_Doc_Cockpit_INV-Template.xlsx"
//                   sx={{
//                     borderRadius: 1,
//                     padding: "0 10px",
//                     backgroundColor: "white",
//                     "&:hover": {
//                       backgroundColor: "white",
//                     },
//                   }}
//                 >
//                   <FileDownloadIcon fontSize="small" />
//                 </IconButton>
//               </Tooltip>
//               <Tooltip title="Upload Inventory">
//                 <Button
//                   component="label"
//                   disabled={editRowId ? true : false}
//                   role={undefined}
//                   variant="contained"
//                   tabIndex={-1}
//                   sx={{
//                     color: "#616161",
//                     borderRadius: 1,
//                     backgroundColor: "white",
//                     "&:hover": {
//                       backgroundColor: "white",
//                     },
//                   }}
//                   startIcon={<FileUploadIcon sx={{ color: "#616161" }} />}
//                 >
//                   Upload Leads
//                   <VisuallyHiddenInput
//                     type="file"
//                     onChange={handleExcelUpload}
//                     multiple
//                   />
//                 </Button>
//               </Tooltip>
//             </div>
//           </div>

//           <div
//             style={{
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             <TableContainer component={Paper}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell sx={{ padding: "10px 16px" }}>
//                       Material ID
//                     </TableCell>
//                     <TableCell sx={{ padding: "10px 16px" }}>
//                       Category
//                     </TableCell>
//                     <TableCell sx={{ padding: "10px 16px" }}>Name</TableCell>

//                     <TableCell sx={{ padding: "10px 16px" }}>
//                       Description
//                     </TableCell>
//                     <TableCell sx={{ padding: "10px 16px" }}>
//                       Available Quantity
//                     </TableCell>
//                     <TableCell sx={{ padding: "10px 16px" }}>Price</TableCell>
//                     <TableCell sx={{ padding: "10px 16px" }}>Actions</TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {isAdding && (
//                     <TableRow>
//                       <TableCell>
//                         <TextField
//                           name="inventory_id"
//                           value={editedData.inventory_id || ""}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           variant="standard"
//                           placeholder=""
//                           disabled
//                         />
//                       </TableCell>

//                       <TableCell>
//                         {/* Dropdown for Type */}
//                         <Select
//                           name="category"
//                           value={editedData.category || ""}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           variant="standard"
//                           displayEmpty
//                         >
//                           <MenuItem value="" disabled>
//                             Select Category
//                           </MenuItem>
//                           <MenuItem value="spares">spares</MenuItem>
//                           <MenuItem value="accessories">accessories</MenuItem>
//                         </Select>
//                       </TableCell>

//                       <TableCell>
//                         {/* Phone number validation */}
//                         <TextField
//                           name="part_name"
//                           value={editedData.part_name || ""}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           variant="standard"
//                           placeholder="Enter Material Name"
//                           inputProps={{ maxLength: 10 }}
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <TextField
//                           name="part_number"
//                           value={editedData.part_number || ""}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           variant="standard"
//                           placeholder="Enter Material Number"
//                         />
//                       </TableCell>

//                       <TableCell>
//                         <TextField
//                           name="description"
//                           value={editedData.description}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           // onBlur={() => {
//                           //   if (!editedData.description) {
//                           //     setEditedData((prev) => ({
//                           //       ...prev,
//                           //       city: "Sivakasi",
//                           //     }));
//                           //   }
//                           // }}
//                           variant="standard"
//                           placeholder="Enter description"
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <TextField
//                           name="quantity"
//                           state
//                           value={editedData.quantity}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           // onBlur={() => {
//                           //   if (!editedData.state) {
//                           //     setEditedData((prev) => ({
//                           //       ...prev,
//                           //       state: "Tamil Nadu",
//                           //     }));
//                           //   }
//                           // }}
//                           variant="standard"
//                           placeholder="Enter quantity"
//                         />
//                       </TableCell>

//                       <TableCell>
//                         <TextField
//                           name="price"
//                           state
//                           value={editedData.price}
//                           onChange={(e) => handleInputChange(e, setEditedData)}
//                           // onBlur={() => {
//                           //   if (!editedData.state) {
//                           //     setEditedData((prev) => ({
//                           //       ...prev,
//                           //       state: "Tamil Nadu",
//                           //     }));
//                           //   }
//                           // }}
//                           variant="standard"
//                           placeholder="Enter Price"
//                         />
//                       </TableCell>

//                       <TableCell>
//                         <IconButton
//                           onClick={() => {
//                             if (!editedData.category || !editedData.part_name) {
//                               setErrorMessage(
//                                 "Category and Name are required."
//                               );
//                               setShowError(true);
//                             } else {
//                               let added = handleSaveNewRow(
//                                 editedData,
//                                 setRows,
//                                 setEditRowId,
//                                 setEditedData,
//                                 setIsAdding,
//                                 setErrorMessage,
//                                 setShowError
//                               );

//                               added ? location.reload() : null;
//                             }
//                           }}
//                         >
//                           <SaveIcon />
//                         </IconButton>
//                         <IconButton
//                           onClick={() =>
//                             handleCancelClick(
//                               setEditRowId,
//                               setEditedData,
//                               setIsAdding
//                             )
//                           }
//                         >
//                           <CancelIcon />
//                         </IconButton>
//                       </TableCell>
//                     </TableRow>
//                   )}
//                   {filteredRows.length > 0 ? (
//                     filteredRows.map((row) => (
//                       <TableRow
//                         key={row.inventory_id}
//                         sx={{
//                           backgroundColor:
//                             editRowId && row.inventory_id == editRowId
//                               ? "lightGray"
//                               : "",
//                         }}
//                       >
//                         <TableCell>{row.inventory_id}</TableCell>

//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <Select
//                               name="category"
//                               value={editedData.category}
//                               onChange={(e) =>
//                                 handleInputChange(e, setEditedData)
//                               }
//                               variant="standard"
//                               displayEmpty
//                             >
//                               <MenuItem value="spares">Spares</MenuItem>
//                               <MenuItem value="accssories">
//                                 Accessories
//                               </MenuItem>
//                             </Select>
//                           ) : (
//                             row.category
//                           )}
//                         </TableCell>

//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <TextField
//                               name="part_name"
//                               value={editedData.part_name || ""}
//                               onChange={(e) =>
//                                 handleInputChange(e, setEditedData)
//                               }
//                               variant="standard"
//                             />
//                           ) : (
//                             row.part_name
//                           )}
//                         </TableCell>

//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <TextField
//                               name="description"
//                               value={editedData.description || ""}
//                               onChange={(e) =>
//                                 handleInputChange(e, setEditedData)
//                               }
//                               variant="standard"
//                             />
//                           ) : (
//                             row.description
//                           )}
//                         </TableCell>
//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <TextField
//                               name="quantity"
//                               value={editedData.quantity || ""}
//                               onChange={(e) =>
//                                 handleInputChange(e, setEditedData)
//                               }
//                               variant="standard"
//                             />
//                           ) : (
//                             row.quantity
//                           )}
//                         </TableCell>

//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <TextField
//                               name="price"
//                               value={editedData.price || ""}
//                               onChange={(e) =>
//                                 handleInputChange(e, setEditedData)
//                               }
//                               variant="standard"
//                             />
//                           ) : (
//                             row.price
//                           )}
//                         </TableCell>

//                         <TableCell>
//                           {editRowId === row.inventory_id ? (
//                             <>
//                               <IconButton
//                                 onClick={() =>
//                                   handleSaveClick(
//                                     row.inventory_id,
//                                     editedData,
//                                     setRows,
//                                     setEditRowId,
//                                     setEditedData
//                                   )
//                                 }
//                               >
//                                 <SaveIcon />
//                               </IconButton>
//                               <IconButton
//                                 onClick={() =>
//                                   handleCancelClick(
//                                     setEditRowId,
//                                     setEditedData,
//                                     setIsAdding
//                                   )
//                                 }
//                               >
//                                 <CancelIcon />
//                               </IconButton>
//                             </>
//                           ) : (
//                             <>
//                               <Tooltip title="Convert To Customer">
//                                 <IconButton disabled={editRowId ? true : false}>
//                                   <PersonAddAlt1Icon />
//                                 </IconButton>
//                               </Tooltip>
//                               <Tooltip title="Edit">
//                                 <IconButton
//                                   disabled={editRowId}
//                                   onClick={() =>
//                                     handleEditClick(
//                                       row,
//                                       setEditRowId,
//                                       setEditedData
//                                     )
//                                   }
//                                 >
//                                   <EditIcon />
//                                 </IconButton>
//                               </Tooltip>
//                               <Tooltip title="Delete">
//                                 <IconButton
//                                   disabled={editRowId ? true : false}
//                                   onClick={() =>
//                                     handleDeleteClick(
//                                       row.inventory_id,
//                                       setDeleteRowId,
//                                       setOpenDeleteDialog
//                                     )
//                                   }
//                                 >
//                                   <DeleteIcon />
//                                 </IconButton>
//                               </Tooltip>
//                             </>
//                           )}
//                         </TableCell>
//                       </TableRow>
//                     ))
//                   ) : (
//                     <TableRow>
//                       <TableCell colSpan={7} align="center">
//                         No Customer Found
//                       </TableCell>
//                     </TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           </div>
//         </Box>
//       </Box>

//       {/* Deletion Conformation Dialogue */}
//       <Dialog
//         open={openDeleteDialog}
//         onClose={() => setOpenDeleteDialog(false)}
//       >
//         <DialogTitle>Confirm Deletion</DialogTitle>
//         <DialogContent>
//           Are you sure you want to delete this lead? This action cannot be
//           undone.
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
//             Cancel
//           </Button>
//           <Button
//             onClick={() => {
//               let deleted = confirmDelete(
//                 setRows,
//                 deleteRowId,
//                 setOpenDeleteDialog,
//                 setShowError
//               );

//               deleted ? location.reload() : null;
//             }}
//             color="error"
//           >
//             Confirm
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar for Error Message */}
//       <Snackbar
//         open={showError}
//         autoHideDuration={4000}
//         onClose={handleCloseError}
//       >
//         <Alert
//           onClose={handleCloseError}
//           severity="error"
//           sx={{ width: "100%" }}
//         >
//           {errorMessage}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// }
