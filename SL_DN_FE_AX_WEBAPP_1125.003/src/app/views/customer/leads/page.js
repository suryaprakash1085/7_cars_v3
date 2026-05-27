"use client";

//? React and Next imports
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";


//? Function imports
import {
  filterRows,
  handleExcelUpload,
  getAllLeads,
  getTotalLeadsCount,
  // getTotalBlacklistedCount,
  convertToCustomer,
  exchangeLeads,
  fetchLeadsData,
  fetchCompanyDetails,
  handleScrollToEnd,
} from "../../../../../controllers/LeadsControllers.js";

//? Component imports
import Navbar from "@/components/navbar.js";
// import TableUI from "../../../ui/table.js";
import TableUI from "@/ui/table.js";
// import CreateUpdateModal from "../../../components/createUpdateModal.js";
import CreateUpdateModal from "@/components/createUpdateModal.js";
// import AppAlert from "../../../components/snackBar.js";
import AppAlert from "@/components/snackBar.js";
import BackButton from "@/components/backButton";

//? Functional package imports
import { State, City } from "country-state-city";
import * as XLSX from "xlsx";

//? UI package imports
import { styled } from "@mui/material/styles";
import {
  Box,
  Button,
  IconButton,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
  Fab,
  Badge,
  Modal,
  Typography,
  Autocomplete,
} from "@mui/material";

//? Images and icon imports
import AddIcon from "@mui/icons-material/Add";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";

//? Checkbox import
import Checkbox from "@mui/material/Checkbox";
import LoadingScreen from "@/components/loadingScreen.js";

const columns = [
  { field: "type", headerName: "Type", width: 150 },
  { field: "customer_name", headerName: "Customer Name", width: 150 },
  { field: "phone", headerName: "Phone No", width: 150 },
  { field: "state", headerName: "State", width: 150 },
  { field: "city", headerName: "City", width: 150 },
  { field: "street", headerName: "Street", width: 150 },

  // { field: "leads_owner", headerName: "Lead Owner", width: 150 },
];

