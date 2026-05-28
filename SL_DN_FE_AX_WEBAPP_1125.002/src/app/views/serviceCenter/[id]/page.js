"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// Function imports
import {
  handleScrollToTop,
  scrollToTopButtonDisplay,
  fetchDetails,
  handleCloseSnackbar,
  handleOpenModal,
  handleCloseModal,
  addEstimateItem,
  getFilteredInventory,
  // getActualStock,
  saveEstimateItem,
  assignMechanic,
  updateServiceStatus,
  handleFinishJob,
  fetchUsers,
} from "../../../../../controllers/ServiceCenterIDControllers";

import RateReviewIcon from '@mui/icons-material/RateReview';
import CloseIcon from '@mui/icons-material/Close';


// Component imports
import LiveChat from "@/components/liveChat";
import Navbar from "@/components/navbar";
import BackButton from "@/components/backButton";
import Image from "next/image";
import Cookies from "js-cookie";

// UI package imports
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  IconButton,
  Fab,
  Paper,
  Divider,
  Modal,
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  InputLabel,
  FormControl,
  Tabs,
  Tab,
  Dialog,
  Tooltip,Checkbox,ListItemText,
} from "@mui/material";

// Images and icon imports
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export default function ServiceCenterDetails() {
  const router = useRouter();
  const params = useParams();

  // FrontEnd extracted data states
  const [token, setToken] = useState();
  const appointmentId = params.id;
  const [appointmentDataLog, setAppointmentDataLog] = useState([]);
  // Backend Data states
  const [services, setServices] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [prConfig, setPrConfig] = useState("");
  const [inventory, setInventory] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [opencomment_modal, setopencomment_modal] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});

  const handleToggleExpand = (serviceId) => {
    setExpandedComments(prev => ({
      ...prev,
      [serviceId]: !prev[serviceId]
    }));
  };
  const [estimateItems, setEstimateItems] = useState([
    {
      type: "",
      spareList: "",
      reportedIssue: "",
      qty: 0,
      saved: false,
    },
  ]);
  const [km, setKm] = useState("");

  // Modal and Alert states
  const [loading, setLoading] = useState(true);
  const [showFab, setShowFab] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "Mechanic", text: "The vehicle inspection is complete." },
    { sender: "Garage Owner", text: "Great! Any issues found?" },
    {
      sender: "Mechanic",
      text: "Yes, there are a few issues with the brakes.",
    },
  ]);

  // FrontEnd form input states
  const [mechanics, setMechanics] = useState([]);
  const [selectedMechanic, setSelectedMechanic] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isJobCompleted, setIsJobCompleted] = useState(false);
  const [enableFinishJob, setEnableFinishJob] = useState(false);
  const [users, setUsers] = useState([]);

  // New state to track if the screen is small
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Add this state after other state declarations
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const token = Cookies.get("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        const companyDetails = data.company_details && data.company_details[0];

        console.log("companyDetails", companyDetails);

        if (companyDetails) {
          setPrConfig(companyDetails.pr_limit_config);
        } else {
          console.log("No company details found");
        }
      } catch (error) {
        console.log("Error fetching company details:", error);
      }
    };
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    let storedToken = Cookies.get("token");
    setToken(storedToken);

    if (!appointmentId) {
      console.log("Appointment ID is not available");
      setLoading(false);
      return;
    }

    fetchDetails(
      storedToken,
      appointmentId,
      setServices,
      setInventory,
      setKm,
      setCustomer,
      setVehicleId,
      setMechanics,
      setSnackbarMessage,
      setOpenSnackbar,
      setLoading,
      setSelectedMechanic,
      setAppointmentDataLog
    );
  }, [appointmentId]);

  useEffect(() => {
    if (services.length > 0) {
      setEnableFinishJob(false);
    } else {
      setEnableFinishJob(true);
    }
  }, [services]);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const usersData = await response.json();
      const filteredUsers = usersData.filter(
        (user) => user.role_type === "Mechanic"
      );
      console.log("filteredUsers", filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      console.log("Error fetching users:", error);
    }
  };

  const updateEstimateItem = (index, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };
      return updatedItems;
    });
  };

  const handleSpareListChange = (index, value) => {
    updateEstimateItem(index, "spareList", value);
  };

  const allServicesCompleted = services
    .filter((service) => service.items_required && service.items_required.length > 0)
    .every((service) => service.service_status === "Completed");

  useEffect(() => {
    // Function to check screen size
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 600); // Adjust the width as needed
    };

    // Initial check
    checkScreenSize();

    // Add event listener
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Add this function after other function declarations
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // // Add this component after other component declarations
  // function TabPanel(props) {
  //   const { children, value, index, ...other } = props;
  //   return (
  //     <div
  //       role="tabpanel"
  //       hidden={value !== index}
  //       id={`simple-tabpanel-${index}`}
  //       aria-labelledby={`simple-tab-${index}`}
  //       {...other}
  //     >
  //       {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  //     </div>
  //   );
  // }

  const pageType = Cookies.get("page_type"); // "tab" or others
  
