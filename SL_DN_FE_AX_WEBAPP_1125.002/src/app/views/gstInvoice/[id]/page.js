"use client";
// React and Next imports
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import DeleteIcon from "@mui/icons-material/Delete";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
// import generatePDF from "../../../../components/PDFGenerator_invoice.js"; // Adjust the path as necessary
import generatePDF from "@/components/PDFGenerator_invoice.js";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

// Function imports
import {
  fetchDetails,
  scrollToTopButtonDisplay,
  handleScrollToTop,
  calculateTotals,
  cancelInvoice,
  // generatePDF,
} from "../../../../../controllers/invoiceListIDControllers.js";

import AddProduct from "@/components/addProduct.js";

// Component imports
import Navbar from "@/components/navbar";
import BackButton from "@/components/backButton";
// UI package imports
import {
  Avatar,
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
  Snackbar,
  Alert,
  IconButton,
  Fab,
  Paper,
  Divider,
  Switch,
  InputAdornment,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
// ! whatsapp things
import {
  sendWhatsappMessage,
  checkWhatsappLoggedIn,
} from "../../../../components/whatsapp.js";
import axios from "axios";
// Images and icon imports
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
//! Do Not Delete  import DeleteIcon from "@mui/icons-material/Delete";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import EditIcon from "@mui/icons-material/Edit";
import { Document, Page, View, Text, Image, pdf } from "@react-pdf/renderer";
import { calculateTotals as gstCalculation } from "@/components/gstcalculation";
import ConformationDialogue from "@/components/conformationDialogue.js";
import { formatDateInTimezone, getActiveTimezone } from "@/utils/timezoneUtil";
import { set } from "date-fns";

export default function InvoiceDetails() {
  const params = useParams();
  const lastInputRef = useRef(null);

  // FrontEnd extracted data states
  const appointmentId = params.id;
  const [token, setToken] = useState();

  useEffect(() => {
    const token = Cookies.get("token");
    setToken(token);
  }, []);

  const [appTimezone, setAppTimezone] = useState(null);
  useEffect(() => {
    getActiveTimezone().then(setAppTimezone);
  }, []);

  // Backend Data states
  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [km, setKm] = useState(0);
  const [appointment, setAppointment] = useState();
  const [estimateItems, setEstimateItems] = useState([]);
  const [companyName, setCompanyName] = useState("");
  const [upi, setupi] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [gstInvoiceId, setGstInvoiceId] = useState("");
  const [companyDetails, setCompanyDetails] = useState([]);
const [invoiceDate, setInvoiceDate] = useState([]);


  const [customerName, setCustomerName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Modal and Alert states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [PdfHeaderImage, setPdfHeaderImage] = useState("");
  const [pdfFooterImage, setPdfFooterImage] = useState("");
  const [openConformationModal, setOpenConformationModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [pdfLogo, setPdfLogo] = useState("");
  const [typedname, setTypedname] = useState("");
  const [openAddProductModal, setOpenAddProductModal] = useState(false);

  // FrontEnd form input states
  const [messages, setMessages] = useState([
    { sender: "Mechanic", text: "The vehicle inspection is complete." },
    { sender: "Garage Owner", text: "Great! Any issues found?" },
    {
      sender: "Mechanic",
      text: "Yes, there are a few issues with the brakes.",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Inside the InvoiceDetails component, initialize separate states
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  // New state for TextField input
  const [advanceInput, setAdvanceInput] = useState(
    customer ? customer.advance_payment : 0
  );
  const [editAdvanceInput, setEditAdvanceInput] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState(0);

  const [services, setServices] = useState([]);
const [nextServiceKm, setNextServiceKm] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };
  function getDateComponents(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  const router = useRouter();

  const sendtomainpage = () => {
    // navigate to main page
    router.push("/views/");
  };
  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, { sender: "Garage Owner", text: newMessage }]);
      setNewMessage("");
    }
  };
  // !? replace placeholders in the template message if any
  const replacePlaceholders = (template, dynamicValues) => {
    return template.replace(
      /{{([^}]+)}}/g,
      (match, p1) => dynamicValues[p1] || match
    );
  };
  // delete a service by service_id
  const deleteService = async (serviceId, index) => {
    // If there's no serviceId, just remove the item from the list
    if (!serviceId) {
      setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
      return;
    }

    // Otherwise proceed with API call to delete the service
    const token = Cookies.get("token");
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
      if (!response.ok) throw new Error(`Failed to delete service`);

      // Remove item from state after successful deletion
      setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
      setSnackbarMessage(`Successfully deleted service`);
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error deleting service:", error);
      setSnackbarMessage(error.message);
      setOpenSnackbar(true);
    }
  };

  const fetchSoftware = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setCompanyDetails(data.company_details);
    } catch (error) {
      console.log("Error fetching services:", error);
    }
  };

  useEffect(() => {
    let storedToken = Cookies.get("token");

    if (!appointmentId) {
      console.log("Appointment ID is not available");
      setLoading(false);
      return;
    }

    fetchSoftware();

    fetchDetails(
      storedToken,
      appointmentId,
      setSnackbarMessage,
      setOpenSnackbar,
      setSnackbarSeverity,
      setKm,
      setNextServiceKm,
      setAppointment,
      setCustomer,
      setVehicleId,
      setInventory,
      setEstimateItems,
      setLoading,
      setPaymentMode,
       setInvoiceDate,
      setInvoiceId,
      setGstInvoiceId,
    );
  }, [appointmentId]);
