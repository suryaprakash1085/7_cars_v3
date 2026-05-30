"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  Document,
  Page,
  View,
  Text,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
// test
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// whatsapp component
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "@/components/whatsapp";
import Cookies from "js-cookie";
import Navbar from "@/components/navbar";
import LiveChat from "@/components/liveChat";
import axios from "axios";
// const [error, setError] = useState(false);
import AddProduct from "@/components/addProduct";
import RateReviewIcon from "@mui/icons-material/RateReview";

// data b
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
  Autocomplete,
  Grid,
  TextField,
  Select,
  MenuItem,
  Menu,
  Snackbar,
  IconButton,
  Fab,
  Link,
  Paper,
  Divider,
  InputAdornment,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  FormControl,
  InputLabel,
Checkbox,ListItemText,FormControlLabel

} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import BackButton from "@/components/backButton";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import Image from "next/image";
import SportsScoreIcon from "@mui/icons-material/SportsScore";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";

// import { generatePDF } from "./jobCardIDHelper";
import { isFuture, set } from "date-fns";
import AppAlert from "@/components/snackBar";
import generatePDF, {
  previewPDF as previewEstimatePDF,
} from "../../../../components/PDFGenerator_estimate";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
const CustomerDetail = () => {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id;
  const [token, setToken] = useState();
  const [expandedComments, setExpandedComments] = useState({});
  const [opencomment_modal, setopencomment_modal] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [km, setKm] = useState(0);
  const [tempKm, setTempKm] = useState(km);
  const [estimateItems, setEstimateItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disableDelete, setDisableDelete] = useState(false);
  const [error, setError] = useState();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const lastInputRef = useRef(null);
  const [services, setServices] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "Mechanic", text: "The vehicle inspection is complete." },
    { sender: "Garage Owner", text: "Great! Any issues found?" },
    {
      sender: "Mechanic",
      text: "Yes, there are a few issues with the brakes.",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [jobCardAlertData, setJobCardAlertData] = useState({});

  const [servicesActualExists, setServicesActualExists] = useState(false);
  const [servicesEstimateExists, setServicesEstimateExists] = useState(false);
  const [appointmentDataLog, setAppointmentDataLog] = useState({});
  const [uomOptions, setUomOptions] = useState([]);
  const [enableRelease, setEnableRelease] = useState(false);

  const [productType, setProductType] = useState("");
  const [prCreated, setPrCreated] = useState(false);
  const [prNo, setPrNo] = useState("");
  const [updateButtonclicked, setUpdateButtonclicked] = useState(false);
  const [openAddProductModal, setOpenAddProductModal] = useState(false);

  const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [printMenuAnchor, setPrintMenuAnchor] = useState(null);

  const [isMobile, setIsMobile] = useState(false);
  const [severity, setSeverity] = useState("info");
  const Role = Cookies.get("role");
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [users, setUsers] = useState([]);
  const [typedname, setTypedname] = useState("");
  const [PdfHeaderImage, setPdfHeaderImage] = useState("");
  const [pdfFooterImage, setPdfFooterImage] = useState("");
  const [pdfLogo, setPdfLogo] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [printDate, setPrintDate] = useState(new Date());
  const [printedBy, setPrintedBy] = useState(
    Cookies.get("userName") || "Unknown User"
  );

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const [statusChange, setStatusChange] = useState(""); //   ADD HERE
  const [newSpareInputs, setNewSpareInputs] = useState({});
  const [editingSpare, setEditingSpare] = useState({
    itemIndex: null,
    spareIndex: null,
  });
  const [editedSpareData, setEditedSpareData] = useState({});
  const [isSaving, setIsSaving] = useState(false); // State to disable buttons during save

  const [selectedSales, setSelectedSales] = useState("");
const [referredBy, setReferredBy] = useState("");
const [customerRefName, setCustomerRefName] = useState("");
const [allUsers, setAllUsers] = useState([]);


const [nextServiceKmEnabled, setNextServiceKmEnabled] = useState(false);
const [nextServiceKmManual, setNextServiceKmManual] = useState(false);
const [nextServiceKm, setNextServiceKm] = useState(null);
const appointmentLoadedRef = useRef(false);
const nextServiceKmInitializedRef = useRef(false);
const [companyDetails, setCompanyDetails] = useState([]);


  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, { sender: "Garage Owner", text: newMessage }]);
      setNewMessage("");
    }
  };

  const totalSpares = estimateItems.reduce(
    (acc, item) =>
      acc +
      item.spares.filter(
        (spare) => spare.spareList && spare.spareList.trim() !== ""
      ).length,
    0
  ); // Calculate total spares (only count filled spares)
  console.log("totalSpares", totalSpares);

  function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
      </div>
    );
  }
  useEffect(() => {
    if (estimateItems.length === 1) {
      setDisableDelete(true);
    } else {
      setDisableDelete(false);
    }
  }, [estimateItems]);

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
 setCompanyDetails(companyDetails || {});
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

  //!! Fetching services from the API
  useEffect(() => {
    const storedToken = Cookies.get("token");
    setToken(storedToken);

    const fetchServices = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/service`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();
        setServices(data.services);
      } catch (error) {
        console.log("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  //!! Fetching appointment details from the API
  useEffect(() => {
    if (!appointmentId) {
      console.log("Appointment ID is not available");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      const token = Cookies.get("token");
      try {
        const appointmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!appointmentResponse.ok)
          throw new Error("Failed to fetch appointment details");
        const appointmentData = await appointmentResponse.json();

        console.log("appointmentData", appointmentData);
        const customerId = appointmentData.customer_id;
        const vehicleId = appointmentData.vehicle_id;
        if (appointmentData.km != undefined) {
          setKm(appointmentData.km);
        } else {
          setKm(0);
        }

        const [customerResponse, inventoryResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/customer/${customerId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!customerResponse.ok)
          throw new Error("Failed to fetch customer details");
        if (!inventoryResponse.ok)
          throw new Error("Failed to fetch inventory details");

        const customerData = await customerResponse.json();
        const inventoryData = await inventoryResponse.json();

        setCustomer(customerData);
        setVehicleId(vehicleId);
        // setInventory(inventoryData);
        setInventory(Array.isArray(inventoryData) ? inventoryData : inventoryData.items || inventoryData.data || []);
        setAppointmentDataLog(appointmentData);
        appointmentLoadedRef.current = true;

const savedNextServiceKm = appointmentData.next_service_km;
const savedNextServiceKmEnabled = savedNextServiceKm !== null && savedNextServiceKm !== undefined && savedNextServiceKm !== 0;
setNextServiceKmEnabled(savedNextServiceKmEnabled);
setNextServiceKm(savedNextServiceKmEnabled ? savedNextServiceKm : null);
setNextServiceKmManual(false);
        if (appointmentData.sales_id) setSelectedSales(appointmentData.sales_id);
if (appointmentData.referred_by) setReferredBy(appointmentData.referred_by);
if (appointmentData.customer_ref_name) setCustomerRefName(appointmentData.customer_ref_name);

        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          // Group services by description to combine related spares
          const servicesByDescription = {};

          appointmentData.services_actual.forEach((service) => {
            if (!servicesByDescription[service.service_description]) {
              servicesByDescription[service.service_description] = {
                service_id: service.service_id,
                type: service.service_type || "",
                reportedIssue: service.service_description,
                spares: [],
                estimatedAmount: parseFloat(service.price || 0),
              };
            }

            // Add items_required as spares if they exist
            if (service.items_required && service.items_required.length > 0) {
              service.items_required.forEach((item) => {
                // Check if this spare already exists to avoid duplicates (by item name only)
                const spareExists = servicesByDescription[
                  service.service_description
                ].spares.some(
                  (spare) =>
                    spare.spareList === (item.item_name || "")
                );
                if (!spareExists) {
                  servicesByDescription[
                    service.service_description
                  ].spares.push({
                    spareList: item.item_name || "",
                    service_id: service.service_id,
                    qty: item.qty || 0,
                    price: item.price || 0,
                  });
                }
              });
            }
            // Don't add empty spare slots - leave spares array empty if no items_required
          });

          const formattedItems = Object.values(servicesByDescription);
          setEstimateItems(formattedItems);
          calculateAllEstimatedAmounts(formattedItems);
        } else {
          setEstimateItems([
            {
              service_id: "",
              type: "Services",
              spares: [],
              reportedIssue: "",
              estimatedAmount: 0,
            },
          ]);
        }

        if (
          appointmentData.services_actual &&
          appointmentData.services_actual.length > 0
        ) {
          setServicesActualExists(true);
        }

        // console.log(appointmentData);
      } catch (err) {
        console.log("Error fetching details:", err);
        setError(err.message);
        setSnackbarMessage(err.message);
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId]);


  const handleSaveSalesInfo = async () => {
  const token = Cookies.get("token");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_sales_info`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sales_id: selectedSales,
          referred_by: referredBy,
          customer_ref_name: referredBy === "Customer reference" ? customerRefName : "",
        }),
      }
    );
    if (!response.ok) throw new Error("Failed to save sales info");
    setSnackbarMessage("Sales info saved successfully");
    setseverity("success");
    setOpenSnackbar(true);
  } catch (error) {
    console.error("Error saving sales info:", error);
    setSnackbarMessage("Error saving sales info");
    setseverity("error");
    setOpenSnackbar(true);
  }
};