export default function LeadsMaster() {
  const router = useRouter();

  //? FrontEnd extracted data states
  let [token, setToken] = useState(null);
  let [user, setUser] = useState();
  let [userRole, setUserRole] = useState(null);

  //? Modal and Alert states
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState();
  // const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [snackBarSeverity, setSnackBarSeverity] = useState();

  const [isLoading, setIsLoading] = useState(true);
  let [loadingDialogue, setLoadingDialogue] = useState("Please Wait...");
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  // const limit = 10000000;
  // const limit = 10;

  //? FrontEnd form input states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [limit, setLimit] = useState(0); //  Default to a number
  const [leadsCount, setLeadsCount] = useState(0);
const [blacklistedCount, setBlacklistedCount] = useState(0);


  //? Backend data states
  const [rows, setRows] = useState([]);

  const VisuallyHiddenInput = styled("input")({
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    overflow: "hidden",
    position: "absolute",
    bottom: 0,
    left: 0,
  });

  // Add new state for selected user
  const [selectedUserId, setSelectedUserId] = useState(null);


  // Update the filteredRows logic with console logging for debugging
  const filteredRows = rows.filter((row) => {
    if (selectedUserId) {
      return row.leads_owner === selectedUserId;
    }
    return true;
  });

  const [allCount, setAllCount] = useState(0);
 
  const TotalCount = leadsCount + blacklistedCount;

  // Add state variables for selected state and city
  // const [states, setStates] = useState([]);
  const [states, setStates] = useState("Tamil Nadu");

  const [cities, setCities] = useState("sivakasi");

  // Add state variables for modal open/close
  const [openCreateUpdateModal, setOpenCreateUpdateModal] = useState(false);
  const [alertData, setAlertData] = useState({
    openAlert: false,
    message: "",
    severity: "info",
    duration: 2000,
  });

  const handleCloseSnackBar = (setOpenSnackbar) => {
    setOpenSnackbar(false);
  };

  // Add state for modal open/close
  const [openCustomModal, setOpenCustomModal] = useState(false);

  // Define the data object to send to the modal
  const initialData = {
    type: "",
    // customer_id: "",
    prefix: "",
    customer_name: "",
    phone: "",
    state: "Tamil Nadu",
    city: "Sivakasi",
    street: "",
    leads_owner: "",
    //  addcustomers:"",
    reference: "",
    referred_by: "",
  };

 
  // State for managing the data to be sent to the modal
  const [data, setData] = useState(initialData);

  const [usernames, setUsernames] = useState([]); // State for usernames

  // Add state for tracking the "to" user
  const [selectedToUserId, setSelectedToUserId] = useState(null);

  const showAlert = (alertData) => {
    // console.log("alerting"); 
    setAlertData(alertData);
  };

  const handleDeleteSuccess = (deletedId) => {
    setRows((prevRows) =>
      prevRows.filter((row) => row.customer_id !== deletedId)
    );
  };

  const handleAddSuccess = (newRow) => {
    setRows((prevRows) => {
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

  const handleOpenCustomModal = () => setOpenCustomModal(true);
  const handleCloseCustomModal = () => setOpenCustomModal(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedToken = Cookies.get("token");
      setToken(storedToken);

      let storedUser = Cookies.get("user");
      setUser(storedUser);

      let storedUserRole = Cookies.get("role");
      setUserRole(storedUserRole);

      getTotalLeadsCount(storedToken, setLeadsCount, setBlacklistedCount);

      fetchCompanyDetails(storedToken, setLimit);

      // Fetch usernames
      fetchUsernames(storedToken);
    }
  }, []);

  useEffect(() => {
    if (limit > 0) {
      getAllLeads(
        token,
        setRows,
        showAlert,
        limit, //  Ensures `limit` is set before calling
        isLoading,
        setIsLoading,
        hasMore,
        setHasMore,
        offset,
        setOffset,
        filterType,
        setAllCount
      );
    }
  }, [limit]);

  const fetchUsernames = async (token) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      // console.log({ data });

      // Ensure 'data' is an array before filtering
      if (Array.isArray(data)) {
        const filteredUsers = data.filter((user) => user.role_type !== "Admin");
        setUsernames(filteredUsers);
      } else {
        // console.log("Unexpected API response format:", data);
      }
    } catch (error) {
      // console.log("Error fetching usernames:", error);
    }
  };

  useEffect(() => {
    // Load states for India initially
    const statesData = State.getStatesOfCountry("IN").map((state) => ({
      ...state,
      label: state.name,
    }));
    setStates(statesData);
  }, []);

  useEffect(() => {
    if (selectedUserId !== null) {
      // console.log("Updated selectedUserId:", selectedUserId);
      fetchLeadsData(
        token,
        selectedUserId,
        setRows,
        setOpenSnackbar,
        setSnackbarMessage,
        setSnackBarSeverity
      );
    }
  }, [selectedUserId]); // Runs whenever selectedUserId changes