console.log("customer", customer);
  useEffect(() => {
    if (customer) {
      setCustomerName(customer.customer_name || "");
      setGstNumber(customer.contact?.gst_number || "");
      setAdvanceInput(customer.advance_payment);
      setAdvanceAmount(customer.advance_payment);
    }
  }, [customer]);
  useEffect(() => {
    const fetchInvoiceId = async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/appointments_to_invoice/${appointmentId}`
      );
      setInvoiceId(response.data.invoice_id);
      setGstInvoiceId(response.data.gst_invoice_id);
      console.log("invoice_id123", response.data.invoice_id);
    };
    fetchInvoiceId();
    console.log("invoiceId", invoiceId);
  }, []);

  // Set the pdfHeaderImage and pdfFooterImage when companyDetails change
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the data from the API
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/ss/`
        );

        // Check if company details are available in the response data
        const companyDetails = response?.data?.company_details?.[0];
        // Set the header and footer images
        // const pdfHeader = ;
        // const pdfFooter = ;

        // Assuming you're using React, you can set the state as follows:
        setPdfHeaderImage(companyDetails?.pdf_header || "");
        setPdfFooterImage(companyDetails?.pdf_footer || "");
        setPdfLogo(companyDetails?.logo || "");
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to fetch only on mount

  const handleAdvanceInputChange = (value) => {
    if (value > grandTotal) {
      setAdvanceInput(grandTotal);
    } else {
      setAdvanceInput(value);
    }

    if (isSwitchOn) {
      setAdvanceAmount(parseFloat(value) || 0);
    }
  };

  const handleChange = (field, value) => {
    if (field === "gst") {
      setGstNumber(value);
      setHasChanges(true);
    }
  };


  const validateGSTNumber = (gst) => {
    // GST number format validation (India): 15 alphanumeric characters
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
  };


  useEffect(() => {
    if (editMode) {
      setGstNumber(customer.contact?.gst_number || "");
    }
  }, [editMode, customer]);

  const handleSaveEdit = async () => {
    try {
      // Validate GST number if provided
      if (gstNumber && !validateGSTNumber(gstNumber)) {
        setSnackbarMessage("Invalid GST number format. Please enter a valid GST number ");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      const token = Cookies.get("token");
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/customer/name/${customer.customer_id}`,
        {
          customer_name: customerName,
          gst_number: gstNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        setEditMode(false);
        setHasChanges(false);
        setSnackbarMessage("Customer details updated successfully");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        // Update the customer state with new values
        setCustomer({
          ...customer,
          customer_name: customerName,
          contact: {
            ...customer.contact,
            gst_number: gstNumber,
          },
        });
      }
    } catch (error) {
      console.error("Error updating customer details:", error);
      setSnackbarMessage("Failed to update customer details");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const { grandTotal, totalDiscount, totalTax, overallTotal } =
    gstCalculation(estimateItems);

  const addEstimateItem = () => {
    const newItem = {
      service_id: "", // Explicitly set service_id for new items
      type: "",
      spareList: "",
      reportedIssue: "service", // Set default reportedIssue to "service"
      qty: 1,
      price: 0,
      discount: 0,
      discountType: "percentage",
      estimatedAmount: 0,
      tax: 0,
      exclude: false,
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

  const removeEstimateItem = (index) => {
    setEstimateItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  const updateEstimateItem = (index, field, value) => {
    setEstimateItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]:
          field === "discount" &&
            updatedItems[index].discountType === "percentage"
            ? Math.min(Math.max(value, 0), 100)
            : value,
      };
      if (["qty", "price", "discount", "discountType", "tax"].includes(field)) {
        calculateEstimatedAmount(index, updatedItems);
      }
      return updatedItems;
    });
  };

  const handleGeneratePDF = async (invoiceId, openInNewTab = false) => {
    try {
      const formattedDate = invoiceDate
        ? invoiceDate.split("-").reverse().join("/")
        : new Date().toLocaleDateString("en-GB");

      const pdfBlob = await generatePDF({
        customer,
        estimateItems,
        appointmentId,
        vehicleId,
        km,
        grandTotal,
        totalTax,
        PdfHeaderImage,
        pdfFooterImage,
        pdfLogo,
        invoiceId,
        companyDetails,
        upi,
        invoiceDate: formattedDate,
        openInNewTab,
      });

      console.log("PDF Blob generated:", pdfBlob);
      return pdfBlob;
    } catch (error) {
      console.error("Error generating PDF:", error);
      setSnackbarMessage("Failed to generate PDF");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return null;
    }
  };

  const calculateEstimatedAmount = (index, items) => {
    const item = items[index];
    const discountValue =
      item.discountType === "percentage"
        ? item.price * (item.discount / 100)
        : item.discount;
    if (discountValue > item.price) {
      setSnackbarMessage("Discount exceeds price");
      setOpenSnackbar(true);
      items[index].estimatedAmount = 0;
    } else {
      const taxValue = item.qty * item.price * (item.tax / 100);
      const estimatedAmount = Math.max(
        0,
        item.qty * (item.price - discountValue + taxValue)
      );
      items[index].estimatedAmount = estimatedAmount;
    }
  };

  useEffect(() => {
    console.log({ hasChanges });
  }, [hasChanges]);

  const handleSpareListChange = (index, value) => {
    const selectedItem = inventory.find((item) => item.part_name === value);
    if (selectedItem) {
      updateEstimateItem(index, "spareList", value);
      updateEstimateItem(index, "price", selectedItem.price);
      updateEstimateItem(index, "qty", 1);
      // Prefill tax if inventory item has gst value
      if (selectedItem.gst !== undefined && selectedItem.gst !== null && selectedItem.gst !== "") {
        const parsed = Number(selectedItem.gst);
        if (!isNaN(parsed)) {
          updateEstimateItem(index, "tax", parsed);
          updateEstimateItem(index, "gst", parsed);
        }
      } else {
        // clear tax if inventory item has no gst
        updateEstimateItem(index, "tax", 0);
        updateEstimateItem(index, "gst", "");
      }
    } else {
      updateEstimateItem(index, "spareList", value);
      updateEstimateItem(index, "price", 0);
      updateEstimateItem(index, "qty", 0);
    }
  };

  // old

  // const getFilteredInventory = (type) => {
  //   console.log("Filtering inventory for type:", type);
  //   return inventory.filter(
  //     (item) => item.category.toLowerCase() === type.toLowerCase()
  //   );
  // };
  // console.log(getFilteredInventory)

  const getFilteredInventory = (type) => {
    // console.log("Filtering inventory for type:", type);
    // console.log("Current inventory:", inventory); // Check if inventory has data

    if (!inventory || inventory.length === 0) {
      // console.log("Inventory is empty or undefined");
      return [];
    }
    // console.log("Filtered Inventory:", filteredItems);
    return inventory;
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

  // Sync tax/gst from inventory to existing estimate items when inventory or items change
  useEffect(() => {
    if (!inventory || inventory.length === 0) return;
    if (!estimateItems || estimateItems.length === 0) return;

    let changed = false;
    const updated = estimateItems.map((item) => {
      // skip if explicitly excluded
      if (item?.exclude) return item;

      // only try to map when spareList is present
      const key = item.spareList || item.part_name || item.item_name || "";
      if (!key) return item;

      const inv = inventory.find(
        (it) =>
          it.part_name === key ||
          it.inventory_id === item.inventory_id ||
          it.part_number === key
      );

      if (inv && inv.gst !== undefined && inv.gst !== null && inv.gst !== "") {
        const parsed = Number(inv.gst);
        if (!isNaN(parsed) && Number(item.tax) !== parsed) {
          changed = true;
          return {
            ...item,
            tax: parsed,
            gst: parsed,
          };
        }
      }

      return item;
    });

    if (changed) setEstimateItems(updated);
  }, [inventory, estimateItems]);

  const handleKeyPress = (event, index, estimateItems, addEstimateItem) => {
    if (event.key === "Enter" && index === estimateItems.length - 1) {
      event.preventDefault();
      addEstimateItem();
    }
  };

  const UpdateCust = async () => {
    const token = Cookies.get("token");
    const data = {
      appointmentId: appointmentId,
      paid_status: "Not Paid",
     Invoice_Date: invoiceDate,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_invoice/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) throw new Error("Failed to update appointment details");

      // console.log("Successfully updated appointment details");
      setSnackbarMessage("Successfully updated appointment details");
      setOpenSnackbar(true);
    } catch (err) {
      // console.log("Error updating appointment details:", err);
      setSnackbarMessage("Error updating appointment details");
      setOpenSnackbar(true);
    }
  };

  // const generatePDF = async (invoiceId) => {
  //   const taxDetails = {
  //     value: grandTotal,
  //     cgst: totalTax / 2,
  //     sgst: totalTax / 2,
  //     totalTax: totalTax,
  //   };

  //   const amountInWords = (amount) => {
  //     const wholeNumber = Math.round(amount);
  //     const toWords = require("number-to-words");
  //     return (
  //       toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
  //       toWords.toWords(wholeNumber).slice(1)
  //     );
  //   };

  //   let upiDetails = {
  //     pa: upi,
  //     pn: companyName,
  //     tn: "ARG's 7 Cars" + " - " + appointmentId,
  //     am: grandTotal?.toFixed(2),
  //     cu: "INR",
  //   };
  //   let upiLink = `upi://pay?pa=${encodeURIComponent(
  //     upiDetails.pa
  //   )}&pn=${encodeURIComponent(upiDetails.pn)}&tn=${encodeURIComponent(
  //     upiDetails.tn
  //   )}&am=${encodeURIComponent(upiDetails.am)}&cu=${encodeURIComponent(
  //     upiDetails.cu
  //   )}`;

  //   const qrCodeDataUrl = await QRCode.toDataURL(upiLink);

  //   const MyDocument = () => {
  //     const itemsPerPage = 20;
  //     const totalPages = Math.ceil(estimateItems.length / itemsPerPage);

  //     return (
  //       <Document>
  //         {Array.from({ length: totalPages }).map((_, pageIndex) => (
  //           <Page
  //             key={pageIndex}
  //             size="A4"
  //             style={{
  //               padding: 20,
  //               fontSize: 10,
  //               fontFamily: "Times-Roman",
  //               display: "flex",
  //               flexDirection: "column",
  //               justifyContent: "space-between",
  //               minHeight: "100vh",
  //             }}
  //           >
  //             {/* Watermark */}
  //             <Image
  //               src="/icons/Arg_s7Cars Logo.png"
  //               style={{
  //                 height: 300,
  //                 width: 450,
  //                 position: "absolute",
  //                 top: "30%",
  //                 left: "10%",
  //                 opacity: 0.1,
  //                 zIndex: 0,
  //                 pointerEvents: "none",
  //               }}
  //             />

  //             {/* Header Section */}
  //             <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
  //               <View
  //                 style={{
  //                   flexDirection: "row",
  //                   justifyContent: "space-between",
  //                   alignItems: "center",
  //                   paddingBottom: 10,
  //                   borderBottom: "2px solid #000",
  //                 }}
  //               >
  //                 <Image
  //                   src="/icons/pdf_head.png"
  //                   style={{ height: 75, width: 75 }}
  //                 />
  //                 <Image
  //                   src="/icons/Arg_s7Cars Logo.png"
  //                   style={{ height: 100, width: 150 }}
  //                 />
  //                 <View style={{ textAlign: "center", flexGrow: 1 }}>
  //                   <Image
  //                     src="/icons/ayyanar.png"
  //                     style={{ height: 30, width: 130, marginRight: 350 }}
  //                   />
  //                   <Text
  //                     style={{
  //                       fontSize: 20,
  //                       fontWeight: "bolder",
  //                       marginLeft: 80,
  //                       fontFamily: "Helvetica-Bold",
  //                     }}
  //                   >
  //                     ARG's 7 Cars
  //                   </Text>
  //                   <Text
  //                     style={{
  //                       fontWeight: "light",
  //                       fontStyle: "italic",
  //                       marginLeft: 80,
  //                     }}
  //                   >
  //                     Perfectus Immutatio
  //                   </Text>
  //                   <Text style={{ marginLeft: 80 }}>
  //                     No 366, Thiruthangal Road, Sivakasi - 626130
  //                   </Text>
  //                   <Text style={{ marginLeft: 80 }}>
  //                     Contact: 77080 03008, 72003 77707
  //                   </Text>
  //                   <Text style={{ marginLeft: 80 }}>
  //                     GSTIN: 33BGFPA9032E1ZY
  //                   </Text>
  //                 </View>
  //               </View>
  //             </View>

  //             <View>
  //               <Text
  //                 style={{
  //                   fontWeight: "bold",
  //                   fontSize: 16,
  //                   textAlign: "center",
  //                 }}
  //               >
  //                 Invoice
  //               </Text>
  //             </View>
  //             {/* Patron and Vehicle Details */}
  //             <View
  //               style={{
  //                 border: "1px solid #000",
  //                 padding: 10,
  //                 marginBottom: 10,
  //                 display: "flex",
  //                 flexDirection: "column",
  //                 justifyContent: "space-between",
  //               }}
  //             >
  //               <View
  //                 style={{
  //                   display: "flex",
  //                   flexDirection: "row",
  //                   justifyContent: "space-between",
  //                   width: "100%",
  //                   alignContent: "space-between",
  //                 }}
  //               >
  //                 <View style={{ width: "60%" }}>
  //                   <Text style={{ fontFamily: "Helvetica-Bold",}}>Patron: {customer.prefix} {customer.customer_name}</Text>
  //                   <Text style={{ marginLeft: 35 }}>
  //                      {customer.contact.address.street},{" "}
  //                     {customer.contact.address.city}
  //                   </Text>
  //                   <Text style={{ marginLeft: 35 , fontFamily: "Helvetica-Bold",}}>Phone: {customer.contact.phone}</Text>
  //                 </View>
  //               <View
  //                                                    style={{
  //                                                      flexDirection: "column",
  //                                                      // width: "20%",
  //                                                      // justifyContent: "space-between",
  //                                                    }}
  //                                                  >
  //                                                    <View
  //                                                      style={{
  //                                                        flexDirection: "row",
  //                                                      }}
  //                                                    >
  //                                                  <b>  <Text style={{ fontWeight: "bold" }}>Invoice No :</Text>
  //                                                  </b>
  //                                                      <Text style={{ textAlign: "left", fontFamily: "Helvetica-Bold", }}>{invoiceId}</Text>
  //                                                    </View>
  //                                                    <View
  //                                                      style={{
  //                                                        flexDirection: "row",
  //                                                      }}
  //                                                    >
  //                                                      <Text>Invoice Date :</Text>
  //                                                      <Text style={{ textAlign: "left", fontFamily: "Helvetica-Bold", }}>
  //                                                      {new Date().toLocaleDateString()}
  //                                                      </Text>
  //                                                    </View>
  //                                                    <View
  //                                                      style={{
  //                                                        flexDirection: "row",
  //                                                      }}
  //                                                    >
  //                                                      <Text>Vehicle No :</Text>
  //                                                      <Text style={{ textAlign: "left" , fontFamily: "Helvetica-Bold",}}>{vehicleId}</Text>
  //                                                    </View>
  //                                                    <View
  //                                                      style={{
  //                                                        flexDirection: "row",
  //                                                      }}
  //                                                    >
  //                                                      <Text>Vehicle Kms:</Text>
  //                                                      <Text style={{ textAlign: "left", fontFamily: "Helvetica-Bold", }}>{km}</Text>
  //                                                    </View>
  //                                                    {/* <View style={{ flexDirection: "row" }}> */}
  //                                                    <View>
  //                <Text style={{ fontWeight: "bold",marginTop:2 }}>Next Service:</Text>
  //                <Text style={{ fontFamily: "Helvetica-Bold",}}>{km ? km + 10000 : "N/A"} KM /, {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString("en-GB")}</Text>
  {
    /* Patron and Vehicle Details */
  }
  // <View
  //   style={{
  //     border: "1px solid #000",
  //     padding: 10,
  //     marginBottom: 10,
  //     display: "flex",
  //     flexDirection: "row",  // Arrange in three columns
  //     justifyContent: "space-between",
  //   }}
  // >
  //   {/* First Column - Customer Details */}
  //   <View style={{ width: "33%" }}>
  //     <Text style={{ fontFamily: "Helvetica-Bold" }}>
  //       {/* Patron:{customer.prefix} {customer.customer_name} */}
  //       {/* {customer.customer_name} */}
  //     </Text>
  //     <Text style={{ left: "35" }}>{customer.contact.address.street}, {customer.contact.address.city}</Text>
  //     <Text style={{ fontFamily: "Helvetica-Bold", left: "35" }}>
  //       {customer.contact.phone}
  //     </Text>
  //   </View>

  //   {/* Second Column - Invoice Details */}
  //   <View style={{ width: "33%" }}>
  //     <View style={{ flexDirection: "row" }}>
  //       <Text style={{ fontWeight: "bold" }}>Invoice No: </Text>
  //       <Text style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}>{invoiceId}</Text>
  //     </View>
  //     <View style={{ flexDirection: "row" }}>
  //       <Text style={{ fontWeight: "bold" }}>Invoice Date: </Text>
  //       <Text style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}>
  //         {new Date().toLocaleDateString("en-GB")}
  //       </Text>
  //     </View>
  //     <View style={{ flexDirection: "row" }}>
  //       <Text style={{ fontWeight: "bold" }}>Vehicle No: </Text>
  //       <Text style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}>{vehicleId}</Text>
  //     </View>
  //     <View style={{ flexDirection: "row" }}>
  //       <Text style={{ fontWeight: "bold" }}>Vehicle Kms: </Text>
  //       <Text style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}>{km}</Text>
  //     </View>
  //   </View>

  //   {/* Third Column - Next Service */}
  //   <View style={{ width: "33%" }}>
  //     <Text style={{ fontWeight: "bold" }}>Next Service:</Text>
  //     <Text style={{ fontFamily: "Helvetica-Bold" }}>
  //       {km ? km + 10000 : "N/A"} KM / {new Date(new Date().setMonth(new Date().getMonth() + 6)).toLocaleDateString("en-GB")}
  //     </Text>
  //   </View>
  // </View>

  {
    /* GST Information if available */
  }
  // {
  //   customer.gst_number && (
  //     <View style={{ padding: 1, width: "30%", marginTop: 5 }}>
  //       <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
  //     </View>
  //   )
  // }

  //              </View>

  //              {/* </View> */}

  //                                                  </View>
  //               </View>
  //               {customer.gst_number && (
  //                 <View
  //                   style={{
  //                     padding: 1,
  //                     width: "30%",
  //                     marginBottom: 1,
  //                     display: "flex",
  //                     flexDirection: "column",
  //                     justifyContent: "space-between",
  //                   }}
  //                 >
  //                   <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
  //                 </View>
  //               )}
  //             </View>

  //             {/* Items Table */}
  //             <View
  //               style={{ border: "1px solid #000", marginBottom: 10, flex: 1 }}
  //             >
  //               <View
  //                 style={{
  //                   flexDirection: "row",
  //                   borderBottom: "1px solid #000",
  //                   backgroundColor: "#f0f0f0",
  //                   padding: 5,
  //                 }}
  //               >
  //                 <Text style={{ width: "10%", textAlign: "left" }}>
  //                   S.No
  //                 </Text>
  //                 <Text style={{ width: "40%", textAlign: "left" }}>
  //                   Particulars
  //                 </Text>
  //                 <Text style={{ width: "10%", textAlign: "center" }}>Qty</Text>
  //                 <Text style={{ width: "10%", textAlign: "right" }}>
  //                   Rate
  //                 </Text>
  //                 {/* {customer.gst_number ? ( */}
  //                   <Text style={{ width: "10%", textAlign: "right" }}>
  //                     GST%
  //                   </Text>
  //                 {/* ) : null} */}
  //                 <Text style={{ width: "20%", textAlign: "right" }}>
  //                   Amount
  //                 </Text>
  //               </View>

  //               {/* Render items for the current page */}
  //               {estimateItems
  //                 .slice(
  //                   pageIndex * itemsPerPage,
  //                   (pageIndex + 1) * itemsPerPage
  //                 )
  //                 .map((item, index) => (
  //                   <View
  //                     key={index}
  //                     style={{ flexDirection: "row", padding: 1 }}
  //                   >
  //                     <Text style={{ width: "10%", textAlign: "center" }}>
  //                       {index + 1 + pageIndex * itemsPerPage}
  //                     </Text>
  //                     <Text
  //                       style={{ width: "40%", textAlign: "left" }}
  //                     >{`${item.spareList} - ${item.reportedIssue}`}</Text>
  //                     <Text style={{ width: "10%", textAlign: "center" }}>
  //                       {item.qty}
  //                     </Text>
  //                     <Text style={{ width: "10%", textAlign: "right" }}>
  //                       {parseFloat(item.price).toFixed(2)}
  //                     </Text>
  //                     {/* {customer.gst_number ? ( */}
  //                       <Text style={{ width: "10%", textAlign: "right" }}>
  //                         {item.tax}%
  //                       </Text>
  //                     {/* ) : null} */}
  //                     <Text style={{ width: "20%", textAlign: "right" }}>
  //                       {parseFloat(item.qty * item.price).toFixed(2)}
  //                     </Text>
  //                   </View>
  //                 ))}
  //             </View>

  //             {/* Only add the footer on the last page */}
  //             {pageIndex === totalPages - 1 && (
  //               <>
  //                 {/* Total Section */}
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     borderTop: "1px solid #000",
  //                     padding: 2,
  //                   }}
  //                 >
  //                   <View style={{ width: "80%", fontWeight: "bold" }}>
  //                     <Text style={{ textAlign: "left", fontSize: 8 }}>
  //                       Amount in Words :{" "}
  //                     </Text>
  //                     <Text style={{ textAlign: "left", fontSize: 10 }}>
  //                       {"Rupees " + amountInWords(grandTotal) + " Only."}
  //                     </Text>
  //                   </View>
  //                   <Text
  //                     style={{
  //                       width: "80%",
  //                       textAlign: "right",
  //                       fontWeight: "bold",
  //                       fontSize: 12,
  //                     }}
  //                   >
  //                     Total :{" "}
  //                     {"Rs." +
  //                       (grandTotal - totalTax.toFixed(2)).toLocaleString(
  //                         undefined,
  //                         {
  //                           minimumFractionDigits: 2,
  //                           maximumFractionDigits: 2,
  //                         }
  //                       )}
  //                   </Text>
  //                 </View>

  //                 {/* New Totals Section */}
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     justifyContent: "flex-end",
  //                   }}
  //                 >
  //                   <Text
  //                     style={{
  //                       width: "80%",
  //                       textAlign: "right",
  //                       fontWeight: "bold",
  //                       fontSize: 12,
  //                     }}
  //                   >
  //                     GST Total: {"Rs." + totalTax.toFixed(2)}
  //                   </Text>
  //                 </View>
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     justifyContent: "flex-end",
  //                   }}
  //                 >
  //                   <Text
  //                     style={{
  //                       width: "80%",
  //                       textAlign: "right",
  //                       fontWeight: "bold",
  //                       fontSize: 12,
  //                     }}
  //                   >
  //                     Overall Total:{" "}
  //                     {"Rs." +
  //                       grandTotal.toLocaleString(undefined, {
  //                         minimumFractionDigits: 2,
  //                         maximumFractionDigits: 2,
  //                       })}
  //                   </Text>
  //                 </View>

  //                 {/* Footer Section */}
  //                 <View
  //                   style={{
  //                     borderTop: "1px solid #000",
  //                     paddingTop: 10,
  //                     backgroundColor: "#f0f0f0",
  //                     padding: 10,
  //                     marginTop: "auto",
  //                   }}
  //                 >
  //                   <View
  //                     style={{
  //                       flexDirection: "row",
  //                       justifyContent: "space-between",
  //                       marginBottom: 10,
  //                     }}
  //                   >
  //                     <View style={{ width: "50%" }}>
  //                       <Text
  //                         style={{
  //                           fontWeight: "bold",
  //                           marginBottom: 5,
  //                           fontStyle: "underline",
  //                         }}
  //                       >
  //                         Bank Details:
  //                       </Text>
  //                       <Text style={{ fontWeight: "bold" }}>
  //                         ARG's 7 Cars & Sree Jaya Finserve
  //                       </Text>
  //                       <Text>{companyDetails[0].bank_name}</Text>
  //                       <Text>Account No: {companyDetails[0].account_no}</Text>
  //                       <Text>IFSC Code: {companyDetails[0].ifsc_code}</Text>
  //                       <Text>GPay: {companyDetails[0].gpay_number}</Text>
  //                     </View>
  //                     {/* {customer.gst_number && (
  //                       <>
  //                         <View
  //                           style={{
  //                             width: "1px",
  //                             height: "100%",
  //                             backgroundColor: "#000",
  //                             marginLeft: 10,
  //                             marginRight: 10,
  //                           }}
  //                         ></View>
  //                         <View
  //                           style={{
  //                             width: "45%",
  //                             border: "1px solid #000",
  //                             padding: 5,
  //                           }}
  //                         >
  //                           <Text
  //                             style={{ fontWeight: "bold", marginBottom: 5 }}
  //                           >
  //                             Tax Details:
  //                           </Text>
  //                           <Text>Value: {taxDetails.value.toFixed(2)}</Text>
  //                           <Text>CGST: {taxDetails.cgst.toFixed(2)}</Text>
  //                           <Text>SGST: {taxDetails.sgst.toFixed(2)}</Text>
  //                           <Text>
  //                             Total Tax: {taxDetails.totalTax.toFixed(2)}
  //                           </Text>
  //                         </View>
  //                       </>
  //                     )} */}

  //                    <View
  //                                                      style={{
  //                                                        width: "1px",
  //                                                        height: "100%",
  //                                                        backgroundColor: "#000",
  //                                                        marginLeft: 10,
  //                                                        marginRight: 10,
  //                                                      }}
  //                                                    ></View>
  //                                                    <View
  //                                                      style={{
  //                                                        width: "45%",
  //                                                        border: "1px solid #000",
  //                                                        padding: 5,
  //                                                      }}
  //                                                    >
  //                                                      <Text
  //                                                        style={{ fontWeight: "bold", marginBottom: 5 }}
  //                                                      >
  //                                                        Tax Details:
  //                                                      </Text>
  //                                                      <Text>Value: {"Rs." +
  //                                                   (grandTotal - totalTax.toFixed(2)).toLocaleString(
  //                                                     undefined,
  //                                                     {
  //                                                       minimumFractionDigits: 2,
  //                                                       maximumFractionDigits: 2,
  //                                                     }
  //                                                   )}</Text>
  //                                                      <Text>CGST: {"Rs." + (totalTax / 2).toFixed(2)}</Text>
  //                                                      <Text>SGST: {"Rs." + (totalTax / 2).toFixed(2)}</Text>
  //                                                      <Text>
  //                                                        Total Tax:  {"Rs." +
  //                                                                     grandTotal.toLocaleString(undefined, {
  //                                                                       minimumFractionDigits: 2,
  //                                                                       maximumFractionDigits: 2,
  //                                                                     })}
  //                                                      </Text>
  //                                                    </View>

  //                       <View
  //                     style={{
  //                       flexDirection: "row",
  //                       justifyContent: "flex-end",
  //                       alignItems: "center",
  //                     }}
  //                   >
  //                     <Image
  //                       src={qrCodeDataUrl}
  //                       style={{ width: 70, height: 70 }}
  //                     />
  //                   </View>
  //                   </View>
  //                   <View
  //                     style={{
  //                       flexDirection: "row",
  //                       justifyContent: "space-between",
  //                       marginTop: 10,
  //                     }}
  //                   >
  //                     <View style={{ width: "60%", textAlign: "left" }}>
  //                       <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
  //                         Our Services:
  //                       </Text>
  //                       {/* <Text>
  //                         Multi Brand Car Service & Accessories, Bodyshop work
  //                         (Painting, Tinkering, Electrical & AC Repair)
  //                       </Text>
  //                       <Text style={{ marginBottom: 5 }}>
  //                         HDFC Bank & Kotak Mahindra Bank Car Loans Service,
  //                         Insurance Renewal & Claim Service
  //                       </Text> */}
  //                       <Text>{companyDetails[0].services}</Text>
  //                     </View>
  //                     <View
  //                       style={{
  //                         width: "50%",
  //                         textAlign: "right",
  //                         alignSelf: "flex-start",
  //                       }}
  //                     >
  //                       <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
  //                         For ARG's 7 Cars
  //                       </Text>
  //                       <Text style={{ marginBottom: 5, paddingTop: 50 }}>
  //                         Authorized Signature
  //                       </Text>
  //                     </View>
  //                   </View>
  //                 </View>
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     justifyContent: "space-between",
  //                     marginTop: "auto",
  //                   }}
  //                 >
  //                   <View style={{ width: "100%" }}>
  //                     <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
  //                       Subscidary:
  //                     </Text>
  //                   </View>
  //                 </View>
  //                 <View
  //                   style={{
  //                     width: "100%",
  //                     flexDirection: "row",
  //                     justifyContent: "space-between",
  //                   }}
  //                 >
  //                   <View
  //                     style={{
  //                       width: "50%",
  //                       marginLeft: 0,
  //                       position: "static",
  //                     }}
  //                   >
  //                     <Image
  //                       src="/icons/ARG_s 7Fitness2.jpg"
  //                       style={{ height: 50, width: 250 }}
  //                     />
  //                   </View>
  //                   <View
  //                     style={{
  //                       width: "50%",
  //                       marginLeft: 50,
  //                       position: "static",
  //                     }}
  //                   >
  //                     <Image
  //                       src="/icons/ARG_s 7Fitness2.jpg"
  //                       style={{ height: 50, width: 250 }}
  //                     />
  //                   </View>
  //                 </View>
  //               </>
  //             )}
  //           </Page>
  //         ))}
  //       </Document>
  //     );
  //   };

  // Helper: normalize tax for a row (considers `tax` or legacy `gst`) and returns NaN for missing
  const getTaxNumber = (item) => {
    if (item?.exclude) return null;
    if (item?.tax !== undefined && item?.tax !== null && item?.tax !== "") {
      return Number(item.tax);
    }
    if (item?.gst !== undefined && item?.gst !== null && item?.gst !== "") {
      return Number(item.gst);
    }
    return NaN;
  };

  const hasInvalidTaxRows = (items) => {
    return items.some((item) => {
      if (item?.exclude) return false;
      const t = getTaxNumber(item);
      return isNaN(t) || t === 0;
    });
  };

  const sendinvoice_data = async () => {

 const invalidItems = estimateItems.filter((item) => {
    if (item?.exclude) return false; // excluded items → skip
    const tax = item?.tax !== undefined && item?.tax !== null && item?.tax !== ""
      ? Number(item.tax)
      : Number(item?.gst ?? NaN);
    return isNaN(tax) || tax === 0; // 0% tax on non-excluded item → invalid
  });

  if (invalidItems.length > 0) {
    const names = invalidItems.map((i) => i.spareList || i.item_name || "item").join(", ");
    setSnackbarMessage(`Tax missing or 0%`);
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
    setTimeout(() => {
      router.push("/views/gstInvoice");
    }, 5000);
    return; // stop — don't call API
  }


    const token = Cookies.get("token");
    const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/appointment/complete_invoice/${appointmentId}`,
      {
        appointment_id: appointmentId,
        invoice_id: invoiceId,
        invoice_amount: grandTotal.toFixed(2),
        invoice_date: new Date().toISOString(),
        advance_payment: advanceAmount,
        advance_balance: advanceAmount,
        appointment_status: "invoiced",
        customer_id: customer.customer_id,
        vehicle_id: vehicleId,
        km: km,
        customer_name: customer.customer_name,
        estimateItems: estimateItems,
      }, {
      headers: {
        Authorization: `Bearer ${Cookies.get("token")}`,
        "Content-Type": "application/json",
      },
    }
    );
    if (response.status === 200) {
      setSnackbarMessage("Invoice data sent successfully");
      setOpenSnackbar(true);
      setInvoiceId(response.data.invoice_id);
      setGstInvoiceId(response.data.gst_invoice_id);
    } else {
      setSnackbarMessage("Failed to send invoice data");
      setOpenSnackbar(true);
    }
  };

  // function to check if all the fields are filled and then post the data to the server if not then show the error message
  function checkAllFieldsFilled(data) {
    if (
      Object.values(data).every(
        (value) => value !== null && value !== undefined && value !== "" && (typeof value !== 'object' || value.tax > 0)
      )
    ) {
      return true;
    } else {
      return false;
    }
  }
  const validateAndPostService = async (serviceType, Action) => {
    setHasChanges(false);
    let dataForFinanceRoute = {
      appointment_id: appointmentId,
      customer_id: customer.customer_id,
      debit: grandTotal?.toFixed(2),
    };

    const token = Cookies.get("token");
    if (Action === "Print") {
      Action = "invoiced";
    } else {
      Action = "invoice";
    }
    const validItems = estimateItems.filter(
      (item) =>
        item.spareList && item.reportedIssue && item.qty > 0 && item.price > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add Service, Service Can't be Blank");
      return;
    }

    const hasPartialRows = estimateItems.some(
      (item) =>
        (item.spareList ||
          item.reportedIssue ||
          item.qty > 0 ||
          item.price > 0) &&
        (!item.spareList ||
          !item.reportedIssue ||
          item.qty <= 0 ||
          item.price <= 0)
    );

    if (hasPartialRows) {
      setSnackbarMessage(
        "Please fill all fields in a row or remove incomplete rows."
      );
      setOpenSnackbar(true);
      return;
    }

    const services = validItems.map((item) => ({
      service_id: item.service_id || "",
      service_description: item.reportedIssue,
      price: item.price,
      service_type: item.type,
      advance_payment:
        advanceAmount === advanceInput ? 0 : parseFloat(advanceInput),
      advance_balance:
        advanceAmount === advanceInput || advanceAmount < advanceInput
          ? advanceAmount
          : advanceAmount - parseFloat(advanceInput),
      items_required: [
        {
          item_id: inventory.find(
            (invItem) => invItem.part_name === item.spareList
          )?.inventory_id,
          item_name: item.spareList,
          qty: item.qty,
          tax: item.tax,
          price: item.price,
        },
      ],
      status: "approved",
    }));

    try {
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

      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/update_invoice_amount/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Invoice_Amount: grandTotal.toFixed(2),
            advance_payment:
              advanceAmount === advanceInput ? 0 : parseFloat(advanceInput),
            advance_balance:
              advanceAmount === advanceInput || advanceAmount < advanceInput
                ? advanceAmount
                : advanceAmount - parseFloat(advanceInput),
            appointment_status: Action,
          }),
        }
      );
      // if (!invoiceId) {
      //   const response3 = await fetch(
      //     `${process.env.NEXT_PUBLIC_API_URL}/finance/customer/credit`,
      //     {
      //       method: "POST",
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //         "Content-Type": "application/json",
      //       },
      //       body: JSON.stringify(dataForFinanceRoute),
      //     }
      //   );
      // }

      const responseData = await response2.json();
      // setInvoiceId(responseData.invoice_id);

      if (!invoiceId) {
        // Build query parameters
        const queryParams = new URLSearchParams({
          appointment_id: appointmentId,
          invoice_id: responseData.invoice_id,
        });

        // Check if appointment/invoice already exists
        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/finance/check-appointment-invoice?${queryParams}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const checkData = await checkResponse.json();

        // Only proceed with credit creation if no existing appointment/invoice
        if (checkData.message === "No appointment or invoice exists") {
          const response3 = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/finance/customer/debit`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(dataForFinanceRoute),
            }
          );
        }
      }

      // console.log("Invoice ID set to:", responseData.invoice_id);

      if (!response.ok) throw new Error(`Failed to post to ${serviceType}`);
      if (Action === "invoiced") {
        const pdfBlob = await handleGeneratePDF(responseData.invoice_id);
      }

      const dyncamicValues = {
        customer_name: customer.customer_name,
        order_id: appointmentId,
        vehicle_id: vehicleId,
        km: km,
        invoice_amount: grandTotal.toFixed(2),
      };

      const page = "Invoice";
      const template = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${page}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (checkWhatsappLoggedIn()) {
        const fromNumber = Cookies.get("phone");
        const toNumber = customer.contact.phone;
        const message = null;
        const type = "file";
        const caption = replacePlaceholders(
          template.data.template_message,
          dyncamicValues
        );
        sendWhatsappMessage(
          fromNumber,
          toNumber,
          message,
          type,
          pdfBlob,
          caption
        );
      }

      setSnackbarMessage(`Invoice saved successfully`);
      setOpenSnackbar(true);
    } catch (err) {
      console.error(`Error in validateAndPostService:`, err);
      setSnackbarMessage(err.message);
      setOpenSnackbar(true);
    }
  };

  const balanceAmount = isCheckboxChecked
    ? advanceAmount === advanceInput || advanceAmount < advanceInput
      ? Math.max(0, grandTotal - advanceAmount + totalTax)
      : Math.max(0, grandTotal - advanceInput + totalTax)
    : overallTotal;

  useEffect(() => {
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
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);
  useEffect(() => {
    const fetchss = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
        const data = await response.json();
        const companyDetails = data.company_details && data.company_details[0];
        setCompanyName(companyDetails.company_name);
        setupi(companyDetails.company_upi);
      } catch (error) {
        console.error("Error fetching company details:", error);
      }
    };
    fetchss();
  }, []);

  const pageType = Cookies.get("page_type"); // "tab" or others


  return (
    <div>
      <ToastContainer />
      {/* <Navbar
        pageName={`Gst Invoice - ${appointmentId}`}
        hasChanges={hasChanges}
      /> */}

      {pageType !== "tab" && <Navbar
        pageName={`Gst Invoice - ${gstInvoiceId || invoiceId || appointmentId}`}
        hasChanges={hasChanges}
      />}
      <Box
        sx={{
          backgroundSize: "cover",
          color: "white",
          minHeight: "89vh",
        }}
        style={{ marginTop: pageType !== "tab" ? "0px" : "16px", }}
      >
        <Box>
          {loading && <Typography>Loading details...</Typography>}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={6000}
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
          >
            <MuiAlert
              onClose={() => setOpenSnackbar(false)}
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
                  ></div>
                </div>

                <div style={{ flex: 1, minWidth: "220px", marginRight: 16 }}>
                  {/* Customer Name */}
                  {/* {editMode ? (
        <TextField
          label="Customer Name"
          variant="outlined"
          size="small"
          value={customerName}
          onChange={(e) => handleChange("name", e.target.value)}
          fullWidth
          sx={{ marginBottom: 1 }}
        />
      ) : (
        <Typography variant="h3">{customer.customer_name?.slice(0, 15)}</Typography>
      )} */}
                  <Typography variant="h3">{customer.customer_name?.slice(0, 15)}</Typography>
                  {/* GST Number */}
                  {editMode ? (
                    <TextField
                      label="GST Number"
                      variant="outlined"
                      size="small"
                      // value= {customer.gst_number || "NA"}
                      onChange={(e) => handleChange("gst", e.target.value)}
                      fullWidth
                      sx={{ marginBottom: 1 }}

                    />
                  ) : (
                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Gst: </strong>
                      {customer.gst_number || "NA"}
                    </Typography>
                  )}

                  {/* Phone (read-only) */}
                  <Typography variant="body2" sx={{ marginBottom: 1 }}>
                    <strong>Phone: </strong>
                   <a href={`tel://${customer?.contact?.phone}`}>{customer?.contact?.phone}</a>
                  </Typography>

                  {/* Edit/Save Button */}
                  <Box sx={{ marginTop: 2 }}>
                    {editMode ? (
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={handleSaveEdit}
                          startIcon={<SaveIcon />} // adds icon at the start
                          sx={{ textTransform: "none", fontWeight: "bold" }}
                        >
                          {/* Remove text if you want icon only */}
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setEditMode(false);
                            setHasChanges(false);
                            // setCustomerName(customer.customer_name || "");
                            setGstNumber(customer.contact?.gst_number || "");
                          }}
                          startIcon={<CancelIcon />}
                          sx={{ textTransform: "none", fontWeight: "bold" }}
                        >
                          {/* Remove text if you want icon only */}
                        </Button>

                      </Box>
                    ) : (
                      <IconButton
                        color="primary"
                        onClick={() => setEditMode(true)}
                        title="Edit"
                        sx={{ marginTop: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
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
                        <Typography variant="body2" sx={{ color: "#888" }}>
                          <strong>Advance Amount:</strong>
                          {isCheckboxChecked
                            ? advanceAmount - advanceInput
                            : advanceAmount}
                        </Typography>
                      </div>
                    ))}
                </div>


              </Paper>

              <Paper
                elevation={1}
                sx={{
                  // padding: 1,
                  borderRadius: 2,
                  marginBottom: 3,
                  marginTop: -5,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    margin: 10,
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    GST Invoice Details
                  </Typography>
                  <Box
                    display="flex"
                    justifyContent="flex-end"
                    marginTop={0}
                    marginBottom={1}
                    gap={1}
                  >
                    <Button
                      variant="contained"
                      color="success"
                      onClick={() => {
                        handleGeneratePDF(gstInvoiceId || invoiceId, true);
                      }}
                      disabled={!gstInvoiceId && !invoiceId}
                    >
                      <PrintIcon />
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        sendinvoice_data();
                      }}
                    >
                      generate Gst  Invoice
                    </Button>


                    {/* <Button
                      variant="contained"
                      color="primary"
                      onClick={() => validateAndPostService("services_actual")}
                    >
                      Generate Invoice
                    </Button> */}
                    {/* <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => {
                        validateAndPostService("services_actual");
                        sendtomainpage();
                      }}
                    >
                      Save changes
                    </Button> */}

                    {/* <Button
                      variant="contained"
                      color="primary"
                      disabled={!invoiceId}
                      onClick={async () => {
                        try {
                          if (!invoiceId) {
                            setSnackbarMessage(
                              "No invoice to cancel. Please generate an invoice first."
                            );
                            setSnackbarSeverity("warning");
                            setOpenSnackbar(true);
                            return;
                          }
                          // console.log("Attempting to cancel invoice:", invoiceId);
                          const message = await cancelInvoice(token, invoiceId);
                          setSnackbarMessage(message);
                          setSnackbarSeverity("success");
                          setOpenSnackbar(true);
                          setInvoiceId("");
                        } catch (error) {
                          console.error("Error in cancel invoice:", error);
                          setSnackbarMessage(error.message);
                          setSnackbarSeverity("error");
                          setOpenSnackbar(true);
                        }
                      }}
                    >
                      Cancel Invoice
                    </Button> */}
                  </Box>
                </div>
                <Divider sx={{ marginBottom: 2 }} />

                <TableContainer
                  id="scrollable-table"
                  component={Paper}
                  style={{
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                  onScroll={(event) => {
                    scrollToTopButtonDisplay(event, setShowFab);
                  }}
                >
                  <Table>
                    <TableHead
                      style={{
                        position: "sticky",
                        top: 0,
                        backgroundColor: "white",
                      }}
                    >
                      <TableRow>
                        {/* <TableCell align="left">Reported Issue</TableCell> */}
                        <TableCell align="left" sx={{ width: "50vw" }}>
                          Spare List
                        </TableCell>
                        <TableCell align="center">Qty</TableCell>
                        <TableCell align="center">Price</TableCell>
                        <TableCell align="center">Exclude</TableCell>
                        <TableCell align="center">Tax</TableCell>
                        <TableCell align="center">Estimated Amount</TableCell>
                        <TableCell align="center">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(
                        estimateItems.reduce((groups, item) => {
                          const description = item.reportedIssue;
                          if (!groups[description]) {
                            groups[description] = [];
                          }
                          groups[description].push(item);
                          return groups;
                        }, {})
                      )
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([description, itemGroup]) => {
                          const groupStartIndex = estimateItems.findIndex(
                            (item) => item.reportedIssue === description
                          );

                          return (
                            <React.Fragment key={description}>
                              <TableRow>
                                <TableCell
                                  colSpan={7}
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
                              {itemGroup.map((item, groupIndex) => {
                                const actualIndex = estimateItems.findIndex(
                                  (it) => it === item
                                );

                                return (
                                  <TableRow key={actualIndex}>
                                    <TableCell>
                                      {/* // LK: Changed the text field to autocomplete. Can remove this if not needed. */}
                                      {/* <TextField
                                        select
                                        size="small"
                                        sx={{ width: "200px" }}
                                        value={item.spareList || ""}
                                        onChange={(e) =>
                                          handleSpareListChange(
                                            actualIndex,
                                            e.target.value
                                          )
                                        }
                                        fullWidth
                                        SelectProps={{
                                          native: true,
                                        }}
                                      >
                                        <option value="" defaultValue>
                                          Select {item.type} list
                                        </option>
                                        {getFilteredInventory(item.type).map(
                                          (option) => (
                                            <option
                                              key={option.inventory_id}
                                              value={option.part_name}
                                            >
                                              {option.part_name}
                                            </option>
                                          )
                                        )}
                                      </TextField> */}

                                      <Autocomplete
                                        size="small"
                                        sx={{ width: "100%" }}
                                        options={getFilteredInventory(
                                          item.type
                                        )}
                                        getOptionLabel={(option) =>
                                          option.part_name
                                        }
                                        value={
                                          getFilteredInventory(item.type).find(
                                            (option) =>
                                              option.part_name ===
                                              item.spareList
                                          ) || null
                                        }
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
                                                setOpenAddProductModal(true);
                                                // setProductType(item.type);
                                              }}
                                            >
                                              Add
                                            </Button>
                                          </Box>
                                        }
                                        onChange={(event, newValue) => {
                                          setHasChanges(true);
                                          handleSpareListChange(
                                            actualIndex,
                                            newValue ? newValue.part_name : ""
                                          );
                                        }}
                                        renderInput={(params) => (
                                          <TextField
                                            {...params}
                                            label={`Select ${item.type} list`}
                                            fullWidth
                                          />
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      {/* <TextField
                                        value={item.qty}
                                        size="small"
                                        type="number"
                                        min="0"
                                        inputProps={{ step: "0.5" }}
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            actualIndex,
                                            estimateItems,
                                            addEstimateItem
                                          )
                                        }
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          if (e.target.value < 0) {
                                            e.preventDefault();
                                            return;
                                          }
                                          const updatedQty = parseFloat(
                                            e.target.value
                                          ).toFixed(1);
                                          if (
                                            !isNaN(updatedQty) &&
                                            updatedQty >= 0
                                          ) {
                                            updateEstimateItem(
                                              actualIndex,
                                              "qty",
                                              parseFloat(
                                                e.target.value
                                              ).toFixed(1) || 0.0
                                            );
                                          } else {
                                            e.preventDefault();
                                            return;
                                          }
                                        }}
                                        fullWidth
                                        sx={{ width: "70px" }}
                                      /> */}

                                      <TextField
                                        value={item.qty}
                                        size="small"
                                        type="number"
                                        inputProps={{ step: 0.5, min: 0 }}
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            actualIndex,
                                            estimateItems,
                                            addEstimateItem
                                          )
                                        }
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          const value = e.target.value;

                                          // Allow empty value (e.g., during typing)
                                          if (value === "") {
                                            updateEstimateItem(
                                              actualIndex,
                                              "qty",
                                              ""
                                            );
                                            return;
                                          }

                                          const parsed = parseFloat(value);

                                          // Validate number and ensure it's not negative
                                          if (!isNaN(parsed) && parsed >= 0) {
                                            updateEstimateItem(
                                              actualIndex,
                                              "qty",
                                              parsed
                                            );
                                          }
                                        }}
                                        fullWidth
                                        sx={{ width: "70px" }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <TextField
                                        type="number"
                                        value={item.price}
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            actualIndex,
                                            estimateItems,
                                            addEstimateItem
                                          )
                                        }
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          const value = e.target.value;
                                          if (value >= 0 || value === "") {
                                            updateEstimateItem(
                                              actualIndex,
                                              "price",
                                              value
                                            );
                                          }
                                        }}
                                        size="small"
                                        sx={{ width: "100px" }}
                                      />
                                    </TableCell>

                                    <TableCell align="center">
                                      <Checkbox
                                        checked={!!item.exclude}
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          setEstimateItems((prev) => {
                                            const updated = [...prev];
                                            const idx = actualIndex >= 0 ? actualIndex : prev.findIndex((it) => it === item);
                                            if (idx >= 0) {
                                              updated[idx] = {
                                                ...updated[idx],
                                                exclude: e.target.checked,
                                              };
                                            }
                                            return updated;
                                          });
                                        }}
                                      />
                                    </TableCell>

                                    {/* <TableCell align="center">
                                      <TextField
                                        type="number"
                                        size="small"
                                        sx={{ width: "80px" }}
                                        inputProps={{ step: 0.01, min: 0 }}
                                        value={
                                          item.tax !== undefined && item.tax !== null && item.tax !== ""
                                            ? item.tax
                                            : item.gst || 0
                                        }
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          const v = e.target.value;
                                          if (v === "") {
                                            updateEstimateItem(actualIndex, "tax", "");
                                            updateEstimateItem(actualIndex, "gst", "");
                                            return;
                                          }
                                          const parsed = parseFloat(v);
                                          if (!isNaN(parsed) && parsed >= 0) {
                                            updateEstimateItem(actualIndex, "tax", parsed);
                                            updateEstimateItem(actualIndex, "gst", parsed);
                                            calculateEstimatedAmount(actualIndex, estimateItems);
                                          }
                                        }}
                                        inputRef={
                                          actualIndex === estimateItems.length - 1
                                            ? lastInputRef
                                            : null
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            actualIndex,
                                            estimateItems,
                                            addEstimateItem
                                          )
                                        }
                                      />
                                    </TableCell> */}

                                    <TableCell align="center">
                                      <TextField
                                        select
                                        size="small"
                                        sx={{ width: "90px" }}
                                        value={
                                          item.tax !== undefined && item.tax !== null && item.tax !== ""
                                            ? item.tax
                                            : item.gst || 0
                                        }
                                        onChange={(e) => {
                                          setHasChanges(true);
                                          const parsed = parseFloat(e.target.value);

                                          updateEstimateItem(actualIndex, "tax", parsed);
                                          updateEstimateItem(actualIndex, "gst", parsed);
                                          calculateEstimatedAmount(actualIndex, estimateItems);
                                        }}
                                        inputRef={
                                          actualIndex === estimateItems.length - 1
                                            ? lastInputRef
                                            : null
                                        }
                                        onKeyDown={(e) =>
                                          handleKeyPress(
                                            e,
                                            actualIndex,
                                            estimateItems,
                                            addEstimateItem
                                          )
                                        }
                                      >
                                        <MenuItem value={0}>0%</MenuItem>
                                        <MenuItem value={5}>5%</MenuItem>
                                        <MenuItem value={18}>18%</MenuItem>
                                        <MenuItem value={24}>24%</MenuItem>
                                      </TextField>
                                    </TableCell>


                                    <TableCell align="center">
                                      <Typography>
                                        {item.qty * item.price}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <IconButton
                                        onClick={() =>
                                          deleteService(
                                            item.service_id,
                                            actualIndex
                                          )
                                        }
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                      {/* Only show Add icon for the very last item in the entire table */}
                                      {/* {actualIndex ===
                                        estimateItems.length - 1 && (
                                          <IconButton onClick={addEstimateItem}>
                                            <AddIcon />
                                          </IconButton>
                                        )} */}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Paper
                  elevation={3}
                  sx={{ padding: 3, borderRadius: 2, marginBottom: 3 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Divider sx={{ marginBottom: 2 }} />
                  <Grid container spacing={3} justifyContent="space-between">
                    <Grid item xs={12} sm={2}>
                      {/* <Typography variant="body1">
                        <strong>Grand Total:</strong> {grandTotal?.toFixed(2)}
                      </Typography> */}
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body1">
                        <strong>Total Tax:</strong> {totalTax?.toFixed(2)}
                      </Typography>
                    </Grid>
                    {isCheckboxChecked && (
                      <Grid item xs={12} sm={2}>
                        <Typography variant="body1">
                          <strong>Advance Amount:</strong>
                          {advanceAmount === advanceInput ||
                            advanceAmount < advanceInput
                            ? advanceAmount
                            : advanceInput}
                        </Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="body1">
                        <strong>Overall Total:</strong> {grandTotal?.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Paper>


            </Box>
          )}

          <Box
            sx={{
              position: "fixed",
              bottom: 25,
              right: 80,
              display: "flex",
              gap: 2,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            {/* <Button
              variant="contained"
              color="success"
              onClick={() => setOpenConformationModal(true)}
            >
              <PrintIcon />
            </Button> */}
          </Box>
          <Box
            sx={{
              position: "fixed",
              bottom: 25,
              right: 150,
              display: "flex",
              gap: 2,
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            {/* <Button
              variant="contained"
              color="success"
              onClick={() => {
                console.log("hits");
                setHasChanges(false);
                let Action = "Save";
                validateAndPostService("services_actual", Action);
              }}
            >
              <SaveIcon />
            </Button> */}
          </Box>
          {/* Chat Box */}
          <Box position="fixed" bottom={16} right={16} zIndex={2}>
            {/* Floating Action Button for Chat */}
            <Fab color="primary" aria-label="chat" onClick={toggleChat}>
              <ChatIcon />
            </Fab>

            {/* Chat Window */}
            {isChatOpen && (
              <Box
                sx={{
                  position: "fixed",
                  bottom: 80,
                  right: 16,
                  width: 300,
                  maxHeight: 400,
                  bgcolor: "background.paper",
                  boxShadow: 3,
                  borderRadius: 2,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Chat Header */}
                <Paper
                  elevation={1}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    p: 1,
                  }}
                >
                  <Typography variant="subtitle1">
                    Chat with Mechanic
                  </Typography>
                  <IconButton size="small" onClick={toggleChat}>
                    <CloseIcon />
                  </IconButton>
                </Paper>

                <Divider />

                {/* Chat Messages */}
                <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1 }}>
                  {messages.map((message, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 1,
                        textAlign:
                          message.sender === "Garage Owner" ? "right" : "left",
                      }}
                    >
                      <Typography
                        variant="body2"
                        color={
                          message.sender === "Garage Owner"
                            ? "primary"
                            : "textSecondary"
                        }
                      >
                        <strong>{message.sender}:</strong> {message.text}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Chat Input */}
                <Box sx={{ display: "flex", p: 1 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Type a message"
                    value={newMessage}
                    onChange={(e) => {
                      setHasChanges(true);
                      setNewMessage(e.target.value);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    sx={{ ml: 1 }}
                  >
                    Send
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
      {/* Back to Top FAB */}
      {showFab && (
        <Fab
          size="small"
          onClick={handleScrollToTop}
          style={{
            backgroundColor: "white",
            color: "primary",
            position: "absolute",
            bottom: 40,
            right: 40,
            zIndex: 10,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      )}

      {/* //? Conformation Modal */}
      <Dialog
        open={openConformationModal}
        onClose={() => setOpenConformationModal(false)}
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
          Confirm Invoice Creation
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
            Are you sure you want to
            <span style={{ fontWeight: "bold" }}> Generate Invoice?</span>
            <br></br>This action cannot be undone.
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
            onClick={() => setOpenConformationModal(false)}
            color="error"
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
            onClick={() => {
              setHasChanges(false);
              let Action = "Print";
              validateAndPostService("services_actual", Action);
              setOpenConformationModal(false);

              setTimeout(() => {
                router.push("/views/invoiceList");
              }, 1500);
            }}
            color="success"
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

      <Modal
        open={openAddProductModal}
        onClose={() => setOpenAddProductModal(false)}
      >
        <AddProduct
          token={token}
          // category={productType}
          onProductAdded={() =>
            fetchDetails(
              Cookies.get("token"),
              appointmentId,
              setSnackbarMessage,
              setOpenSnackbar,
              setSnackbarSeverity,
              setKm,
              setNextServiceKm,
              setAppointment,
              setCustomer,
              setVehicleId,
              setInventory,
              setLoading,
              setPaymentMode,
              setInvoiceDate,
              setInvoiceId,
              setGstInvoiceId,
            )}
          setOpenAddProductModal={setOpenAddProductModal}
          typedname={typedname}
        />
      </Modal>
    </div>
  );
}
