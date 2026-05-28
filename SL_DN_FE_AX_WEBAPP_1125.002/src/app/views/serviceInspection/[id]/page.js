"use client";
// React and Next imports
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";

// Function imports
import Cookies from "js-cookie";
import {
  handleScrollToTop,
  scrollToTopButtonDisplay,
  fetchDetails,
  handleCloseSnackbar,
  handleOpenModal,
  handleCloseModal,
  addEstimateItem,
  getFilteredInventory,
  getActualStock,
  saveEstimateItem,
  assignMechanic,
  updateInspectionStatus,
  handleFinishJob,
  updateServiceStatus,
  postComments,
  reverseUpdatedQuantity,
} from "../../../../../controllers/ServiceInspectionIDControllers";

// Component imports
import LiveChat from "@/components/liveChat";
import Navbar from "@/components/navbar";
import BackButton from "@/components/backButton";
// import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SaveIcon from "@mui/icons-material/Save";

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
  FormControl,
  OutlinedInput,
  InputAdornment,
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
  Tooltip
} from "@mui/material";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormLabel from "@mui/material/FormLabel";

// Images and icon imports
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import SendIcon from "@mui/icons-material/Send";
import VisualInspectionPhotos from "../../../../components/visual_inspection";

export default function ServiceCenterDetails() {
  const router = useRouter();
  const params = useParams();

  // FrontEnd extracted data states
  const [token, setToken] = useState();
  const [user, setUser] = useState();
  const appointmentId = params.id;
  const [printDate, setPrintDate] = useState(new Date());
  const [printedBy, setPrintedBy] = useState(
    Cookies.get("userName") || "Unknown User"
  );

  // Backend Data states
  const [services, setServices] = useState([]);
  const [services1, setServices1] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [comments, setComments] = useState();
  const [appointmentDataLog, setAppointmentDataLog] = useState(null);
  const [changeChecked, setChangeChecked] = useState({});
  const [serviceState, setServiceState] = useState(null);
  const [changeAction, setChangeAction] = useState();
  const [PdfHeaderImage, setPdfHeaderImage] = useState("");
  const[pdfLog,setPdfLogo]=useState("")
  const [pdfFooterImage, setPdfFooterImage] = useState("");
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
  const [value, setValue] = React.useState("1");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mainpageimage, setmainpageimage] = useState(null);
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
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isJobCompleted, setIsJobCompleted] = useState(false);
  const [editId, setEditId] = useState();
  const [users, setUsers] = useState([]);

  // New state to hold comments for each service
  const [serviceComments, setServiceComments] = useState({});

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleSaveComment = (serviceId) => {
    const comment = serviceComments[serviceId] || "";

    const updatedServices = [...services];
    const index = updatedServices.findIndex((s) => s.service_id === serviceId);
    if (index !== -1) {
      updatedServices[index].comments = comment;
      setServices(updatedServices);
    }

    if (comment.trim() !== "") {
      postComments(
        token,
        serviceId,
        comment,
        setComments,
        setSnackbarMessage,
        setOpenSnackbar,
        setServiceComments
      );
    }

    setServiceComments((prev) => {
      const updated = { ...prev };
      delete updated[serviceId];
      return updated;
    });
  };

  // Set the pdfHeaderImage and pdfFooterImage when companyDetails change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the data from the API
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/`
        );
        console.log("my response", response);
        // console.log('my header image', PdfHeaderImage)
        // console.log('my footet image', pdfFooterImage)

        // Check if company details are available in the response data
        const companyDetails = response?.data?.company_details?.[0];
        console.log("company details", companyDetails);
        // Set the header and footer images
        // const pdfHeader = ;
        // const pdfFooter = ;

        // Assuming you're using React, you can set the state as follows:
        setPdfHeaderImage(companyDetails?.pdf_header || "");
        setPdfFooterImage(companyDetails?.pdf_footer || "");
        setPdfLogo(companyDetails?.logo || "");
        // console.log('pdfHeaderImage', companyDetails?.pdf_header)
        // console.log('pdfFooterImage', companyDetails?.pdf_header)
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to fetch only on mount
  useEffect(() => {
    let storedToken = Cookies.get("token");
    let storedUserName = Cookies.get("userName");
    let storedUserId = Cookies.get("userId");

    setUser({ userName: storedUserName, userId: storedUserId });
    // setUser(storedUserName);
    setToken(storedToken);

    if (!appointmentId) {
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

    fetchUsers();
  }, [appointmentId]);

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

  // const handleInspectionSwitchChange = (eVt, service) => {
  //   const isChecked = eVt;
  //   if (isChecked === false) {
  //     // Update the inventory quantity
  //     const ReversalQty = service?.items_required?.[0]?.qty * -1;
  //     reverseUpdatedQuantity(
  //       token,
  //       service.inspection_status,
  //       service.service_id,
  //       appointmentId,
  //       setServices,
  //       service?.items_required?.[0]?.item_id,
  //       ReversalQty
  //     );
  //   } else {
  //     updateInspectionStatus(
  //       token,
  //       service.service_id,
  //       service.inspection_status,
  //       setServices,
  //       setSnackbarMessage,
  //       setOpenSnackbar,
  //       appointmentId,
  //       service.items_required[0]?.item_id,
  //       service.items_required[0]?.qty
  //     );
  //   }
  // };

  const handleInspectionRadioChange = (newStatus, service) => {
    console.log({ serSerSer: service });
    if (newStatus == "notcompleted") {
      const ReversalQty = service?.items_required?.[0]?.qty * -1;
      reverseUpdatedQuantity(
        token,
        service.inspection_status,
        service.service_id,
        appointmentId,
        setServices,
        service?.items_required?.[0]?.item_id,
        ReversalQty,
        newStatus
      );
    } else {
      updateInspectionStatus(
        token,
        service.service_id,
        service.inspection_status,
        setServices,
        setSnackbarMessage,
        setOpenSnackbar,
        appointmentId,
        service.items_required[0]?.item_id,
        service.items_required[0]?.qty,
        newStatus
      );
    }
  };

  const handleSpareListChange = (index, value) => {
    updateEstimateItem(index, "spareList", value);
  };

  const allServicesCompleted = services
    .filter((service) => service.items_required && service.items_required.length > 0)
    .every((service) => service.service_status === "Completed");

const pageType = Cookies.get("page_type"); // "tab" or others

  return (
    <div>
      {/* <Navbar pageName={`Job Card No - ${appointmentId}`} /> */}
      {/* <Navbar pageName="Service Inspection" /> */}
{pageType !== "tab" && <Navbar pageName={`Job Card No - ${appointmentId}`} /> }
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",

          minHeight: "89vh",
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
                {/* <BackButton />*/}
                <Typography variant="h6" style={{ marginLeft: "8px" }}>
                  Job Card No - {appointmentId}
                </Typography>
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
                <div style={{ flex: 1, minWidth: "220px", marginRight: 16 }}>
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
                    <strong>Address:</strong> {customer.contact.address.street},{" "}
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

                <div style={{ width: "20%" }}>
                  {/* <InputLabel id="mechanic-label">Mechanic</InputLabel>
                <Select
                  labelId="mechanic-label"
                  label="Mechanic"
                  disabled
                  value={selectedMechanic}
                  size="small"
                  sx={{ width: "70%" }}
                  onChange={(e) => {
                    setSelectedMechanic(e.target.value);
                    assignMechanic(
                      token,
                      e.target.value,
                      appointmentId,
                      setSnackbarMessage,
                      setOpenSnackbar
                    );
                  }}
                >
                  <MenuItem value="" disabled>
                    Select Mechanic
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem
                      key={user.user_id}
                      value={user.user_id}
                    >
                      {`${user.firstName} ${user.lastName}`}
                    </MenuItem>
                  ))}
                </Select> */}
                  <TextField
                    label="Mechanic"
                    value={selectedMechanic}
                    disabled
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    size="small"
                    sx={{ width: "70%", marginTop: 2 }}
                  />
                  <TextField
                    label="Kilometer"
                    value={km}
                    disabled
                    onChange={(e) => setKm(e.target.value)}
                    size="small"
                    sx={{ width: "70%", marginTop: 2 }}
                  />
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
              severity="info"
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
          <Paper
            elevation={3}
            sx={{ padding: 3, borderRadius: 2, marginBottom: 3 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" gutterBottom>
                Services Inspection
              </Typography>
              {/* 
              //! Do not remove this code
              <Box display="flex" justifyContent="center" marginBottom={3}>
                {!allServicesCompleted && (
                  <Button
                    variant="contained"
                    color="primary"
                    aria-label="add"
                    onClick={() => handleOpenModal(setIsModalOpen)}
                  >
                    <AddIcon />
                  </Button>
                )}
              </Box>
               */}

              {/* {allInspectionCompleted && (
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ marginBottom: 2 }}
                  onClick={() =>
                    handleFinishJob(
                      token,
                      appointmentId,
                      setSnackbarMessage,
                      setOpenSnackbar,
                      router,
                      customer,
                      services,
                      vehicleId,
                      km,
                      inventory,
                      user
                    )
                  }
                >
                  Finish Job
                </Button>
              )} */}
            </div>
            <Divider sx={{ marginBottom: 2 }} />

            <Box sx={{ width: "100%", typography: "body1" }}>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <TabList
                    onChange={handleChange}
                    aria-label="lab API tabs example"
                  >
                    <Tab label="Job Inspection" value="1" />
                    <Tab label="Visual Inspection" value="2" />
                  </TabList>
                </Box>
                <TabPanel value="1">
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
                          <TableCell>Actual Stock</TableCell>
                          <TableCell>Action</TableCell>
                          <TableCell>Inspection</TableCell>
                          <TableCell>Comments</TableCell>
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
                                  colSpan={6}
                                  sx={{
                                    backgroundColor: "#f5f5f5",
                                    fontWeight: "bold",
                                    position: "sticky",
                                    top: 56, // Adjust this value based on your header height
                                    zIndex: 1,
                                    borderBottom: "2px solid #ddd",
                                  }}
                                >
                                  {description}
                                </TableCell>
                              </TableRow>
                              {serviceGroup.map((service, index) => (
                                <TableRow key={service.service_id}>
                                  <TableCell>
                                    {service.items_required
                                      .map((item) => item.item_name)
                                      .join(", ")}
                                  </TableCell>
                                  <TableCell>
                                    {service.items_required
                                      .map((item) => item.qty)}
                                    {/* {service.items_required.qty} */}
                                  </TableCell>
                                  <TableCell>
                                    {service.items_required
                                      .map((item) =>
                                        getActualStock(item.item_id, inventory)
                                      )
                                      .reduce((acc, stock) => acc + stock, 0)}
                                  </TableCell>
                                  <TableCell>
                                    {service.items_required.some(
                                      (item) =>
                                        1 >
                                        getActualStock(item.item_id, inventory)
                                    ) ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                        }}
                                      >
                                        <FormControlLabel
                                          control={<Switch disabled />}
                                          label="Rework"
                                        />
                                      </div>
                                    ) : (
                                      <FormControlLabel
                                        control={
                                          <Switch
                                            checked={
                                              // changeAction ||
                                              service.service_status ===
                                              "Completed"
                                            }
                                            onChange={() => {
                                              updateServiceStatus(
                                                token,
                                                service.service_id,
                                                service.service_status,
                                                setServices,
                                                setSnackbarMessage,
                                                setOpenSnackbar,
                                                appointmentId
                                              );
                                            }}
                                          />
                                        }
                                        label={service.service_status}
                                      />
                                    )}
                                  </TableCell>

                                  {/* //? Inspection Completion Toggle */}
                                  <TableCell>
                                    {/* <Switch
                                      checked={
                                        changeChecked.index === index
                                          ? changeChecked?.checked ||
                                            service.inspection_status ===
                                              "completed"
                                          : ""
                                      }
                                      disabled={
                                        service.service_status !== "Completed"
                                      }
                                      onChange={(e) => {
                                        setChangeChecked({
                                          index,
                                          checked: e.target.checked,
                                        });
                                        if (e.target.checked === false) {
                                          // setChangeAction(e.target.checked);
                                          const ReversalQty =
                                            service?.items_required?.[0]?.qty *
                                            -1;
                                          reverseUpdatedQuantity(
                                            token,
                                            service.inspection_status,
                                            service.service_id,
                                            appointmentId,
                                            setServices,
                                            service?.items_required?.[0]
                                              ?.item_id,
                                            ReversalQty
                                          );
                                        } else {
                                          updateInspectionStatus(
                                            token,
                                            service.service_id,
                                            service.inspection_status,
                                            setServices,
                                            setSnackbarMessage,
                                            setOpenSnackbar,
                                            appointmentId,
                                            service.items_required[0]?.item_id,
                                            service.items_required[0]?.qty
                                          );
                                          // setChangeAction(null);
                                        }

                                        // handleInspectionSwitchChange(
                                        //   e.target.checked,
                                        //   service
                                        // );
                                      }}
                                    />
                                    <label htmlFor={`switch-${index}`}>
                                      {service.inspection_status}
                                    </label> */}
                                    <FormControl>
                                      <RadioGroup
                                        aria-labelledby="demo-radio-buttons-group-label"
                                        value={
                                          service.inspection_status ||
                                          "notcompleted"
                                        }
                                        onChange={(e) => {
                                          console.log({
                                            value: e.target.value,
                                          });
                                          handleInspectionRadioChange(
                                            e.target.value,
                                            service
                                          );
                                        }}
                                        name="radio-buttons-group"
                                      >
                                        <FormControlLabel
                                          value="notcompleted"
                                          control={<Radio />}
                                          label="Not Completed"
                                        />
                                        <FormControlLabel
                                          value="completed"
                                          control={<Radio />}
                                          label="Completed"
                                        />
                                      </RadioGroup>
                                    </FormControl>
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      placeholder="Comments"
                                      multiline
                                      rows={2}
                                      value={
                                        serviceComments[service.service_id] ||
                                        service.comments
                                      }
                                      onFocus={() =>
                                        setEditId(service.service_id)
                                      }
                                      onBlur={(e) => {
                                        setTimeout(() => {
                                          setEditId("");
                                          handleSaveComment(service.service_id);
                                        }, 100); // slight delay to allow button click first
                                      }}
                                      onChange={(event) => {
                                        setServiceComments((prev) => ({
                                          ...prev,
                                          [service.service_id]:
                                            event.target.value,
                                        }));
                                      }}
                                      variant="outlined"
                                      sx={{ m: 1, width: "80%" }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </React.Fragment>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </TabPanel>
                <TabPanel value="2">
                  <VisualInspectionPhotos
                    setmainpageimage={setmainpageimage}
                    appointmentId={appointmentId}
                    visualInspectionData={
                      appointmentDataLog?.visual_inspection_in
                    }
                    visualInspectionComments={
                      appointmentDataLog?.visual_inspection_comments
                    }
                  />
                </TabPanel>
              </TabContext>
            </Box>
          </Paper>

          {/* Modal for Service Entry */}
          {/* <Modal
            open={isModalOpen}
            onClose={() => handleCloseModal(setIsModalOpen)}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 800,
                bgcolor: "background.paper",
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
              }}
            >
              <Typography id="modal-title" variant="h6" component="h2">
                Add Service Entry
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Type</TableCell>
                      <TableCell align="center">Spare List</TableCell>
                      <TableCell align="center">Reported Issue</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {estimateItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            select
                            size="small"
                            value={item.type || ""}
                            onChange={(e) =>
                              updateEstimateItem(index, "type", e.target.value)
                            }
                            fullWidth
                            SelectProps={{
                              native: true,
                            }}
                          >
                            <option value="" defaultValue>
                              {" "}
                              Select Type
                            </option>
                            <option value="Spares">Spares</option>
                            <option value="Accessories">Accessories</option>
                            <option value="Services">Services</option>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          {item.type === "Services" ? (
                            <TextField
                              value={item.spareList}
                              size="small"
                              onChange={(e) =>
                                updateEstimateItem(
                                  index,
                                  "spareList",
                                  e.target.value
                                )
                              }
                              fullWidth
                            />
                          ) : (
                            <Autocomplete
                              size="small"
                              options={getFilteredInventory(
                                item.type,
                                inventory
                              ).map((option) => option.part_name)}
                              getOptionLabel={(option) =>
                                option || "Out of stock"
                              }
                              renderInput={(params) => (
                                <TextField {...params} fullWidth />
                              )}
                              onInputChange={(event, newValue) =>
                                handleSpareListChange(index, newValue)
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.reportedIssue}
                            size="small"
                            onChange={(e) =>
                              updateEstimateItem(
                                index,
                                "reportedIssue",
                                e.target.value
                              )
                            }
                            fullWidth
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <IconButton
                              onClick={() =>
                                updateEstimateItem(
                                  index,
                                  "qty",
                                  Math.max(item.qty - 1, 0)
                                )
                              }
                            >
                              <RemoveIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                            <Typography>{item.qty}</Typography>
                            <IconButton
                              onClick={() =>
                                updateEstimateItem(index, "qty", item.qty + 1)
                              }
                            >
                              <AddIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              saveEstimateItem(
                                token,
                                index,
                                estimateItems,
                                inventory,
                                appointmentId,
                                setSnackbarMessage,
                                setOpenSnackbar,
                                updateEstimateItem
                              )
                            }
                            disabled={item.saved}
                          >
                            {item.saved ? "SAVED" : "Save"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" justifyContent="flex-end" marginTop={2}>
                <Fab
                  size="small"
                  color="primary"
                  aria-label="add"
                  onClick={() => addEstimateItem(setEstimateItems)}
                  sx={{ marginRight: 2 }}
                >
                  <AddIcon />
                </Fab>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleCloseModal(setIsModalOpen)}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Modal> */}
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
          {allServicesCompleted && (
            <Button
              variant="contained"
              color="success"
              sx={{
                marginRight: 2,
                height: "40px",
                width: "60px",
              }}
              onClick={() =>
                handleFinishJob(
                  token,
                  appointmentId,
                  setSnackbarMessage,
                  setOpenSnackbar,
                  router,
                  customer,
                  services,
                  vehicleId,
                  km,
                  inventory,
                  user,
                  PdfHeaderImage,
                  pdfFooterImage,
                  pdfLog,
                  estimateItems,
                  printDate,
                  printedBy
                )
              }
            >
              <SaveIcon />
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
    </div>
  );
}