//  const filterStyle = (active) => ({
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   backgroundColor: active ? "#1976d2" : "#f9f9f9",
//   color: active ? "white" : "black",
//   height: "30px",
//   width: "60px",
//   padding: "10px",
//   textAlign: "center",
//   cursor: "pointer",
//   borderRadius: "15px",
//   boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
// });
const filterStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    height: "30px",
    width: "60px",
    padding: "10px",
    textAlign: "center",
    cursor: "pointer",
    borderRadius: "15px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  // const handleScrollToEnd = () => {
  //   if (hasMore && !isLoading) {
  //     getAllLeads(
  //       token,
  //       setRows,
  //       showAlert,
  //       limit,
  //       isLoading,
  //       setIsLoading,
  //       hasMore,
  //       setHasMore,
  //       offset,
  //       setOffset,
  //       filterType,
  //       setAllCount
  //     );
  //   }
  // };
  // console.log("Blacklisted Count:", blacklistedCount);
  // console.log("Leads Count:", leadsCount);
  // Move selectedRows state up to parent component

  // const handleScrollToEnd = () => {
  //   // if (filterType != "") {
  //   //   if (filterType === "BlackList") {
  //   //   filterRows( token,
  //   //     rows,
  //   //     setRows,
  //   //     searchQuery,
  //   //     filterType,
  //   //     showAlert
  //   //   )
  //   //   return;
  //   // } else if (filterType === "Lead") {
  //   //   filterRows( token,
  //   //     rows,
  //   //     setRows,
  //   //     searchQuery,
  //   //     filterType,
  //   //     showAlert
  //   //   )
  //   // }
  //   // else {
  //   if (hasMore && !isLoading) {
  //     getAllLeads(
  //       token,
  //       setRows,
  //       showAlert,
  //       limit,
  //       isLoading,
  //       setIsLoading,
  //       hasMore,
  //       setHasMore,
  //       offset,
  //       setOffset,
  //       filterType,
  //       setAllCount
  //     );
  //   }
  //   // }
  // };

  const [selectedRows, setSelectedRows] = useState([]);
 const pageType = Cookies.get("page_type"); // "tab" or others

  // Handle exchange button click
  const handleExchangeClick = () => {
    setOpenCustomModal(true);
  };

  return isLoading ? (
    <LoadingScreen Dialogue={loadingDialogue} />
  ) : (
    <>
      {/* //? Navbar */}
      {/* <Navbar pageName="Leads" /> */}
       {pageType !== "tab" && <Navbar pageName="Leads" />}
         
      {/* <BackButton /> */}

      <Box paddingX="1%" paddingBottom="20px">
        <Box paddingX="1%">
          <Box
            sx={{
              display: "flex",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
              justifyContent: {
                xs: "flex-start",
                sm: "space-between",
              },
              marginBottom: "16px",
              flexDirection: {
                xs: "column", // Mobile (xs and below)
                sm: "row", // Desktop (sm and above)
              },
            }}
          >
            {/* //? Filters Section */}
            <Box
              style={{
                display: "flex",
               
              }}
            >
              {/* //? Filter Buttons */}
              <Box
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
                sx={{ mt: "20px" }}   
              >
                {/* //? Filter All */}
                <Box
                  onClick={() => {
                    setFilterType("All");
                    setRows([]);
                    setHasMore(true);
                    filterRows(
                      token,
                      rows,
                      setRows,
                      searchQuery,
                      "All",
                      showAlert,
                      true,
                      setHasMore,
                      limit,
                      0,
                      setOffset
                      
                    );
                  }}
                >
                  <Badge
                    badgeContent={TotalCount}
                    max={99999}
                    color="primary"
                  >
                    <div style={filterStyle}>All</div>
                  </Badge>
                </Box>

                {/* //? Filter Leads */}
                <Box
                  onClick={() => {
                    setFilterType("Lead");
                    setRows([]);
                    filterRows(
                      token,
                      rows,
                      setRows,
                      searchQuery,
                      "Lead",
                      showAlert,
                      hasMore,
                      setHasMore,
                      limit,
                      0,
                      setOffset
                      // setOpenSnackbar,
                      // setSnackbarMessage,
                      // setSnackBarSeverity
                    );
                  }}
                >
                  <Badge badgeContent={leadsCount} max={99999} color="primary">
                    <div style={filterStyle}>
                      Leads <br />
                    </div>
                  </Badge>
                </Box>

                {/* //? Filter Blocklist */}
                <Box
                  onClick={() => {
                    setFilterType("BlackList");
                    setRows([]);
                    filterRows(
                      token,
                      rows,
                      setRows,
                      searchQuery,
                      "BlackList",
                      showAlert,
                      hasMore,
                      setHasMore,
                      limit,
                      0,
                      setOffset
                      // setOpenSnackbar,
                      // setSnackbarMessage,
                      // setSnackBarSeverity
                    );
                  }}
                >
                  <Badge
                    badgeContent={blacklistedCount}
                    max={99999}
                    color="primary"
                  >
                    <div style={filterStyle}>Blacklisted</div>
                  </Badge>
                </Box>
              </Box>
            </Box>

            {userRole == "Admin" || userRole == "Power Admin" ? (
              <Box sx={{ width: "20%" }}>
                <Autocomplete
                  variant="outlined"
                  size="small"
                  options={usernames.map((username) => ({
                    label: username.username,
                    id: username.user_id,
                  }))}
                  onChange={(event, newValue) => {
                    // setSelectedUserId(newValue?.id||null);

                    const selectedUserId = newValue?.id || null;
                    setSelectedUserId(selectedUserId);

                    if (selectedUserId) {
                      // Fetch leads data for the selected user
                      fetchLeadsData(
                        token, // Pass token
                        selectedUserId,
                        setRows, // Update table rows
                        setOpenSnackbar,
                        setSnackbarMessage,
                        setSnackBarSeverity
                      );
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select User"
                      variant="outlined"
                      sx={{ backgroundColor: "white", borderRadius: 1 }}
                    />
                  )}
                  getOptionLabel={(option) => option.label}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.label}
                    </li>
                  )}
                />
              </Box>
            ) : (
              ""
            )}

            {/* //? Actions Section */}
            <Box style={{ display: "flex", gap: 5 }}>
              {/* //? Search Field */}
              <TextField
                label="Search"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyUp={(e) => {
                 if(e.key === "Enter") {
                  filterRows(
      token,                       
      rows,                       
      setRows,                    
      searchQuery,                
      filterType || "All",         
      showAlert,                  
      hasMore,                     
      setHasMore,                  
      limit > 0 ? limit : 100,    
      0,                           
      setOffset                     
    );
                 }
                   
                }}
                sx={{ backgroundColor: "white", borderRadius: 1 }}
              />

              {/* //? Add Lead Button */}
              <Tooltip title="Add Lead">
                <IconButton
                  aria-label="addLead"
                  onClick={() => {
                    setOpenCreateUpdateModal(true);
                    setData(initialData); // Set the initial data for the modal
                  }}
                  sx={{
                    borderRadius: 1,
                    padding: "0 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* //? Download Template Button */}
              {/* <Tooltip title="Download Template">
                <IconButton
                  aria-label="downloadTemplate"
                  href="/Auto_Doc_Cockpit_CUST-Template.xlsx"
                  sx={{
                    borderRadius: 1,
                    padding: "0 10px",
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip> */}

              {/* //? Upload Leads Button */}
              {/* <Tooltip title="Upload Leads">
                <Button
                  component="label"
                  role={undefined}
                  variant="contained"
                  tabIndex={-1}
                  sx={{
                    color: "#616161",
                    borderRadius: 1,
                    backgroundColor: "white",
                    "&:hover": {
                      backgroundColor: "white",
                    },
                  }}
                  startIcon={<FileUploadIcon sx={{ color: "#616161" }} />}
                >
                  Upload Leads
                  <VisuallyHiddenInput
                    type="file"
                    onChange={(event) =>
                      handleExcelUpload(
                        token,
                        event,
                        showAlert,
                        setIsLoading,
                        setRows,
                        isLoading,
                        limit,
                        hasMore,
                        setHasMore,
                        offset,
                        setOffset,
                        setLoadingDialogue
                      )
                    }
                    multiple
                  />
                </Button>
              </Tooltip> */}

              {/* //? Open Custom Modal Button */}
              {/* <Button onClick={handleOpenCustomModal}>Open Modal</Button> */}
              {/* <Tooltip title="Transfer ownership">
                    <IconButton
                      aria-label="transferOwnership"
                      onClick={handleOpenCustomModal}
                      sx={{
                        borderRadius: 1,
                        padding: "0 10px",
                        backgroundColor: "white",
                        "&:hover": {
                          backgroundColor: "white",
                        },
                      }}
                    >
                      <TrendingFlatIcon fontSize="small" />
                    </IconButton>
                  </Tooltip> */}
            </Box>
          </Box>

          {/* //? Table Section */}
          <Box
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
              width: "100%",      // optional, ensures full width

            }}
          >
            {/* {console.log({ filteredRows })} */}
            {/* //? Render Table UI */}
            <TableUI
              rows={filteredRows}
              columns={columns}
              showActions={true}
              stateOptions={states}
              cityOptions={City}
              createUpdateDetails={{ name: "Lead", action: "Update" }}
              conformationDetails={{ name: "lead", action: "delete" }}
              deleteurl={`${process.env.NEXT_PUBLIC_API_URL}/customer/delete`}
              deleteMethod="DELETE"
              onDeleteSuccess={handleDeleteSuccess}
              onAddSuccess={handleAddSuccess}
              specialActions={[
                {
                  icon: PersonAddAlt1Icon,
                  tooltip: "Convert To Customer",
                  function: convertToCustomer,
                }, //!send single Icon
              ]}
              onScrollToEnd={() => {
                handleScrollToEnd(
                  hasMore,
                  isLoading,
                  token,
                  setRows,
                  showAlert,
                  limit,
                  setIsLoading,
                  setHasMore,
                  offset,
                  setOffset,
                  filterType,
                  setAllCount,
                  isFetching,
                  setIsFetching
                );
              }}
              selectedUserId={selectedUserId}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              onExchangeClick={handleExchangeClick}
            />
          </Box>
        </Box>
      </Box>
      {/* //? Render Create and Update Modal */}
      <CreateUpdateModal
        openCreateUpdateModal={openCreateUpdateModal}
        setOpenCreateUpdateModal={setOpenCreateUpdateModal}
        details={{ action: "Add", name: "Lead" }}
        data={data} // Pass the data state to the modal
        stateOptions={states}
        cityOptions={cities}
        url={`${process.env.NEXT_PUBLIC_API_URL}/customer/addLeads`}
        method="POST"
        // disabledFields={["type"]} // Specify which fields to disable
        onAddSuccess={handleAddSuccess}
      />
      {/* //? Render Alert */}
      <AppAlert alertData={alertData} />
      <Modal open={openCustomModal} onClose={handleCloseCustomModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 4,
            zIndex: 1300,
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Exchange {selectedRows.length} Selected Leads
          </Typography>
          <Box display="flex" justifyContent="space-between">
            <Box sx={{ width: "45%" }}>
              <Typography variant="subtitle1">FROM</Typography>
              <Autocomplete
                disabled
                value={{
                  label:
                    usernames.find((user) => user.user_id === selectedUserId)
                      ?.username || "",
                  id: selectedUserId,
                }}
                options={[]}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selected User"
                    variant="outlined"
                  />
                )}
              />
            </Box>
            <Box sx={{ width: "45%" }}>
              <Typography variant="subtitle1">TO</Typography>
              <Autocomplete
                options={usernames
                  .filter((user) => user.user_id !== selectedUserId)
                  .map((username) => ({
                    label: username.username,
                    id: username.user_id,
                  }))}
                onChange={(event, newValue) => {
                  setSelectedToUserId(newValue?.id || null);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select User"
                    variant="outlined"
                  />
                )}
              />
            </Box>
          </Box>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}
          >
            <Button variant="outlined" onClick={handleCloseCustomModal}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!selectedToUserId}
              onClick={async () => {
                // console.log({
                //   from_userid: selectedUserId,
                //   to_userid: selectedToUserId,
                //   selected_customer_ids: selectedRows
                // });
                if (!selectedToUserId) {
                  showAlert({
                    openAlert: true,
                    message: "Please select a user to exchange leads with",
                    severity: "warning",
                    duration: 2000,
                  });
                  return;
                }

                const success = await exchangeLeads(
                  token,
                  selectedUserId,
                  selectedToUserId,
                  selectedRows,
                  showAlert
                );

                if (success) {
                  handleCloseCustomModal();
                  setSelectedRows([]);
                  // Refresh the leads list
                  getAllLeads(
                    token,
                    setRows,
                    showAlert,
                    limit,
                    isLoading,
                    setIsLoading,
                    hasMore,
                    setHasMore,
                    0, // Reset offset
                    setOffset,
                    filterType,
                    setAllCount
                  );
                }
              }}
            >
              Exchange
            </Button>
          </Box>
        </Box>
      </Modal>
      <Snackbar
        open={openSnackbar}
        onClose={() => handleCloseSnackBar(setOpenSnackbar)}
      >
        <Alert
          onClose={() => handleCloseSnackBar(setOpenSnackbar)}
          severity={snackBarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