const safeParseComments = (comments) => {
  if (!comments) return [];

  // If already an object/array
  if (typeof comments === "object") return comments;

  try {
    const parsed = JSON.parse(comments);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Invalid JSON in service.comments:", comments);
    return [];
  }
};

  return (
    <div>
      {isSmallScreen ? (
        <div>
          <BackButton />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100vh",
            }}
          >
            {/* <div style={{ padding: "10%" }}> */}
            {/* <h1>404 - Page Not Found</h1>
        <p>This page is not available on mobile view.</p> */}

            <Image src="/icons/404.jpg" alt="404" width={350} height={300} />
            {/* </div> */}
          </div>
        </div>
      ) : (
        <>
          {/* <Navbar pageName="Service Center Details" /> */}
          {pageType !== "tab" && <Navbar pageName="Service Center Details" /> } 
          {console.log("services", services)}
          <Dialog
            open={opencomment_modal}
            onClose={() => setopencomment_modal(false)}
            maxWidth="md"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                borderRadius: 2, // Rounded corners
                padding: 2, // Add padding for better spacing
                overflow: 'hidden', // Ensure content doesn't overflow outside
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Subtle shadow for modern look
              },
            }}
          >
            {/* Close Icon */}
            <IconButton
              edge="end"
              color="danger"
              onClick={() => setopencomment_modal(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
              }}
            >
              <CloseIcon />
            </IconButton>

            <TableContainer
              sx={{
                maxHeight: '60vh', // Make it scrollable vertically
                overflowY: 'auto',
                backgroundColor: '#f9f9f9', // Light background for modern feel
                borderRadius: 8, // Rounded edges for the table container
              }}
            >
              <Table>
                <TableHead
                  sx={{
                    position: 'sticky', // Sticky header
                    top: 0, // Fix header at the top
                    backgroundColor: '#f1f1f1', // Light background for header
                    color: '#333', // Dark text for contrast
                    zIndex: 1, // Ensure header is above the content
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Reported Issue</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Part Number</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Inspection Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1rem' }}>Comments</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {appointmentDataLog.services_actual?.map((service) => (
                    <TableRow key={service.service_id}>
                      <TableCell>{service.service_description}</TableCell>
                      <TableCell>
                        {service.items_required?.map((item) => (
                          <Typography key={item.item_id} variant="body2" sx={{ fontSize: '0.9rem' }}>
                            {item.item_id}: {item.item_name} ({item.qty})
                          </Typography>
                        ))}
                      </TableCell>
                      <TableCell>{service.service_status}</TableCell>
                      <TableCell>
{safeParseComments(service.comments).map((comment, index) => {

                            const commentText = comment.comments;
                            const truncatedText =
                              commentText.length > 200
                                ? commentText.slice(0, 300) + "..."
                                : commentText;

                            return (
                              <Box key={index} sx={{ mb: 1 }}>
                                <Typography variant="body2" sx={{ fontSize: '0.9rem', color: "#333" }}>
                                  {expandedComments[index] ? commentText : truncatedText}
                                </Typography>
                                {commentText.length > 200 && (
                                  <Button
                                    onClick={() => handleToggleExpand(index)}
                                    variant="text"
                                    sx={{ padding: 0, color: "primary.main", fontSize: '0.85rem' }}
                                  >
                                    {expandedComments[index] ? (
                                      <>
                                        <ExpandLess fontSize="small" /> Read less
                                      </>
                                    ) : (
                                      <>
                                        <ExpandMore fontSize="small" /> Read more
                                      </>
                                    )}
                                  </Button>
                                )}
                                <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.75rem' }}>
                                  {comment.current_date}
                                </Typography>
                              </Box>
                            );
                          })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Dialog>
          <Box
            sx={{
              backgroundSize: "cover",
              color: "white",
            }}
            style={{ marginTop: pageType !== "tab" ? "0px" : "16px", }}
          >
            <Box>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  marginBottom: 3,
                  paddingBottom: 2,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  padding: 2,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 16,
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {/* <BackButton /> */}
                    <Typography variant="h6" style={{ marginLeft: "8px" }}>
                      Job Card No - {appointmentId}
                    </Typography>
                  </div>
                  <div
                    style={{
                      width: "20%",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "flex-end",
                      gap: 10,
                      width: 700,
                    }}
                  >
                     <FormControl sx={{ width: "250px" }} size="small">
                                       <InputLabel id="mechanic-label">Mechanic</InputLabel>
                                     
                                       <Select
                                         labelId="mechanic-label"
                                         multiple
                                         value={selectedMechanic}
                                         error={selectedMechanic.length === 0}
                                         onChange={(e) => {
                                           const mechanicIds = e.target.value;

                                           const selectedUsers = users.filter(user =>
                                             mechanicIds.includes(user.user_id)
                                           );

                                           setSelectedMechanic(mechanicIds);

                                           assignMechanic(
                                             token,
                                             mechanicIds,
                                             appointmentId,
                                             setSnackbarMessage,
                                             setOpenSnackbar,
                                             customer,
                                             vehicleId,
                                             km,
                                             selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(", ")
                                           );
                                         }}
                                         renderValue={(selected) =>
                                           users
                                             .filter(user => selected.includes(user.user_id))
                                             .map(user => `${user.firstName} ${user.lastName}`)
                                             .join(", ")
                                         }
                                       >
                                         {users.map((user) => (
                                           <MenuItem key={user.user_id} value={user.user_id}>
                                             <Checkbox checked={selectedMechanic.includes(user.user_id)} />
                                             <ListItemText
                                               primary={`${user.firstName} ${user.lastName}`}
                                             />
                                           </MenuItem>
                                         ))}
                                       </Select>
                                     </FormControl>

                    {/* <FormControl
                      sx={{ width: "100%" }}
                      size="small"
                      variant="outlined"
                    >
                      <InputLabel id="mechanic-label">Mechanic</InputLabel>
                      <Select
                        labelId="mechanic-label"
                        value={selectedMechanic}
                        onChange={(e) => setSelectedMechanic(e.target.value)}
                        label="Mechanic" // Ensure label is applied
                        sx={{
                          backgroundColor: "white", // Ensure visibility
                        }}
                      >
                        {users.map((user) => (
                          <MenuItem key={user.user_id} value={user.user_id}>
                            {`${user.firstName} ${user.lastName}`}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl> */}

                    <TextField
                      placeholder="KiloMeters"
                      size="small"
                      disabled
                      variant="outlined"
                      label="KM"
                      value={km}
                      type="number"
                      sx={{ marginTop: "10px", marginRight: "10px" }}
                    />
                  </div>
                </div>

                {customer && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{ flex: 1, minWidth: "220px", marginRight: 16 }}
                    >
                      {/* <Typography variant="h3" sx={{}}>
                        {customer.customer_name}
                      </Typography> */}
<Tooltip title={customer.customer_name || ''}>
  <Typography variant="h3">
    {customer.customer_name?.slice(0, 15)}
  </Typography>
</Tooltip>


                      <Typography variant="body2" sx={{ marginBottom: 1 }}>
                        <strong>Phone:</strong>
                        <a href={`tel://${customer.contact.phone}`}>
                          {customer.contact.phone}
                        </a>
                      </Typography>
                    </div>

                    <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                      <Typography variant="body2" sx={{ marginBottom: 1 }}>
                        <strong>Email:</strong>{" "}
                        <a
                          href={`mailto:${customer.contact.email}`}
                          style={{ color: "inherit", textDecoration: "none" }}
                        >
                          {customer.contact.email}
                        </a>
                      </Typography>
                      <Typography variant="body2" sx={{ marginBottom: 1 }}>
                        <strong>Address:</strong>{" "}
                        {customer.contact.address.street},{" "}
                        {customer.contact.address.city}
                      </Typography>
                      <Typography variant="body2">
                        {customer.contact.address.state}
                        {customer.contact.address.pinCode
                          ? ` - ${customer.contact.address.pinCode}`
                          : ""}
                      </Typography>
                    </div>

                    <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                      {customer.vehicles
                        .filter((vehicle) => vehicle.vehicle_id === vehicleId)
                        .map((vehicle, index) => (
                          <div key={index} style={{ marginBottom: 16 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: "bold", color: "#333" }}
                            >
                              {`${vehicle.make}`}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#555" }}>
                              <strong>Model:</strong> {vehicle.model}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "#888" }}>
                              <strong>Plate Number:</strong>{" "}
                              {vehicle.vehicle_id || "N/A"}
                            </Typography>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Paper>

              {loading && <Typography>Loading details...</Typography>}
              <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => handleCloseSnackbar(setOpenSnackbar)}
              >
                <Alert
                  onClose={() => handleCloseSnackbar(setOpenSnackbar)}
                  severity="success"
                  sx={{ width: "100%" }}
                >
                  {snackbarMessage}
                </Alert>
              </Snackbar>
              <Box sx={{ mt: 4, width: "100%" }}>
                <Paper elevation={1} sx={{ padding: 1, borderRadius: 2 }}>
                  <Box sx={{ width: "100%" }}>
                    <Box sx={{ borderBottom: 1, borderColor: "divider", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Tabs value={tabValue} onChange={handleTabChange} sx={{ flexGrow: 1 }}>
                        <Tab label="Assessment Details" />
                        {/* <Tab label="Comments" /> */}
                      </Tabs>
                      <IconButton type="outlined" onClick={() => {
                        setopencomment_modal(true);
                      }}>
                        <RateReviewIcon style={{ color: "black" }} />
                      </IconButton>

                    </Box>

                    {/* <TabPanel value={tabValue} index={0}> */}
                    <TableContainer
                      id="scrollable-table"
                      style={{
                        maxHeight: "40vh",
                        overflowY: "auto",
                      }}
                      onScroll={(event) => {
                        scrollToTopButtonDisplay(event, setShowFab);
                      }}
                    >
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Spare List</TableCell>
                            <TableCell>Required Stock</TableCell>
                            {/* <TableCell>Actual Stock</TableCell> */}
                            <TableCell>Action</TableCell>
                            {/* <TableCell>Comments</TableCell> */}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(
                            services.filter((service) => service.items_required && service.items_required.length > 0).reduce((groups, service) => {
                              const description = service.service_description;
                              if (!groups[description]) {
                                groups[description] = [];
                              }
                              groups[description].push(service);
                              return groups;
                            }, {})
                          )
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([description, serviceGroup]) => (
                              <React.Fragment key={description}>
                                <TableRow>
                                  <TableCell
                                    colSpan={5}
                                    sx={{
                                      backgroundColor: "#f5f5f5",
                                      fontWeight: "bold",
                                      position: "sticky",
                                      top: 56,
                                      zIndex: 1,
                                      borderBottom: "2px solid #ddd",
                                    }}
                                  >
                                    {description}
                                  </TableCell>
                                </TableRow>
                                {serviceGroup.map((service) => (
                                  <TableRow key={service.service_id}>
                                    <TableCell>
                                      {service.items_required
                                        .map((item) => item.item_name)
                                        .join(", ")}
                                    </TableCell>
                                    <TableCell>
                                      {service.items_required[0]?.qty}
                                    </TableCell>
                                    {/* <TableCell>
                                        {service.items_required
                                          .map((item) =>
                                            getActualStock(item.item_id, inventory)
                                          )
                                          .reduce((acc, stock) => acc + stock, 0)}
                                      </TableCell> */}
             <TableCell>
{(() => {
  const item = service.items_required?.[0];

  const requiredQty = Number(item?.qty || 0);
  const availableQty = Number(item?.available_qty || 0);  // 👈 DIRECT STOCK

  if (!item) return null;

  // STOCK ≥ REQUIRED → DISABLE
  if (availableQty >= requiredQty) {
    return (
      <FormControlLabel
        control={<Switch disabled />}
        label={service.service_status || "Pending"}
      />
    );
  }

  // COMPLETED → DISABLE CHECKED
  if (service.service_status === "Completed") {
    return (
      <FormControlLabel
        control={<Switch checked disabled />}
        label="Completed"
      />
    );
  }

  // STOCK < REQUIRED → ENABLE WITH VALIDATION
  return (
    <FormControlLabel
      control={
        <Switch
          checked={service.service_status === "Completed"}
          onChange={() => {
            if (!selectedMechanic) {
              setSnackbarMessage("Please assign a mechanic first");
              setOpenSnackbar(true);
              return;
            }

            // if (availableQty < requiredQty && prConfig !== "true") {
            //   setSnackbarMessage("Insufficient stock! Please create PR.");
            //   setOpenSnackbar(true);
            //   return;
            // }

            updateServiceStatus(
              token,
              service.service_id,
              service.service_status,
              setServices,
              setSnackbarMessage,
              setOpenSnackbar,
              appointmentId,
              item?.item_id,
              requiredQty,
              availableQty
            );
          }}
        />
      }
      label={service.service_status || "Pending"}
    />
  );
})()}
</TableCell>


                                    {/* <TableCell>{service.comments}</TableCell> */}
                                  </TableRow>
                                ))}
                              </React.Fragment>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {/* </TabPanel> */}

                    {/* <TabPanel value={tabValue} index={1}> */}
                    {/* <TableContainer
                      className="table-container"
                      sx={{ width: "100%" }}
                    >
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Reported Issue</TableCell>
                            <TableCell>Part Number</TableCell>
                            <TableCell>Inspection</TableCell>
                            <TableCell>Comments</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {services.map((service) => (
                            <TableRow key={service.service_id}>
                              <TableCell>
                                {service.service_description}
                              </TableCell>
                              <TableCell>
                                {service.items_required?.map((item) => (
                                  <div key={item.item_id}>
                                    {item.item_id}: {item.item_name} (
                                    {item.qty})
                                  </div>
                                ))}
                              </TableCell>
                              <TableCell>{service.service_status}</TableCell>
                              <TableCell>
                                {service.comments &&
                                  (() => {
                                    const commentText = service.comments;
                                    const truncatedText =
                                      commentText.length > 200
                                        ? commentText.slice(0, 200) + "..."
                                        : commentText;

                                    return (
                                      <div>
                                        <Typography variant="body2">
                                          {isExpanded
                                            ? commentText
                                            : truncatedText}
                                        </Typography>
                                        {commentText.length > 200 && (
                                          <Button
                                            onClick={() =>
                                              setIsExpanded(!isExpanded)
                                            }
                                            variant="text"
                                            color="primary"
                                            sx={{ padding: 0 }}
                                          >
                                            {isExpanded
                                              ? "Read less"
                                              : "Read more"}
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer> */}
                    {/* </TabPanel> */}
                  </Box>
                </Paper>
              </Box>
            </Box>

            <Box
              sx={{
                position: "fixed",
                bottom: 25,
                right: 70,
                display: "flex",
                gap: 2,
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              {" "}
              {allServicesCompleted && (
                <Button
                  variant="contained"
                  color="success"
                  // sx={{ marginBottom: 2 }}
                  sx={{
                    marginRight: 2,
                    height: "40px",
                    width: "60px",
                  }}
                  disabled={enableFinishJob}
                  onClick={() =>
                    handleFinishJob(
                      token,
                      appointmentId,
                      isJobCompleted,
                      setSnackbarMessage,
                      setOpenSnackbar,
                      setIsJobCompleted,
                      router,
                      customer,
                      vehicleId,
                      km,
                      selectedMechanic,
                      users
                    )
                  }
                >
                  <CheckCircleOutlineIcon />
                </Button>
              )}
            </Box>

            {/* Chat Box */}
            <LiveChat room={appointmentId} />

            {/* Back to Top FAB */}
            {showFab && (
              <Fab
                size="small"
                onClick={handleScrollToTop}
                style={{
                  backgroundColor: "white",
                  color: "primary",
                  position: "absolute",
                  bottom: 20,
                  right: 90,
                  zIndex: 10,
                }}
              >
                <ArrowUpwardIcon />
              </Fab>
            )}
          </Box>
        </>
      )}
    </div>
  );
}