const updateNextServiceKm = async (newNextServiceKm) => {
  const token = Cookies.get("token");
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_next_service_km`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ next_service_km: newNextServiceKm }),
      }
    );
    if (!response.ok) throw new Error("Failed to update Next Service KM");
    setNextServiceKm(newNextServiceKm);
    setSnackbarMessage("Next Service KM updated successfully");
    setSeverity("success");
    setOpenSnackbar(true);
  } catch (error) {
    setSnackbarMessage("Failed to update Next Service KM");
    setSeverity("error");
    setOpenSnackbar(true);
  }
};

const handleNextServiceKmChange = (event) => {
  const inputValue = Number(event.target.value);
  if (Number.isNaN(inputValue) || inputValue < 0) {
    setSnackbarMessage("Next Service KM must be a non-negative number");
    setSeverity("error");
    setOpenSnackbar(true);
    return;
  }
  setNextServiceKm(inputValue);
  setNextServiceKmManual(true);
  updateNextServiceKm(inputValue);
  setHasChanges(true);
};



useEffect(() => {
  if (!appointmentLoadedRef.current) return;
  if (!nextServiceKmInitializedRef.current) {
    nextServiceKmInitializedRef.current = true;
    return;
  }
  if (!nextServiceKmEnabled) {
    setNextServiceKm(null);
    setNextServiceKmManual(false);
    updateNextServiceKm(null);
    return;
  }
  const currentKm = Number(km);
  if (Number.isFinite(currentKm)) {
    if (!nextServiceKmManual) {
      const computed = currentKm + 10000;
      setNextServiceKm(computed);
      updateNextServiceKm(computed);
    }
  } else {
    setNextServiceKm(null);
    updateNextServiceKm(null);
  }
}, [km, nextServiceKmEnabled, nextServiceKmManual]);

  const handleGeneratePDF = async () => {
    // Call the PDFGenerator component with the necessary props
    // Or trigger the PDF generation logic directly
    console.log("Generating PDFs");
    setIsSaving(true); // Disable buttons while generating PDF
    try {
      await generatePDF({
        customer,
        estimateItems,
        appointmentId,
        vehicleId,
        km,
        nextServiceKm,
        grandTotal,
        PdfHeaderImage,
        pdfFooterImage,
        pdfLogo,
        companyDetails,
        printDate,
        printedBy,
        vehicleMake: "",
        vehicleModel: "",
        paymentMethod: "cash",
      });
      console.log("PDF generated successfully",({companyDetails}));
      setSnackbarMessage("PDF generated successfully");
      setOpenSnackbar(true);
      // Refresh the page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setSnackbarMessage("Error generating PDF");
      setOpenSnackbar(true);
      setIsSaving(false); // Re-enable buttons on error
    }
  };
 const previewPDF = async () => {
  const cleanedItems = estimateItems
    .map((item) => ({
      ...item,
      spares: Array.isArray(item.spares)
        ? item.spares.filter(
            (sp) => sp.spareList && sp.spareList.toString().trim() !== ""
          )
        : [],
    }))
    .filter((item) => item.spares && item.spares.length > 0);

  if (cleanedItems.length === 0) {
    setSnackbarMessage("Cannot preview PDF because there are no valid spare items.");
    setOpenSnackbar(true);
    return;
  }

  const grandTotal = cleanedItems.reduce(
    (sum, it) =>
      sum +
      it.spares.reduce(
        (inner, sp) =>
          inner + (parseFloat(sp.price) || 0) * (parseFloat(sp.qty) || 0),
        0
      ),
    0
  );

  //   Build blob and open in NEW TAB
  const { default: generatePDFBlob } = await import(
    "../../../../components/PDFGenerator_estimate"
  );

  const pdfBlob = await getPDFBlob({
    customer,
    estimateItems: cleanedItems,
    appointmentId,
    vehicleId,
    km,
    nextServiceKm: nextServiceKmEnabled ? nextServiceKm : null,
    grandTotal,
    PdfHeaderImage,
    pdfFooterImage,
    pdfLogo,
    companyDetails,   //   fixed
    printDate,
    printedBy,
    paymentMethod: "",
  });

  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank"); //   opens in new tab
};

  const handlePrintMenuOpen = (event) => {
    setPrintMenuAnchor(event.currentTarget);
  };

  const handlePrintMenuClose = () => {
    setPrintMenuAnchor(null);
  };

  const handleDownloadPDF = async () => {
    handlePrintMenuClose();
    await handleGeneratePDF();
  };

  const handleViewPDFInNewTab = async () => {
    handlePrintMenuClose();
    previewPDF();
  };

  //!! Fetching UOM data from the API
  useEffect(() => {
    const fetchUomData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uom`, {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        setUomOptions(data);
      } catch (error) {
        console.log("Error fetching UOM data:", error);
      }
    };

    fetchUomData();
  }, []);
  //

  useEffect(() => {
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
         const filteredSalesUsers = usersData.filter(
        (user) => (user.role_type || "").toLowerCase().trim() !== "mechanic"
      );
      setAllUsers(filteredSalesUsers);
        setUsers(filteredUsers);


      } catch (error) {
        console.log("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [token]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // ... existing fetch calls ...

        const appointmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!appointmentResponse.ok)
          throw new Error("Failed to fetch appointment");
        const appointmentData = await appointmentResponse.json();

        // Set the selected mechanic from appointment data
                  setSelectedMechanic(Array.isArray(appointmentData.mechanic_id) ? appointmentData.mechanic_id : []);
    
      } catch (error) {
        console.error("Error fetching initial data:", error);
        setSnackbarMessage("Error loading data");
        setOpenSnackbar(true);
      }
    };

    if (token) {
      fetchInitialData();
    }
  }, [token, appointmentId]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };
  const calculateTotals = () => {
    const grandTotal = estimateItems.reduce(
      (acc, item) => acc + parseFloat(item.estimatedAmount),
      0
    );

    const overallTotal = grandTotal;
    return { grandTotal, overallTotal };
  };

  const { grandTotal, overallTotal } = calculateTotals();

  const addEstimateItem = () => {
    const newItem = {
      type: "",
      spares: [],
      reportedIssue: "",
      estimatedAmount: 0,
      isNew: true,
    };
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems, newItem];
      calculateEstimatedAmount(updatedItems.length - 1, updatedItems);
      return updatedItems;
    });
    setTimeout(() => {
      if (lastInputRef.current) {
        lastInputRef.current.focus();
      }
    }, 0);
  };

  const removeEstimateItem = async (index) => {
    const token = Cookies.get("token");
    const serviceId = estimateItems[index].service_id;

    if (!serviceId) {
      setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
      setSnackbarMessage("Service deleted successfully");
      setOpenSnackbar(true);
      return;
    }
    // disable delete button if contains only one row

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/delete_service/${serviceId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setEstimateItems((prevItems) =>
          prevItems.filter((_, i) => i !== index)
        );
        setSnackbarMessage("Service deleted successfully");
      } else if (response.status === 404) {
        setSnackbarMessage("Service not found");
      } else {
        setSnackbarMessage("Failed to delete service");
      }
    } catch (error) {
      console.log("Error deleting service:", error);
      setSnackbarMessage("Error deleting service");
    } finally {
      setOpenSnackbar(true);
    }
  };

  const updateEstimateItem = (index, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      };

      // Recalculate estimated amount if necessary
      if (["qty", "price"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
  };

  // Modify the data structure to allow multiple spares per issue
  const addSpareToIssue = (index) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].spares.push({
        spareList: "",
        qty: 0,
        price: 0,
        new: "X",
      });
      return updatedItems;
    });
  };

  // Remove tax-related logic
  const calculateEstimatedAmount = (index, items) => {
    const item = items[index];
    const totalAmount = item.spares.reduce((acc, spare) => {
      const price = parseFloat(spare.price) || 0;
      const qty = parseFloat(spare.qty) || 0;
      return acc + qty * price;
    }, 0);

    items[index].estimatedAmount = totalAmount.toFixed(2);
  };

  // Function to calculate estimated amounts for all items
  const calculateAllEstimatedAmounts = (items) => {
    items.forEach((_, index) => {
      calculateEstimatedAmount(index, items);
    });
  };

  useEffect(() => {
    // console.log({ estimateItems: estimateItems });
    // if (estimateItems.length > 0 && estimateItems[0]?.type !== "") {
    setEnableRelease(true);
    // }
  }, [estimateItems]);

  const handleSpareListChange = (index, spareIndex, value) => {
    // Check for duplicates within the same service (same reported issue)
    const isDuplicateInService = estimateItems[index].spares.some(
      (spare, j) => spare.spareList === value && j !== spareIndex
    );

    if (isDuplicateInService) {
      toast.error("This spare part already exists in this service");
      return;
    }

    const selectedItem = inventory.find((item) => item.part_name === value);
    if (selectedItem) {
      updateSpareItem(index, spareIndex, "spareList", value);
      updateSpareItem(index, spareIndex, "price", selectedItem.price);
      updateSpareItem(
        index,
        spareIndex,
        "qty",
        estimateItems[index].spares[spareIndex].qty || 1
      );
    } else {
      updateSpareItem(index, spareIndex, "spareList", value);
      updateSpareItem(index, spareIndex, "price", 0);
      updateSpareItem(index, spareIndex, "qty", 0);
    }
  };

  const updateSpareItem = (index, spareIndex, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index].spares[spareIndex] = {
        ...updatedItems[index].spares[spareIndex],
        [field]: value,
      };

      // Recalculate estimated amount if necessary
      if (["qty", "price"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }

      return updatedItems;
    });
  };

 const getFilteredInventory = (type) => {
  if (!Array.isArray(inventory)) return [];
  return inventory.filter(
    (item) => item.category?.toLowerCase() === type?.toLowerCase()
  );
};

  const getSearchFilteredInventory = (searchValue) => {
    if (!Array.isArray(inventory)) return [];
    if (!searchValue || searchValue.trim() === "") {
      // Return unique part names to avoid duplicate key errors
      const uniqueNames = new Set(inventory.map((option) => option.part_name));
      return Array.from(uniqueNames);
    }

    const lowerSearchValue = searchValue.toLowerCase();

    const filtered = inventory
      .filter(
        (item) =>
          item.part_name?.toLowerCase().includes(lowerSearchValue) ||
          item.description?.toLowerCase().includes(lowerSearchValue) ||
          item.part_number?.toLowerCase().includes(lowerSearchValue) ||
          item.inventory_id?.toLowerCase().includes(lowerSearchValue)
      )
      .map((option) => option.part_name);

    // Return unique part names to avoid duplicate key errors
    return Array.from(new Set(filtered));
  };

  const handleTypeChange = (index, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        type: value,
      };
      return updatedItems;
    });
  };

  const handleKeyPress = (event, index) => {
    if (event.key === "Enter" && index === estimateItems.length - 1) {
      addEstimateItem();
    }
  };

  const handleSpareKeyPress = (event, index, spareIndex) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSpareToIssue(index);
    }
  };

  //!! Validating and posting service data to the API
  const validateAndPostService = async (
    serviceType,
    appointmentDataLog,
    type
  ) => {
    setHasChanges(false);
    setIsSaving(true); // Disable buttons while saving
    console.log("Check 1");
    // Check if mechanic is assigned
    if (!selectedMechanic) {
      setSnackbarMessage("Please assign a mechanic before saving");
      setOpenSnackbar(true);
      setIsSaving(false);
      return;
    }

    const token = Cookies.get("token");
    const validItems = estimateItems.filter((item) => item.reportedIssue);

    if (validItems.length === 0) {
      setEnableRelease(false);
      setSnackbarMessage("Please add Service, Service Cant Blanks");
      setOpenSnackbar(true);
      setIsSaving(false);
      return;
    }
    console.log("Check 2");
    // Filter out empty spares first
    const itemsWithFilledSpares = validItems.map((item) => ({
      ...item,
      spares: item.spares.filter(
        (spare) => spare.spareList && spare.spareList.trim() !== ""
      ),
    }));

    // **NEW VALIDATION**: Check that each service has at least one spare item
    const servicesWithoutSpares = itemsWithFilledSpares.filter(
      (item) => item.spares.length === 0
    );
    if (servicesWithoutSpares.length > 0) {
      setSnackbarMessage(
        `Cannot save: ${servicesWithoutSpares.length} service(s) have no spare parts. Each service must have at least one spare part.`
      );
      setOpenSnackbar(true);
      setIsSaving(false);
      return;
    }

    // Prepare services array, each spare part as a separate service
    const services = itemsWithFilledSpares.flatMap((item) => {
      if (item.spares.length === 0) {
        //        if (
        //   !services.items_required[0] ||
        //   !services.items_required[0].item_name ||
        //   services.items_required[0].item_name.trim() === ""
        // ) {
        //   setSnackbarMessage("Please add Service, Service can't be blank");
        //   setOpenSnackbar(true);
        //    return; // Use return instead of break to exit the function;
        // }

        // If no spares, send only the reported issue
        return [
          {
            // service_id: item.spares.length > 0 ? item.spares[0].service_id : "", // No service_id since there are no spares
            service_id: item.service_id ? item.service_id : "",
            service_description: item.reportedIssue,
            price: item.estimatedAmount,
            service_type: item.type,
            items_required: [], // Empty array for items_required
            status: "pending", // Set the status as needed
          },
        ];
      }
      return item.spares.map((spare) => ({
        service_id: spare.new != "X" ? spare.service_id : "", // Use existing service_id if available
        service_description: item.reportedIssue,
        price: item.estimatedAmount,
        service_type: item.type,
        items_required: [
          {
            // item_type: item.type,
            item_id: inventory.find(
              (invItem) => invItem.part_name === spare.spareList
            )?.inventory_id,
            item_name: spare.spareList,
            qty: spare.qty,
            price: spare.price,
          },
        ],
        status: "pending", // Set the status as needed
      }));
    });

    // Build procurement items for ALL services with items
    // This ensures Purchase → Received → Consumed workflow
    const itemsToProcure = services
      .flatMap((service) =>
        service.items_required.map((item) => ({
          product: item.item_name,
          qty: item.qty,
          service_id: service.service_id,
          item_id: item.item_id,
        }))
      )
      .filter((item) => item && item.item_id && item.qty > 0);

    console.log({ services, itemsToProcure });
    let is_empty = false;
    let is_zero = false;

    // Only validate services that have items_required with actual items
    for (const service of services) {
      if (service.items_required && service.items_required.length > 0) {
        for (const item of service.items_required) {
          if (item.qty === 0) {
            is_zero = true;
            break;
          }
          if (!item.item_name || item.item_name.trim() === "") {
            is_empty = true;
            break;
          }
        }
        if (is_empty || is_zero) break;
      }
    }

    if (!is_empty && !is_zero) {
      try {
        console.log("Check 4");
        // POST SERVICES FIRST to get service_ids
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/${serviceType}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(services),
          }
        );
        console.log("Check 6");
        if (!response.ok) throw new Error(`Failed to post to ${serviceType}`);

        // After successful POST, fetch the updated appointment to get assigned service_ids
        try {
          const apptResp = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (apptResp.ok) {
            const apptData = await apptResp.json();
            const returnedServices =
              apptData.services_actual || apptData.services || [];

            const itemsToProcureFromResponse = returnedServices
              .flatMap((service) =>
                (service.items_required || []).map((item) => ({
                  product: item.item_name,
                  qty: item.qty,
                  service_id: service.service_id,
                  item_id: item.item_id,
                }))
              )
              .filter((item) => item && item.item_id && item.qty > 0);

            if (itemsToProcureFromResponse.length > 0) {
              await createProcurement(itemsToProcureFromResponse);
            }
          }
        } catch (err) {
          // If fetching appointment fails, continue without blocking the flow
          console.warn("Failed to fetch updated appointment for procurement:", err);
        }
        
        setSnackbarMessage(`Job Card ${appointmentId} updated successfully`);
        setOpenSnackbar(true);
        handleRelease();
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (err) {
        setSnackbarMessage(`Error posting to ${serviceType}`);
        setOpenSnackbar(true);
        setIsSaving(false); // Re-enable buttons on error
      }
    } else {
      setSnackbarMessage("Service can't be blank. Please add Service.");
      setOpenSnackbar(true);
      setIsSaving(false); // Re-enable buttons on error
    }
  };

  // Function to create procurement
  //   IMPROVED: Shortage-based PR creation
  // Calculates shortage = required_qty - available_qty
  // Creates PR ONLY for shortage amount
  // Auto-receives PR and updates inventory
  // Consumption logic then consumes the full required qty
  const createProcurement = async (itemsToProcure) => {
    const token = Cookies.get("token");
    try {
      //   NEW: Deduplicate items by inventory_id and calculate shortage
      // Group items by item_id and sum quantities
      const deduplicatedItems = {};
      for (const item of itemsToProcure) {
        if (!deduplicatedItems[item.item_id]) {
          deduplicatedItems[item.item_id] = { ...item, qty: 0 };
        }
        deduplicatedItems[item.item_id].qty += item.qty;
      }
      let uniqueItems = Object.values(deduplicatedItems);

      //   NEW: Calculate shortage for each item
      // Get current available quantities from inventory
      uniqueItems = uniqueItems.map((item) => {
        const inventoryItem = inventory.find(
          (inv) => inv.inventory_id === item.item_id
        );
        const availableQty = inventoryItem?.quantity || 0;
        const requiredQty = item.qty;

        // Calculate shortage: how much needs to be procured
        const shortageQty = Math.max(0, requiredQty - availableQty);

        console.log(
          `Item: ${item.product}, Required: ${requiredQty}, Available: ${availableQty}, Shortage: ${shortageQty}`
        );

        return {
          ...item,
          qty: requiredQty, // Full required quantity (for consumption)
          shortage_qty: shortageQty, // Shortage quantity (for PR creation)
          available_qty: availableQty, // Track available for reference
        };
      });

      // Filter out items where there's no shortage
      const itemsNeedingProcurement = uniqueItems.filter((item) => item.shortage_qty > 0);

      // Skip if no items need procuring (all have sufficient stock)
      if (itemsNeedingProcurement.length === 0) {
        console.log("All items have sufficient stock, no PR needed");
        setPrCreated(true);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/procurement/srpr`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pr_type: "SRPR",
            items: itemsNeedingProcurement, // Only items with shortage
            referenceName: `Procurement for Job Card ${appointmentId}`,
            service_id: itemsNeedingProcurement[0]?.service_id,
            status: "Completed", // Auto-complete and auto-receive for job assessment workflow
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create procurement");
      }
      const data = await response.json();
      setPrNo(data.pr_no); // Set the PR number from the response
      setPrCreated(true); // Mark PR as created
      console.log("Procurement created successfully:", data.pr_no);
    } catch (error) {
      // Don't show error to user for PR creation failure
      // Continue with service consumption anyway
      console.error("Error creating procurement:", error);
    }
  };

  //!! Updating KM in the database
  const updateKm = async (newKm) => {
    const token = Cookies.get("token");
    if (isNaN(newKm)) {
      setSnackbarMessage("KM should be a number");
      setSeverity("error");
      setOpenSnackbar(true);
      return;
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_km`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ km: newKm }),
        }
      );
      if (!response.ok) throw new Error("Failed to update KM");
      setKm(newKm);
      setSnackbarMessage(`KM updated successfully`);
      setSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      setSnackbarMessage("Failed to update KM");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };
  const handleKmChange = (event) => {
    setKm(event.target.value);
    updateKm(event.target.value);
  };

  useEffect(() => {
    setTempKm(km); // Update tempKm whenever km changes
  }, [km]);

  const handleTempKmChange = (event) => {
    setTempKm(event.target.value); // Sync tempKm with input changes
  };

  const handleUpdateKmClick = () => {
    if (tempKm === "" || tempKm === "0" || tempKm === 0) {
      // If the value is empty or 0, show an error message
      setSnackbarMessage("KM cannot be empty or 0");
      setOpenSnackbar(true);
      setError("error");
      return; // Add return statement to prevent further execution
    }

    // If the value is valid, proceed with the update
    updateKm(tempKm);
  };

  const handleRelease = async () => {
    // Check if mechanic is assigned
    if (!selectedMechanic) {
      setSnackbarMessage("Please assign a mechanic before saving");
      setOpenSnackbar(true);
      return;
    }

    // check if km is 0
    console.log("Hitting Before");
    // use appointment/released/appointmentId
    const token = Cookies.get("token");
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/released/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Hitting After");
    if (!response.ok) throw new Error("Failed to release appointment");
    setSnackbarMessage("Appointment released successfully");
    setOpenSnackbar(true);
    // refresh the page only if success
    if (response.ok) {
      // checking if whatsapp is logged in
      if (checkWhatsappLoggedIn()) {
        const current_page = "jobCard";
        const template = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${current_page}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        // replace placeholders in the template message if any
        const dynamicValues = {
          customer_name: customer.customer_name,
          order_id: appointmentId,
          vehicle_id: vehicleId,
          km: km,
        };
        const message = replacePlaceholders(
          template.data.template_message,
          dynamicValues
        );
        const fromNumber = Cookies.get("phone");
        const toNumber = customer.contact.phone;
        const type = "text";
        const file = null;
        const caption = null;
        // console.log(fromNumber, toNumber, message, type, file, caption);
        sendWhatsappMessage(fromNumber, toNumber, message, type, file, caption);
      }
      setTimeout(() => {
        window.location.reload();
        router.push(`/views/`);
      }, 2000);
    }
  };

  // !? replace placeholders in the template message if any
  const replacePlaceholders = (template, dynamicValues) => {
    return template.replace(
      /{{([^}]+)}}/g,
      (match, p1) => dynamicValues[p1] || match
    );
  };

  // delete a spare by service_id
  const deleteSpareByServiceId = async (serviceId, index, spareIndex) => {
    const token = Cookies.get("token");
    if (serviceId == null) {
      setEstimateItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].spares.splice(spareIndex, 1); // Remove the spare at the specified index
        return updatedItems;
      });
      return;
    }
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/delete_service/${serviceId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.status == 200) {
      setSnackbarMessage("Spare deleted successfully");
      setOpenSnackbar(true);
      window.location.reload();
      setEstimateItems((prevItems) => {
        const updatedItems = [...prevItems];
        updatedItems[index].spares.splice(spareIndex, 1); // Remove the spare at the specified index
        return updatedItems;
      });
    } else {
      setSnackbarMessage("Failed to delete spare : Try again later");
      setOpenSnackbar(true);
    }
  };

  // Handle edit spare - move to top
  const handleEditSpare = (itemIndex, spareIndex) => {
    const spare = estimateItems[itemIndex].spares[spareIndex];
    setEditedSpareData({
      spareList: spare.spareList,
      qty: spare.qty,
      price: spare.price,
      originalIndex: spareIndex,
    });
    setEditingSpare({ itemIndex, spareIndex });

    // Move spare to top by reordering
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      const editedSpare = updatedItems[itemIndex].spares.splice(
        spareIndex,
        1
      )[0];
      updatedItems[itemIndex].spares.unshift(editedSpare);
      return updatedItems;
    });
  };

  // Handle save spare edit
  const handleSaveSpareEdit = () => {
    if (!editedSpareData.spareList || editedSpareData.spareList.trim() === "") {
      setSnackbarMessage("Please enter a spare part name");
      setOpenSnackbar(true);
      return;
    }

    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[editingSpare.itemIndex].spares[0] = {
        ...updatedItems[editingSpare.itemIndex].spares[0],
        spareList: editedSpareData.spareList,
        qty: parseFloat(editedSpareData.qty) || 0,
        price: parseFloat(editedSpareData.price) || 0,
      };
      calculateEstimatedAmount(editingSpare.itemIndex, updatedItems);
      return updatedItems;
    });

    setSnackbarMessage("Spare updated successfully");
    setOpenSnackbar(true);
    setEditingSpare({ itemIndex: null, spareIndex: null });
    setEditedSpareData({});
  };

  // Handle cancel spare edit
  const handleCancelSpareEdit = () => {
    // Move the spare back to its original position
    if (
      editingSpare.itemIndex !== null &&
      editedSpareData.originalIndex !== undefined
    ) {
      setEstimateItems((prevItems) => {
        const updatedItems = [...prevItems];
        const editedSpare = updatedItems[editingSpare.itemIndex].spares.shift();
        updatedItems[editingSpare.itemIndex].spares.splice(
          editedSpareData.originalIndex,
          0,
          editedSpare
        );
        return updatedItems;
      });
    }
    setEditingSpare({ itemIndex: null, spareIndex: null });
    setEditedSpareData({});
  };

  // Calculate itemsToProcure for rendering // include item_id
  const itemsToProcure = estimateItems
    .map((item) => {
      const stockQuantity =
        inventory.find((invItem) => invItem.part_name === item.spareList)
          ?.quantity || 0;
      const requiredQuantity =
        item.qty > stockQuantity ? item.qty - stockQuantity : 0; // Calculate the difference
      return {
        ...item,
        qty: requiredQuantity,
        item_id: inventory.find(
          (invItem) => invItem.part_name === item.spareList
        )?.inventory_id,
      }; // Include only the difference in quantity
    })
    .filter((item) => item.qty > 0); // Only include items with a positive quantity difference

  const isCreatePrEnabled = itemsToProcure.length > 0 && !prCreated; // Enable if there are items to procure and PR not created

  //!! Getting common PR number from services_actual
  const getCommonPrNo = () => {
    if (!appointmentDataLog || !appointmentDataLog.services_actual) {
      return null; // Return null if data is not available
    }

    const prNumbers = appointmentDataLog.services_actual.flatMap((service) =>
      service.items_required.map((item) => item.pr_no)
    );

    // Filter out undefined values and get unique PR numbers
    const uniquePrNumbers = [...new Set(prNumbers.filter((pr) => pr))];

    // Return the common PR number if all are the same
    return uniquePrNumbers.length === 1 ? uniquePrNumbers[0] : null;
  };

  // Get the common PR number
  const commonPrNo = getCommonPrNo();

  //!! Calculating total tax for items
  const calculateTotalTax = (items) => {
    return items.reduce((acc, item) => {
      const price = parseFloat(item.price) || 0; // Ensure price is a number
      const qty = parseFloat(item.qty) || 0; // Ensure qty is a number
      const tax = parseFloat(item.tax) || 0; // Ensure tax is a number

      // Calculate the total amount including GST
      const amountIncludingGST = price * qty;

      // Calculate the GST amount using the provided formula
      const gstAmount =
        amountIncludingGST - amountIncludingGST / (1 + tax / 100);

      return acc + gstAmount; // Accumulate the total GST
    }, 0);
  };

  // Function to handle the confirmation of deletion
  const handleConfirm = async () => {
    if (selectedRow !== null && estimateItems[selectedRow]) {
      await removeEstimateItem(selectedRow);
      setOpenConfirmationModal(false);
    }
  };

  // Modify the removeEstimateItem function to open the dialog
  const handleDeleteClick = (index) => {
    setSelectedRow(index);
    setOpenConfirmationModal(true);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600); // Adjust the width as needed for your mobile breakpoint
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially to set the state

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to fetch updated inventory
  const fetchInventory = async () => {
    const token = Cookies.get("token");
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/inventory?limit=1000000`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch inventory");
      const data = await response.json();
      // setInventory(data);
      setInventory(Array.isArray(data) ? data : data.items || data.data || []);
    } catch (error) {
      console.log("Error fetching inventory:", error);
    }
  };

  const assignMechanic = async (mechanicId, mechanicName) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/assign_mechanic`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ mechanic_id: mechanicId }),
        }
      );

      if (!response.ok) throw new Error("Failed to assign mechanic");

   setSelectedMechanic(Array.isArray(mechanicId) ? mechanicId : [mechanicId]);
      setSnackbarMessage(`Mechanic ${mechanicName} assigned successfully`);
      setOpenSnackbar(true);

      // Optional: Send WhatsApp notification
      if (checkWhatsappLoggedIn()) {
        const current_page = "jobCard";
        const template = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${current_page}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        const dynamicValues = {
          customer_name: customer.customer_name,
          order_id: appointmentId,
          vehicle_id: vehicleId,
          km: km,
          mechanic_name: mechanicName,
        };
        const message = replacePlaceholders(
          template.data.template_message,
          dynamicValues
        );
        const fromNumber = Cookies.get("phone");
        const toNumber = customer.contact.phone;
        const type = "text";
        sendWhatsappMessage(fromNumber, toNumber, message, type, null, null);
      }
    } catch (error) {
      console.error("Error assigning mechanic:", error);
      setSnackbarMessage("Error assigning mechanic");
      setOpenSnackbar(true);
    }
  };

  const handleToggleExpand = (index) => {
    setExpandedComments((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  //!! Handle Status Change API call
  const handleStatusUpdate = async () => {
    if (!statusChange) {
      setSnackbarMessage("Please select a status");
      setOpenSnackbar(true);
      return;
    }

    const token = Cookies.get("token");

    // Map the dropdown values to API status values
    const statusMap = {
      server_center: "released",
      service_inspection: "inspection",
      invoice: "invoice",
    };

    const apiStatus = statusMap[statusChange];

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/${appointmentId}/update_status`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: apiStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setSnackbarMessage("Status updated successfully");
      setSeverity("success");
      setOpenSnackbar(true);
      setStatusChange(""); // Reset the dropdown
    } catch (error) {
      console.error("Error updating status:", error);
      setSnackbarMessage("Error updating status");
      setSeverity("error");
      setOpenSnackbar(true);
    }
  };

  if (isMobile) {
    return (
      <div>
        <ToastContainer />
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
    );
  }
  const pageType = Cookies.get("page_type"); // "tab" or others

  const safeParseComments = (comments) => {
    if (!comments) return [];

    // Already parsed
    if (typeof comments === "object") return comments;

    try {
      const parsed = JSON.parse(comments);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Plain text fallback
      return [
        {
          comments: comments,
          current_date: null,
        },
      ];
    }
  };

  return (
    <div>
      {/* <Navbar pageName="Job Assessment Details" hasChanges={hasChanges} /> */}
      {pageType !== "tab" && (
        <Navbar pageName="Job Assessment Details" hasChanges={hasChanges} />
      )}
      <Dialog
        open={opencomment_modal}
        onClose={() => setopencomment_modal(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2, // Rounded corners
            padding: 2, // Add padding for better spacing
            overflow: "hidden", // Ensure content doesn't overflow outside
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", // Subtle shadow for modern look
          },
        }}
      >
        {/* Close Icon */}
        <IconButton
          edge="end"
          color="danger"
          onClick={() => setopencomment_modal(false)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2,
          }}
        >
          <CloseIcon />
        </IconButton>

        <TableContainer
          sx={{
            maxHeight: "60vh", // Make it scrollable vertically
            overflowY: "auto",
            backgroundColor: "#f9f9f9", // Light background for modern feel
            borderRadius: 8, // Rounded edges for the table container
          }}
        >
          <Table>
            <TableHead
              sx={{
                position: "sticky", // Sticky header
                top: 0, // Fix header at the top
                backgroundColor: "#f1f1f1", // Light background for header
                color: "#333", // Dark text for contrast
                zIndex: 1, // Ensure header is above the content
              }}
            >
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                  Reported Issue
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                  Part Number
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                  Inspection Status
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                  Comments
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appointmentDataLog?.services_actual &&
              appointmentDataLog.services_actual.length > 0 ? (
                (() => {
                  // Group services by description to remove duplicates
                  const groupedServices = {};
                  const serviceOrder = [];

                  appointmentDataLog.services_actual.forEach((service) => {
                    const key = service.service_description;
                    if (!groupedServices[key]) {
                      groupedServices[key] = {
                        service_description: service.service_description,
                        items_required: [],
                        service_status: service.service_status,
                        comments: service.comments,
                      };
                      serviceOrder.push(key);
                    }
                    // Add unique items to avoid duplicates
                    if (
                      service.items_required &&
                      service.items_required.length > 0
                    ) {
                      service.items_required.forEach((item) => {
                        const itemExists = groupedServices[
                          key
                        ].items_required.some(
                          (existingItem) =>
                            existingItem.item_id === item.item_id &&
                            existingItem.item_name === item.item_name
                        );
                        if (!itemExists) {
                          groupedServices[key].items_required.push(item);
                        }
                      });
                    }
                  });

                  return serviceOrder.map((key) => {
                    const service = groupedServices[key];
                    return (
                      <TableRow key={key}>
                        <TableCell>{service.service_description}</TableCell>
                        <TableCell>
                          {service.items_required?.map((item) => (
                            <Typography
                              key={`${item.item_id}-${item.item_name}`}
                              variant="body2"
                              sx={{ fontSize: "0.9rem" }}
                            >
                              {item.item_id}: {item.item_name} ({item.qty})
                            </Typography>
                          ))}
                        </TableCell>
                        <TableCell>{service.service_status}</TableCell>
                        <TableCell>
                          {safeParseComments(service.comments).map(
                            (comment, index) => {
                              const commentText = comment.comments;
                              const truncatedText =
                                commentText.length > 200
                                  ? commentText.slice(0, 300) + "..."
                                  : commentText;

                              return (
                                <Box key={index} sx={{ mb: 1 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontSize: "0.9rem", color: "#333" }}
                                  >
                                    {expandedComments[index]
                                      ? commentText
                                      : truncatedText}
                                  </Typography>
                                  {commentText.length > 200 && (
                                    <Button
                                      onClick={() => handleToggleExpand(index)}
                                      variant="text"
                                      sx={{
                                        padding: 0,
                                        color: "primary.main",
                                        fontSize: "0.85rem",
                                      }}
                                    >
                                      {expandedComments[index] ? (
                                        <>
                                          <ExpandLess fontSize="small" /> Read
                                          less
                                        </>
                                      ) : (
                                        <>
                                          <ExpandMore fontSize="small" /> Read
                                          more
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  <Typography
                                    variant="caption"
                                    color="textSecondary"
                                    sx={{ fontSize: "0.75rem" }}
                                  >
                                    {comment.current_date}
                                  </Typography>
                                </Box>
                              );
                            }
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  });
                })()
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ padding: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      No comments available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Dialog>
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",
          minHeight: "89vh",
        }}
        style={{ marginTop: pageType !== "tab" ? "0px" : "16px" }}
      >
        <Box>
          {loading && <Typography>Loading details...</Typography>}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <MuiAlert
              onClose={handleCloseSnackbar}
              severity={severity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </MuiAlert>
          </Snackbar>
          {customer && (
            <Box display="flex" flexDirection="column" gap={3}>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  marginBottom: 3,
                  paddingBottom: 2,
                  width: "%",
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
                    }}
                  >
                    {/* <BackButton /> */}
                    <Typography variant="h6" style={{ marginLeft: "8px" }}>
                      Job Card No - {appointmentId}
                    </Typography>
                  </div>

                <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
  {/* KM FIELD */}
  <TextField
    label="KiloMeters"
    size="small"
    variant="outlined"
    value={tempKm}
    type="number"
    onChange={(e) => {
      setHasChanges(true);
      if (e.target.value < 0) { e.preventDefault(); return; }
      handleTempKmChange(e);
    }}
    sx={{ width: 160, flexShrink: 0 }}
  />
  <Button
    variant="contained"
    color="primary"
    onClick={handleUpdateKmClick}
    style={{ height: "38px" }}
  >
    Update
  </Button>

  {/* NEXT SERVICE KM CHECKBOX */}
  <FormControlLabel
    control={
      <Checkbox
        checked={nextServiceKmEnabled}
        onChange={(e) => {
          const checked = e.target.checked;
          setNextServiceKmEnabled(checked);
          if (checked) {
            const currentKm = Number(km);
            if (Number.isFinite(currentKm)) {
              const computed = currentKm + 10000;
              setNextServiceKm(computed);
              setNextServiceKmManual(false);
              updateNextServiceKm(computed);
            }
          } else {
            setNextServiceKm(null);
            updateNextServiceKm(null);
          }
          setHasChanges(true);
        }}
      />
    }
    label="Add next service km in PDF"
  />

  {/* NEXT SERVICE KM FIELD */}
  {nextServiceKmEnabled && (
    <Box display="flex" alignItems="center" gap={1}>
      <TextField
        label="Next Service KM"
        value={nextServiceKm ?? ""}
        type="number"
        size="small"
        onChange={handleNextServiceKmChange}
        sx={{ width: 160, flexShrink: 0 }}
      />
      <Typography variant="body2" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
        (Current: {nextServiceKm ?? "-"})
      </Typography>
    </Box>
  )}

  {/* SALES DROPDOWN */}
  <FormControl sx={{ width: 200 }} size="small">
    <InputLabel id="sales-label">Sales</InputLabel>
    <Select
      labelId="sales-label"
      value={selectedSales || ""}
      label="Sales"
      onChange={(e) => {
        setSelectedSales(e.target.value);
        setHasChanges(true);
      }}
      renderValue={(selected) => {
        const user = allUsers.find(u => u.user_id === selected);
        return user ? `${user.firstName} ${user.lastName}` : "";
      }}
    >
      {allUsers.map((user) => (
        <MenuItem key={user.user_id} value={user.user_id}>
          {user.firstName} {user.lastName}
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  {/* REFERRED BY DROPDOWN */}
  <FormControl sx={{ width: 200 }} size="small">
    <InputLabel id="referred-label">Referred By</InputLabel>
    <Select
      labelId="referred-label"
      value={referredBy || ""}
      label="Referred By"
      onChange={(e) => {
        setReferredBy(e.target.value);
        if (e.target.value !== "Customer reference") setCustomerRefName("");
        setHasChanges(true);
      }}
    >
      <MenuItem value="Online">Online</MenuItem>
      <MenuItem value="Tele in">Tele in</MenuItem>
      <MenuItem value="Telecalling out">Telecalling out</MenuItem>
      <MenuItem value="Walk-in">Walk-in</MenuItem>
      <MenuItem value="Advertisement">Advertisement</MenuItem>
      <MenuItem value="Customer reference">Customer reference</MenuItem>
    </Select>
  </FormControl>

  {/* CUSTOMER REFERENCE NAME — conditional */}
  {referredBy === "Customer reference" && (
    <TextField
      label="Customer Reference Name"
      size="small"
      sx={{ width: 200 }}
      value={customerRefName}
      onChange={(e) => {
        setCustomerRefName(e.target.value);
        setHasChanges(true);
      }}
    />
  )}

  {/* SAVE SALES INFO */}
  <Button
    variant="contained"
    size="small"
    onClick={handleSaveSalesInfo}
    disabled={!selectedSales && !referredBy}
    sx={{ height: "38px" }}
  >
    SAVE
  </Button>

  {/* MECHANIC MULTI SELECT */}
  <FormControl sx={{ width: 250 }} size="small">
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
          mechanicIds,
          selectedUsers.map(u => `${u.firstName} ${u.lastName}`)
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
          <ListItemText primary={`${user.firstName} ${user.lastName}`} />
        </MenuItem>
      ))}
    </Select>
  </FormControl>

  {/* STATUS CHANGE DROPDOWN */}
  <FormControl sx={{ width: 200 }} size="small" required>
    <InputLabel id="status-label">Status Change</InputLabel>
    <Select
      labelId="status-label"
      label="Status Change"
      value={statusChange}
      size="small"
      error={!statusChange}
      onChange={(e) => setStatusChange(e.target.value)}
    >
      <MenuItem value=""><em>Select Status</em></MenuItem>
      <MenuItem value="server_center">Save to Server Center</MenuItem>
      <MenuItem value="service_inspection">Save to Service Inspection</MenuItem>
      <MenuItem value="invoice">Save to Invoice</MenuItem>
    </Select>
  </FormControl>

  {/* STATUS UPDATE BUTTON */}
  <Button
    variant="contained"
    color="primary"
    style={{ height: "38px" }}
    onClick={handleStatusUpdate}
  >
    Status Update
  </Button>
</div>


                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "220px", marginRight: 16 }}>
                    <Tooltip title={customer?.customer_name || ""}>
                      <Typography variant="h6">
                        {customer?.customer_name?.slice(0, 20)}
                      </Typography>
                    </Tooltip>

                    {/* {console.log({ customer: customer })} */}
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Phone: </strong>
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
                      {customer.contact.address.state} -{" "}
                      {customer.contact.address.pinCode}
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
                            {vehicle.plateNumber || "N/A"}
                          </Typography>
                        </div>
                      ))}
                  </div>

                  {/* //! Not Required anymore */}
                  {/* <div style={{ flex: 1, minWidth: "220px", marginLeft: 16 }}>
                    <Box display="flex" alignItems="center">
                      {Array.isArray(appointmentDataLog.services_actual) &&
                        // servicesEstimateExists && (
                        servicesActualExists && (
                          <>
                            <SportsScoreIcon
                              style={{
                                fontSize: "100px",
                                color:
                                  appointmentDataLog.status === "completed"
                                    ? "green"
                                    : appointmentDataLog.status === "released"
                                    ? "orange"
                                    : appointmentDataLog.status === "scheduled"
                                    ? "red"
                                    : "inherit",
                              }}
                            />
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => handleRelease()}
                              disabled={
                                appointmentDataLog.status === "released" ||
                                appointmentDataLog.status === "invoice" ||
                                appointmentDataLog.status === "inspection" ||
                                appointmentDataLog.status === "completed" ||
                                enableRelease == false
                              }
                              sx={{ marginLeft: 2 }}
                              // disabled={enableRelease }
                            >
                              {appointmentDataLog.status === "released" ||
                              appointmentDataLog.status === "invoice" ||
                              appointmentDataLog.status === "inspection" ||
                              appointmentDataLog.status === "completed"
                                ? "Already Released"
                                : "Release"}
                            </Button>
                          </>
                        )}
                    </Box>
                  </div> */}
                </div>
              </Paper>

              <Paper
                elevation={1}
                sx={{
                  padding: 1,
                  borderRadius: 2,
                  marginBottom: 3,
                  marginTop: -5,
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <TableContainer className="table-container">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell className="table-cell" align="left">
                            Reported Issue
                          </TableCell>
                          <TableCell className="table-cell" align="right">
                            Spare List
                          </TableCell>
                          <TableCell className="table-cell" align="center">
                            Estimated Amount
                          </TableCell>
                          <TableCell className="table-cell" align="center">
                            <IconButton
                              type="outlined"
                              onClick={() => {
                                if (
                                  appointmentDataLog?.services_actual?.length >
                                  0
                                ) {
                                  setopencomment_modal(true);
                                } else {
                                  setSnackbarMessage(
                                    "No services available to show comments"
                                  );
                                  setOpenSnackbar(true);
                                }
                              }}
                              disabled={
                                !appointmentDataLog?.services_actual?.length
                              }
                            >
                              <RateReviewIcon style={{ color: "black" }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {estimateItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell colSpan={4}>
                              <Card variant="outlined">
                                {/* <CardHeader
                                  title={item.reportedIssue}
                                  sx={{ backgroundColor: "#f5f5f5", textAlign: "center" }}
                                /> */}

                                {/* Estimated Amount */}

                                <Box
                                  display="flex"
                                  justifyContent="flex-end"
                                  alignItems="left"
                                  gap={2}
                                >
                                  {Role != "Mechanic" && (
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: "bold",
                                        paddingTop: "15px",
                                      }}
                                    >
                                      Estimated Amount:{" "}
                                      {parseFloat(item.estimatedAmount).toFixed(
                                        2
                                      )}
                                    </Typography>
                                  )}
                                  {/* <IconButton
                                    onClick={() => addSpareToIssue(index)}
                                    sx={{
                                      color: "green",
                                      marginTop: "8px",
                                      marginRight: "10px",
                                      variant: "outlined",
                                      borderRadius: "8px",
                                      backgroundColor: "green",
                                      color: "white",
                                      "&:hover": {
                                        backgroundColor: "#006D5B",
                                      },
                                    }}
                                  >
                                    <AddIcon />
                                  </IconButton> */}
                                  <IconButton
                                    disabled={disableDelete}
                                    onClick={() => handleDeleteClick(index)}
                                    sx={{
                                      color: "red",
                                      marginTop: "10px",
                                      marginRight: "15px",
                                      marginLeft: "-15px",
                                    }}
                                  >
                                    {/* <DeleteIcon /> */}
                                  </IconButton>
                                  {/* </Tooltip> */}
                                </Box>

                                <CardContent>
                                  <Box
                                    display="flex"
                                    flexDirection="column"
                                    gap={2}
                                  >
                                    {/* Reported Issue and Spares */}
                                    <Box
                                      display="flex"
                                      flexDirection={{
                                        xs: "column",
                                        md: "row",
                                      }}
                                      gap={2}
                                      alignItems={{
                                        xs: "stretch",
                                        md: "flex-start",
                                      }}
                                    >
                                      <TextField
                                        label="Reported Issue"
                                        value={item.reportedIssue || ""}
                                        size="small"
                                        disabled={true}
                                        fullWidth
                                        multiline
                                        rows={2}
                                        sx={{
                                          flex: { xs: "1 1 auto", md: 4 },
                                          width: { xs: "100%", md: "auto" },
                                          maxWidth: { xs: "100%", md: "50%" },
                                          textarea: {
                                            padding: "10px", // Adds padding to the text area for more spacing
                                          },
                                          borderRadius: "8px", // Optional: Adjust border radius for a more rectangular shape
                                          "& .MuiInputBase-root": {
                                            borderRadius: "8px", // Ensures the border radius is applied to the entire input field
                                          },
                                        }}
                                      />

                                      <Box
                                        sx={{
                                          flex: { xs: "1 1 auto", md: 2 },
                                          width: { xs: "100%", md: "50%" },
                                          paddingLeft: {
                                            xs: "0px",
                                            md: "10px",
                                          },
                                          marginTop: { xs: "8px", md: "0px" },
                                        }}
                                      >
                                        {item.spares.length === 0 ? (
                                          <Box
                                            sx={{
                                              border: "1px solid #ddd",
                                              borderRadius: "8px",
                                              padding: 3,
                                              textAlign: "center",
                                              backgroundColor: "#fafafa",
                                            }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                color: "#999",
                                                marginBottom: 2,
                                              }}
                                            >
                                              No spares added yet
                                            </Typography>
                                            <Button
                                              variant="contained"
                                              color="success"
                                              size="small"
                                              startIcon={<AddIcon />}
                                              onClick={() =>
                                                addSpareToIssue(index)
                                              }
                                            >
                                              Click to Add Spare Parts
                                            </Button>
                                          </Box>
                                        ) : (
                                          <TableContainer
                                            sx={{
                                              border: "1px solid #ddd",
                                              borderRadius: "8px",
                                            }}
                                          >
                                            <Table size="small">
                                              <TableHead>
                                                <TableRow
                                                  sx={{
                                                    backgroundColor: "#f5f5f5",
                                                  }}
                                                >
                                                  <TableCell
                                                    sx={{
                                                      fontWeight: "bold",
                                                      fontSize: "0.85rem",
                                                    }}
                                                  >
                                                    Part Name
                                                  </TableCell>
                                                  <TableCell
                                                    align="center"
                                                    sx={{
                                                      fontWeight: "bold",
                                                      fontSize: "0.85rem",
                                                    }}
                                                  >
                                                    Qty
                                                  </TableCell>
                                                  {Role != "Mechanic" && (
                                                    <TableCell
                                                      align="center"
                                                      sx={{
                                                        fontWeight: "bold",
                                                        fontSize: "0.85rem",
                                                      }}
                                                    >
                                                      Price
                                                    </TableCell>
                                                  )}
                                                  <TableCell
                                                    align="center"
                                                    sx={{
                                                      fontWeight: "bold",
                                                      fontSize: "0.85rem",
                                                    }}
                                                  >
                                                    Action
                                                  </TableCell>
                                                </TableRow>
                                              </TableHead>
                                              <TableBody>
                                                {/* Blank input row to add new spare - at the TOP */}
                                                <TableRow
                                                  sx={{
                                                    backgroundColor: "#fafafa",
                                                  }}
                                                  key={`new-spare-${index}`}
                                                >
                                                  <TableCell
                                                    sx={{ fontSize: "0.85rem" }}
                                                  >
                                                    <Autocomplete
                                                      size="small"
                                                      disablePortal
                                                      options={getSearchFilteredInventory(
                                                        newSpareInputs[index]
                                                          ?.spareList || ""
                                                      )}
                                                      value={
                                                        newSpareInputs[index]
                                                          ?.spareList || ""
                                                      }
                                                      onChange={(
                                                        e,
                                                        newValue
                                                      ) => {
                                                        setNewSpareInputs({
                                                          ...newSpareInputs,
                                                          [index]: {
                                                            ...(newSpareInputs[
                                                              index
                                                            ] || {}),
                                                            spareList:
                                                              newValue || "",
                                                          },
                                                        });
                                                        if (newValue) {
                                                          const selectedItem =
                                                            inventory.find(
                                                              (item) =>
                                                                item.part_name ===
                                                                newValue
                                                            );
                                                          if (selectedItem) {
                                                            setNewSpareInputs(
                                                              (prev) => ({
                                                                ...prev,
                                                                [index]: {
                                                                  ...(prev[
                                                                    index
                                                                  ] || {}),
                                                                  price:
                                                                    selectedItem.price ||
                                                                    "",
                                                                },
                                                              })
                                                            );
                                                          }
                                                        }
                                                      }}
                                                      onInputChange={(
                                                        event,
                                                        newValue
                                                      ) => {
                                                        if (newValue) {
                                                          setTypedname(
                                                            newValue
                                                          );
                                                        }
                                                      }}
                                                      filterOptions={(options, state) => {
                                                        const inputValue =
                                                          state.inputValue.toLowerCase();
                                                        return options.filter(
                                                          (option) =>
                                                            option
                                                              .toLowerCase()
                                                              .includes(inputValue)
                                                        );
                                                      }}
                                                      renderInput={(params) => (
                                                        <TextField
                                                          {...params}
                                                          label="Add Spare Part"
                                                          size="small"
                                                        />
                                                      )}
                                                      noOptionsText={
                                                        <Box
                                                          display="flex"
                                                          alignItems="center"
                                                          justifyContent="space-between"
                                                        >
                                                          <Typography variant="body1">
                                                            No Items Available
                                                          </Typography>
                                                          <Button
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => {
                                                              setOpenAddProductModal(
                                                                true
                                                              );
                                                              setProductType(
                                                                item.type
                                                              );
                                                            }}
                                                          >
                                                            Add
                                                          </Button>
                                                        </Box>
                                                      }
                                                    />
                                                  </TableCell>
                                                  <TableCell align="center">
                                                    <TextField
                                                      value={
                                                        newSpareInputs[index]
                                                          ?.qty || ""
                                                      }
                                                      onChange={(e) =>
                                                        setNewSpareInputs({
                                                          ...newSpareInputs,
                                                          [index]: {
                                                            ...(newSpareInputs[
                                                              index
                                                            ] || {}),
                                                            qty: e.target.value,
                                                          },
                                                        })
                                                      }
                                                      label="Qty"
                                                      size="small"
                                                      type="number"
                                                      min="0"
                                                      sx={{ width: "60px" }}
                                                    />
                                                  </TableCell>
                                                  {Role != "Mechanic" && (
                                                    <TableCell align="center">
                                                      <TextField
                                                        value={
                                                          newSpareInputs[index]
                                                            ?.price || ""
                                                        }
                                                        onChange={(e) =>
                                                          setNewSpareInputs({
                                                            ...newSpareInputs,
                                                            [index]: {
                                                              ...(newSpareInputs[
                                                                index
                                                              ] || {}),
                                                              price:
                                                                e.target.value,
                                                            },
                                                          })
                                                        }
                                                        label="Price"
                                                        size="small"
                                                        type="number"
                                                        sx={{ width: "80px" }}
                                                      />
                                                    </TableCell>
                                                  )}
                                                  <TableCell align="center">
                                                    <Button
                                                      size="small"
                                                      variant="contained"
                                                      color="success"
                                                      onClick={() => {
                                                        const currentInput =
                                                          newSpareInputs[
                                                            index
                                                          ] || {};

                                                        // Validate that spare part name is not empty
                                                        if (
                                                          !currentInput.spareList ||
                                                          currentInput.spareList.trim() ===
                                                            ""
                                                        ) {
                                                          setSnackbarMessage(
                                                            "Please select a spare part name"
                                                          );
                                                          setOpenSnackbar(true);
                                                          return;
                                                        }

                                                        // Check if this spare already exists in the list (by item name only, prevent duplicates in same service)
                                                        const spareExists =
                                                          estimateItems[
                                                            index
                                                          ].spares.some(
                                                            (spare) =>
                                                              spare.spareList ===
                                                                currentInput.spareList
                                                          );

                                                        if (spareExists) {
                                                          setSnackbarMessage(
                                                            "This spare part already exists in this service. Duplicates are not allowed."
                                                          );
                                                          setOpenSnackbar(true);
                                                          return;
                                                        }

                                                        // Add spare with all values at once
                                                        setEstimateItems(
                                                          (prevItems) => {
                                                            const updatedItems =
                                                              [...prevItems];
                                                            updatedItems[
                                                              index
                                                            ].spares.push({
                                                              spareList:
                                                                currentInput.spareList ||
                                                                "",
                                                              qty:
                                                                parseFloat(
                                                                  currentInput.qty
                                                                ) || 0,
                                                              price:
                                                                parseFloat(
                                                                  currentInput.price
                                                                ) || 0,
                                                              new: "X",
                                                            });
                                                            calculateEstimatedAmount(
                                                              index,
                                                              updatedItems
                                                            );
                                                            return updatedItems;
                                                          }
                                                        );

                                                        // Reset input fields
                                                        setNewSpareInputs({
                                                          ...newSpareInputs,
                                                          [index]: {
                                                            spareList: "",
                                                            qty: "",
                                                            price: "",
                                                          },
                                                        });
                                                      }}
                                                      startIcon={<AddIcon />}
                                                    >
                                                      Add
                                                    </Button>
                                                  </TableCell>
                                                </TableRow>
                                                {item.spares
                                                  .filter(
                                                    (spare) =>
                                                      spare.spareList &&
                                                      spare.spareList.trim() !==
                                                        ""
                                                  )
                                                  .map(
                                                    (
                                                      spare,
                                                      filteredSpareIndex
                                                    ) => {
                                                      // Get the actual index in the unfiltered array
                                                      const actualSpareIndex =
                                                        item.spares.indexOf(
                                                          spare
                                                        );
                                                      // Check if this is the first item in the unfiltered array and matches the spare being edited
                                                      const isEditing =
                                                        editingSpare.itemIndex ===
                                                          index &&
                                                        item.spares[0] ===
                                                          spare &&
                                                        editingSpare.spareIndex !==
                                                          null;
                                                      return (
                                                        <TableRow
                                                          key={`${index}-${actualSpareIndex}-${spare.spareList}`}
                                                          sx={{
                                                            backgroundColor:
                                                              isEditing
                                                                ? "#fffacd"
                                                                : "inherit",
                                                          }}
                                                        >
                                                          <TableCell
                                                            sx={{
                                                              fontSize:
                                                                "0.85rem",
                                                            }}
                                                          >
                                                            {isEditing ? (
                                                              <Autocomplete
                                                                size="small"
                                                                disablePortal
                                                                options={inventory.map(
                                                                  (option) =>
                                                                    option.part_name
                                                                )}
                                                                value={
                                                                  editedSpareData.spareList ||
                                                                  ""
                                                                }
                                                                onChange={(
                                                                  e,
                                                                  newValue
                                                                ) => {
                                                                  setEditedSpareData(
                                                                    {
                                                                      ...editedSpareData,
                                                                      spareList:
                                                                        newValue ||
                                                                        "",
                                                                    }
                                                                  );
                                                                  if (
                                                                    newValue
                                                                  ) {
                                                                    const selectedItem =
                                                                      inventory.find(
                                                                        (
                                                                          item
                                                                        ) =>
                                                                          item.part_name ===
                                                                          newValue
                                                                      );
                                                                    if (
                                                                      selectedItem
                                                                    ) {
                                                                      setEditedSpareData(
                                                                        (
                                                                          prev
                                                                        ) => ({
                                                                          ...prev,
                                                                          price:
                                                                            selectedItem.price ||
                                                                            0,
                                                                        })
                                                                      );
                                                                    }
                                                                  }
                                                                }}
                                                                filterOptions={(options, state) => {
                                                                  const inputValue =
                                                                    state.inputValue.toLowerCase();
                                                                  return options.filter(
                                                                    (option) =>
                                                                      option
                                                                        .toLowerCase()
                                                                        .includes(inputValue)
                                                                  );
                                                                }}
                                                                renderInput={(
                                                                  params
                                                                ) => (
                                                                  <TextField
                                                                    {...params}
                                                                    label="Part Name"
                                                                    size="small"
                                                                  />
                                                                )}
                                                              />
                                                            ) : (
                                                              spare.spareList
                                                            )}
                                                          </TableCell>
                                                          <TableCell
                                                            align="center"
                                                            sx={{
                                                              fontSize:
                                                                "0.85rem",
                                                            }}
                                                          >
                                                            {isEditing ? (
                                                              <TextField
                                                                value={
                                                                  editedSpareData.qty ||
                                                                  ""
                                                                }
                                                                onChange={(e) =>
                                                                  setEditedSpareData(
                                                                    {
                                                                      ...editedSpareData,
                                                                      qty: e
                                                                        .target
                                                                        .value,
                                                                    }
                                                                  )
                                                                }
                                                                type="number"
                                                                size="small"
                                                                sx={{
                                                                  width: "60px",
                                                                }}
                                                              />
                                                            ) : (
                                                              spare.qty
                                                            )}
                                                          </TableCell>
                                                          {Role !=
                                                            "Mechanic" && (
                                                            <TableCell
                                                              align="center"
                                                              sx={{
                                                                fontSize:
                                                                  "0.85rem",
                                                              }}
                                                            >
                                                              {isEditing ? (
                                                                <TextField
                                                                  value={
                                                                    editedSpareData.price ||
                                                                    ""
                                                                  }
                                                                  onChange={(
                                                                    e
                                                                  ) =>
                                                                    setEditedSpareData(
                                                                      {
                                                                        ...editedSpareData,
                                                                        price:
                                                                          e
                                                                            .target
                                                                            .value,
                                                                      }
                                                                    )
                                                                  }
                                                                  type="number"
                                                                  size="small"
                                                                  sx={{
                                                                    width:
                                                                      "80px",
                                                                  }}
                                                                />
                                                              ) : (
                                                                spare.price
                                                              )}
                                                            </TableCell>
                                                          )}
                                                          <TableCell align="center">
                                                            {isEditing ? (
                                                              <Box
                                                                sx={{
                                                                  display:
                                                                    "flex",
                                                                  gap: 0.5,
                                                                }}
                                                              >
                                                                <Tooltip title="Save">
                                                                  <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                      handleSaveSpareEdit()
                                                                    }
                                                                    sx={{
                                                                      color:
                                                                        "green",
                                                                    }}
                                                                  >
                                                                    <SaveIcon fontSize="small" />
                                                                  </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cancel">
                                                                  <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                      handleCancelSpareEdit()
                                                                    }
                                                                    sx={{
                                                                      color:
                                                                        "orange",
                                                                    }}
                                                                  >
                                                                    <CloseIcon fontSize="small" />
                                                                  </IconButton>
                                                                </Tooltip>
                                                              </Box>
                                                            ) : (
                                                              <Box
                                                                sx={{
                                                                  display:
                                                                    "flex",
                                                                  gap: 0.5,
                                                                }}
                                                              >
                                                                <Tooltip title="Edit Spare">
                                                                  <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                      const actualSpareIndex =
                                                                        item.spares.indexOf(
                                                                          spare
                                                                        );
                                                                      handleEditSpare(
                                                                        index,
                                                                        actualSpareIndex
                                                                      );
                                                                    }}
                                                                    sx={{
                                                                      color:
                                                                        "blue",
                                                                    }}
                                                                  >
                                                                    <EditIcon fontSize="small" />
                                                                  </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete Spare">
                                                                  <IconButton
                                                                    size="small"
                                                                    onClick={() => {
                                                                      const actualSpareIndex =
                                                                        item.spares.indexOf(
                                                                          spare
                                                                        );
                                                                      deleteSpareByServiceId(
                                                                        spare.service_id,
                                                                        index,
                                                                        actualSpareIndex
                                                                      );
                                                                    }}
                                                                    sx={{
                                                                      color:
                                                                        "red",
                                                                    }}
                                                                  >
                                                                    <DeleteIcon fontSize="small" />
                                                                  </IconButton>
                                                                </Tooltip>
                                                              </Box>
                                                            )}
                                                          </TableCell>
                                                        </TableRow>
                                                      );
                                                    }
                                                  )}
                                              </TableBody>
                                            </Table>
                                          </TableContainer>
                                        )}
                                      </Box>
                                    </Box>

                                    {/* Add Spare Button */}

                                    {/* Actions */}
                                    <Box
                                      display="flex"
                                      justifyContent="flex-end"
                                      gap={1}
                                    >
                                      {index === estimateItems.length - 1 && (
                                        <IconButton
                                          onClick={() => addEstimateItem()}
                                          sx={{ color: "green" }}
                                        >
                                          {/* <AddIcon /> */}
                                        </IconButton>
                                      )}
                                    </Box>
                                  </Box>
                                </CardContent>
                              </Card>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Paper>

              {Role != "Mechanic" && (
                <Paper
                  elevation={3}
                  sx={{ padding: 3, borderRadius: 2, marginBottom: 3 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ marginBottom: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Total Spares:</strong> {totalSpares}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Grand Total:</strong> {grandTotal.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body1">
                        <strong>Overall Total:</strong>{" "}
                        {overallTotal.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Box>
          )}
          <Modal
            open={openAddProductModal}
            onClose={() => setOpenAddProductModal(false)}
          >
            <AddProduct
              token={token}
              category={productType}
              onProductAdded={fetchInventory}
              setOpenAddProductModal={setOpenAddProductModal}
              typedname={typedname}
            />
          </Modal>

          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              right: 120,
              display: "flex",
              gap: 2,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <Box
              display="flex"
              justifyContent="flex-end"
              // marginTop={0}
              // marginBottom={1}
            >
             {!(
  Array.isArray(appointmentDataLog?.services_actual) &&
  appointmentDataLog?.services_actual.length > 0 &&
  appointmentDataLog?.services_actual.some(service => service?.service_id)
) && (
  <Button
    variant="contained"
    color="warning"
    disabled={isSaving}
    onClick={() => {
      if (km === 0) {
        setSnackbarMessage("KM should be greater than 0");
        setOpenSnackbar(true);
        return;
      } else {
        validateAndPostService(
          "services_actual",
          appointmentDataLog,
          "save"
        );
      }
    }}
    sx={{
      marginRight: 2,
      height: "50px",
      minwidth: "50px",
     marginTop: "5px"
    }}
  >
    <SaveIcon />
  </Button>
)}

              <Button
                disabled={isSaving} // Disable button while saving
                variant="contained"
                color="success"
                onClick={() => {
                  // check if km is greater than 0
                  if (km > 0) {
                    validateAndPostService(
                      "services_actual",
                      appointmentDataLog
                    );
                    setUpdateButtonclicked(false);
                    // disable the button
                    setUpdateButtonclicked(true);
                  } else {
                    setSnackbarMessage("KM should be greater than 0");
                    setOpenSnackbar(true);
                  }
                }}
                sx={{
                  marginRight: 2,
                  height: "50px",
                  minwidth: "50px",
                   marginTop: "5px",
                }}
              >
                <SaveIcon />
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              position: "fixed",
              bottom: 20,
              right: 70,
              display: "flex",
              gap: 2,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            {" "}
            {Role != "Mechanic" && (
              <>
                <Button
                  disabled={isSaving}
                  variant="contained"
                  size="small"
                  // onClick={handlePrintMenuOpen}
                   onClick={handleDownloadPDF}
                  sx={{
                    height: "50px",
                    minWidth: "50px",
                    marginRight: 1,
                    backgroundColor: isSaving ? "#ccc" : "green",
                    color: isSaving ? "#999" : "white",
                    "&:hover": {
                      backgroundColor: isSaving ? "#ccc" : "blue",
                    },
                    boxShadow: 3,
                    padding: "8px 12px",
                  }}
                  title="Print Options"
                >
                  <PrintIcon />
                </Button>
                {/* <Menu
                  anchorEl={printMenuAnchor}
                  open={Boolean(printMenuAnchor)}
                  onClose={handlePrintMenuClose}
                >
                  <MenuItem onClick={handleDownloadPDF}>Download PDF</MenuItem>
                  <MenuItem onClick={handleViewPDFInNewTab}>Print Preview</MenuItem>
                </Menu> */}
              </>
            )}
          </Box>

          {/* Chat Box */}
          <LiveChat room={appointmentId} />

          {/* Add the Dialog component */}
          <Dialog
            open={openConfirmationModal}
            onClose={() => setOpenConfirmationModal(false)}
            sx={{
              "& .MuiDialog-paper": {
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                padding: "16px",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Confirm Deletion
            </DialogTitle>

            <DialogContent
              sx={{
                padding: "16px 24px",
                fontSize: "1rem",
                color: "#555",
                lineHeight: "1.5",
              }}
            >
              <Typography>
                Are you sure you want to{" "}
                <span style={{ fontWeight: "bold" }}>delete this item</span>
                {/* {selectedRow !== null ? ` with ID: ${estimateItems[selectedRow].service_id}` : ""}? */}
                {/* <br></br> */}
                {/* This action cannot be undone. */}
              </Typography>
            </DialogContent>

            <DialogActions
              sx={{
                padding: "8px 16px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <Button
                onClick={() => setOpenConfirmationModal(false)}
                color="primary"
                variant="outlined"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                color="error"
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontWeight: "bold",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.875rem",
                }}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>

      <AppAlert alertData={jobCardAlertData} />
    </div>
  );
};

export default CustomerDetail;

// last update 07-03-2025 11:56 AM
