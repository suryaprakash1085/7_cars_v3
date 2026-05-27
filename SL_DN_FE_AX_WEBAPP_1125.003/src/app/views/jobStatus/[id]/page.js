"use client";
// React and Next imports
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Document,
  Page,
  Text,
  View,
  Image as PDFImage,
  pdf,
} from "@react-pdf/renderer";
import axios from "axios";
import Cookies from "js-cookie";
// Function imports
import {
  fetchDetails,
  handleCloseSnackbar,
  formatDate,
  fetchInvoiceId,
  ReadInvoiceId,
} from "../../../../../controllers/jobStatusIDControllers";

import generatePDF from "../../../../components/PDFGenerator_estimate";
// import generatePDF from "../../../../components/PDFGenerator_estimate"

import generatePDFInvoice from "../../../../components/PDFGenerator_invoice";

// Component imports
import LiveChat from "@/components/liveChat";
import Navbar from "@/components/navbar";
import BackButton from "@/components/backButton";
import { calculateTotals as gstCalculation } from "@/components/gstcalculation";
import QRCode from "qrcode";
import delivery_challan_pdf from "@/components/PDFGenerator_delivery";
import { formatDateInTimezone, formatWallDatePlusMonths, getActiveTimezone } from "@/utils/timezoneUtil";

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
  Paper,
  Divider,
  Snackbar,
  Button,Tooltip 
} from "@mui/material";

// Images and icon imports
import MuiAlert from "@mui/material/Alert";
import CircleIcon from "@mui/icons-material/Circle";
import PrintIcon from "@mui/icons-material/Print";
import { set } from "date-fns";

export default function JobStatusDetails() {
  const router = useRouter();
  const params = useParams();
  const lastInputRef = useRef(null);

  // FrontEnd extracted data states
  const appointmentId = params.id;
  const [token, setToken] = useState();

  const [appTimezone, setAppTimezone] = useState(null);
  useEffect(() => {
    getActiveTimezone().then(setAppTimezone);
  }, []);

  const [isCounterSales, setIsCounterSales] = useState(false);



  const [nextServiceKm, setNextServiceKm] = useState("");

  // Backend Data states
  const [customer, setCustomer] = useState(null);
  
  const[vehicleMake, setVehicleMake] = useState("");
  const[vehicleModel, setVehicleModel] = useState("");
  const [vehicleId, setVehicleId] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [km, setKm] = useState("");
  const [estimateItems, setEstimateItems] = useState([]);
  const [services, setServices] = useState();
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [PdfHeaderImage, setPdfHeaderImage] = useState("");
  const [pdfFooterImage, setPdfFooterImage] = useState("");
  const [pdfLogo, setPdfLogo] = useState("");
  const[appointmentDate, setAppointmentDate] = useState("");
  // FrontEnd form input states
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

  // Modal and Alert states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackBarSeverity, setSnackBarSeverity] = useState();

  // Mobile view detection
  const [isMobileView, setIsMobileView] = useState(false);
  const [showDetails, setShowDetails] = useState({});

  // Add new state for appointment status
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [printDate, setPrintDate] = useState(new Date());
  const [printedBy, setPrintedBy] = useState(
    Cookies.get("userName") || "Unknown User"
  );

  const [upi, setupi] = useState("");
  const [companyName, setCompanyName] = useState("");
  const { grandTotal, totalDiscount, totalTax, overallTotal } =
    gstCalculation(estimateItems);

  // First, add a new state for company details at the top with other states
  const [companyDetails, setCompanyDetails] = useState([]);

  // First, update the useEffect for fetching company details
  useEffect(() => {
    let appointmentType = appointmentId.split("-")[0];

    if (appointmentType == "CTS") {
      setIsCounterSales(true);
    }

    const fetchCompanyDetails = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log("Company Details:", data.company_details); // Debug log
        if (data.company_details && data.company_details.length > 0) {
          setCompanyDetails(data.company_details);
        }
      } catch (error) {
        console.error("Error fetching company details:", error);
      }
    };

    fetchCompanyDetails();
  }, []); // Remove token dependency







  
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
    let storedToken = localStorage.getItem("token");
    setToken(storedToken);

    if (!appointmentId) {
      console.log("Appointment ID is not available");
      setLoading(false);
      return;
    }

    fetchDetails(
      token,
      appointmentId,
      vehicleId,
      setLoading,
      setError,
      setSnackbarMessage,
      setOpenSnackbar,
      setSnackBarSeverity,
      setServices,
      setKm,
      setNextServiceKm,
      setCustomer,
      setVehicleId,
      setInventory,
      setAppointmentStatus,
      setEstimateItems,
      setPaymentMethod,
      setInvoiceDate,
      setVehicleMake,
      setVehicleModel,
      setAppointmentDate,
    );
  }, [appointmentId]);
  console.log("vehicle make and model123", vehicleMake, vehicleModel);

  // Add mobile view detection
  useEffect(() => {
    fetchInvoiceId(appointmentId, setInvoiceId);
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener("resize", handleResize);
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

  const toggleDetails = (serviceId) => {
    setShowDetails((prevState) => ({
      ...prevState,
      [serviceId]: !prevState[serviceId],
    }));
  };

  // console.log("services", services);

  const calculateTotals = () => {
    if (!estimateItems || estimateItems.length === 0) {
      return { grandTotal: 0, totalTax: 0 };
    }

    let grandTotal = 0;
    let totalTax = 0;

    estimateItems.forEach((item) => {
      item.spares.forEach((spare) => {
        const price = parseFloat(spare.price) || 0;
        const qty = parseFloat(spare.qty) || 0;
        const tax = parseFloat(spare.tax) || 0;

        const itemTotal = price * qty;
        const itemTax = (itemTotal * tax) / 100;

        grandTotal += itemTotal;
        totalTax += itemTax;
      });
    });

    return { grandTotal, totalTax };
  };

  const handleEstimatePrint = async () => {
    const { grandTotal } = calculateTotals();
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
      paymentMethod,
      openInNewTab: true,
      vehicleMake,
      vehicleModel,
      appointmentDate,
    });
  };

  const handleInvoicePrints = () => {
    const { grandTotal, totalTax } = calculateTotals();

    // Calculate itemTotal from estimateItems
    const itemTotal = estimateItems.reduce((total, item) => {
      return (
        total +
        item.spares.reduce((sparesTotal, spare) => {
          const price = parseFloat(spare.price) || 0;
          const qty = parseFloat(spare.qty) || 0;
          return sparesTotal + price * qty;
        }, 0)
      );
    }, 0);

    generatePDFInvoice({
      customer,
      estimateItems,
      appointmentId,
      vehicleId,
      km,
      nextServiceKm,
      grandTotal,
      totalTax,
      PdfHeaderImage,
      pdfFooterImage,
      pdfLogo,
      invoiceDate,
      invoiceId: invoiceId,
      companyDetails,
      upi,
      itemTotal,
      printDate,

      printedBy, // Now properly calculated
      paymentMethod,
      openInNewTab: true, 
    });

    // console.log({
    //   customer,
    //   estimateItems,
    //   appointmentId,
    //   vehicleId,
    //   km,
    //   grandTotal,
    //   totalTax,
    //   itemTotal, // Added to console.log
    //   PdfHeaderImage,
    //   pdfFooterImage,
    //   invoiceId: invoiceId || appointmentId,
    // });
  };

  console.log({ "hi hello": generatePDFInvoice });
  const deliverChallanClick = async () => {
    await delivery_challan_pdf({
      customer,
      estimateItems,
      appointmentId,
      vehicleId,
      km,
      nextServiceKm,
      grandTotal,
      totalTax,
      PdfHeaderImage,
      pdfFooterImage,
      pdfLogo,
      invoiceId,
      companyDetails,
      upi,
      services,
      printDate,
      printedBy,
      appointmentDate,
      openInNewTab: true, 
    });
  };

  //   const generatePDF = async (
  //     customer,
  //     services,
  //     appointmentId,
  //     vehicleId,
  //     km,
  //     inventory,
  //     user,
  //     userId
  //   ) => {
  //     const MyDocument = () => {
  //       const itemsPerPage = 20;
  //       const totalPages = Math.ceil(services.length / itemsPerPage);

  //       return (
  //         <Document>
  //           {Array.from({ length: totalPages }).map((_, pageIndex) => (
  //             <Page
  //               key={pageIndex}
  //               size="A4"
  //               style={{
  //                 padding: 20,
  //                 fontSize: 10,
  //                 fontFamily: "Times-Roman",
  //                 display: "flex",
  //                 flexDirection: "column",
  //                 justifyContent: "space-between",
  //                 minHeight: "100vh",
  //               }}
  //             >
  //               {/* Watermark */}
  //               <Image
  //                 src="/icons/Arg_s7Cars Logo.png"
  //                 style={{
  //                   height: 300,
  //                   width: 450,
  //                   position: "absolute",
  //                   top: "30%",
  //                   left: "10%",
  //                   opacity: 0.1,
  //                   zIndex: 0,
  //                   pointerEvents: "none",
  //                 }}
  //               />

  //               {/* Header Section */}
  //               <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     justifyContent: "space-between",
  //                     alignItems: "center",
  //                     paddingBottom: 10,
  //                     borderBottom: "2px solid #000",
  //                   }}
  //                 >
  //                   <Image
  //                     src="/icons/pdf_head.png"
  //                     style={{ height: 75, width: 75 }}
  //                   />
  //                   <Image
  //                     src="/icons/Arg_s7Cars Logo.png"
  //                     style={{ height: 100, width: 150 }}
  //                   />
  //                   <View style={{ textAlign: "center", flexGrow: 1 }}>
  //                     <Image
  //                       src="/icons/ayyanar.png"
  //                       style={{ height: 30, width: 130, marginRight: 350 }}
  //                     />
  //                     <Text
  //                       style={{
  //                         fontSize: 20,
  //                         fontWeight: "bolder",
  //                         marginLeft: 80,
  //                       }}
  //                     >
  //                       ARG's 7 Cars
  //                     </Text>
  //                     <Text
  //                       style={{
  //                         fontWeight: "light",
  //                         fontStyle: "italic",
  //                         marginLeft: 80,
  //                       }}
  //                     >
  //                       Perfectus Immutatio
  //                     </Text>
  //                     <Text style={{ marginLeft: 80 }}>
  //                       No 366, Thiruthangal Road, Sivakasi - 626130
  //                     </Text>
  //                     <Text style={{ marginLeft: 80 }}>
  //                       Contact: 77080 03008, 72003 77707
  //                     </Text>
  //                     <Text style={{ marginLeft: 80 }}>
  //                       GSTIN: 33BGFPA9032E1ZY
  //                     </Text>
  //                   </View>
  //                 </View>
  //               </View>

  //               <View>
  //                 <Text
  //                   style={{
  //                     fontWeight: "bold",
  //                     fontSize: 16,
  //                     textAlign: "center",
  //                   }}
  //                 >
  //                   Delivery Challan
  //                 </Text>
  //               </View>

  //               {/* Patron and Vehicle Details */}
  //               <View
  //                 style={{
  //                   border: "1px solid #000",
  //                   padding: 10,
  //                   marginBottom: 10,
  //                   display: "flex",
  //                   flexDirection: "column",
  //                   justifyContent: "space-between",
  //                 }}
  //               >
  //                 <View
  //                   style={{
  //                     display: "flex",
  //                     flexDirection: "row",
  //                     justifyContent: "space-between",
  //                     width: "100%",
  //                     alignContent: "space-between",
  //                   }}
  //                 >
  //                   <View style={{ width: "60%" }}>
  //                                         <Text>
  //                     Patron: {customer.prefix} {customer.customer_name}
  //                     </Text>

  //                     <Text style={{ marginLeft: 30 }}>
  //                       {customer.contact.address.street},{" "}
  //                       {customer.contact.address.city}
  //                     </Text>
  //                     <Text style={{ marginLeft: 30 }}> {customer.contact.phone}</Text>
  //                   </View>
  //                   {/* <View
  //   style={{
  //     flexDirection: "column",
  //     width: "40%",
  //     justifyContent: "center", // Center vertically
  //     alignItems: "center", // Center horizontally
  //     // minHeight: 150, // Ensures space even if data is missing
  //   }}
  // >
  //   {[
  //     { label: "Appointment No :", value: appointmentId || "N/A" },
  //     { label: "Delivery Date :", value: new Date().toLocaleDateString("en-GB") },
  //     { label: "Vehicle No :", value: vehicleId || "N/A" },
  //     { label: "Vehicle Kms :", value: km || "N/A" },

  //   ].map((item, index) => (
  //     <View
  //       key={index}
  //       style={{
  //         flexDirection: "row",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         width: "100%",
  //       }}
  //     >
  //       <Text style={{ fontWeight: "bold", minWidth: 130, textAlign: "right" }}>
  //         {item.label}
  //       </Text>
  //       <Text style={{ textAlign: "left", flex: 1, marginLeft: 5 }}>
  //         {item.value}
  //       </Text>
  //     </View>
  //   ))}
  // </View> */}

  //   <View
  //                     style={{
  //                       flexDirection: "column",
  //                       // width: "20%",
  //                       // justifyContent: "space-between",
  //                     }}
  //                   >
  //                     <View
  //                       style={{
  //                         flexDirection: "row",
  //                       }}
  //                     >
  //                       <Text>Appointment No  :</Text>
  //                       <Text style={{ textAlign: "left" }}>{appointmentId || "N/A"}</Text>
  //                     </View>
  //                     <View
  //                       style={{
  //                         flexDirection: "row",
  //                       }}
  //                     >
  //                       <Text>Delivery Date :</Text>
  //                       <Text style={{ textAlign: "left" }}>
  //                         {new Date().toLocaleDateString()}
  //                       </Text>
  //                     </View>
  //                     <View
  //                       style={{
  //                         flexDirection: "row",
  //                       }}
  //                     >
  //                       <Text>Vehicle No :</Text>
  //                       <Text style={{ textAlign: "left" }}>{vehicleId}</Text>
  //                     </View>
  //                     <View
  //                       style={{
  //                         flexDirection: "row",
  //                       }}
  //                     >
  //                       <Text>Vehicle Kms :</Text>
  //                       <Text style={{ textAlign: "left" }}>{km}</Text>
  //                     </View>
  //                   </View>

  //                 </View>
  //                 {customer.gst_number && (
  //                   <View
  //                     style={{
  //                       padding: 1,
  //                       width: "30%",
  //                       marginBottom: 1,
  //                       display: "flex",
  //                       flexDirection: "column",
  //                       justifyContent: "space-between",
  //                     }}
  //                   >
  //                     <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
  //                   </View>
  //                 )}
  //               </View>

  //               {/* Items Table */}
  //               <View
  //                 style={{ border: "1px solid #000", marginBottom: 10, flex: 1 }}
  //               >
  //                 <View
  //                   style={{
  //                     flexDirection: "row",
  //                     borderBottom: "1px solid #000",
  //                     backgroundColor: "#f0f0f0",
  //                     padding: 5,
  //                   }}
  //                 >
  //                   <Text style={{ width: "10%", textAlign: "center" }}>
  //                     S.No
  //                   </Text>
  //                   <Text style={{ width: "40%", textAlign: "left" }}>
  //                     Particulars
  //                   </Text>
  //                   <Text
  //                     style={{
  //                       marginLeft: "10px",
  //                       width: "30%",
  //                       textAlign: "left",
  //                     }}
  //                   >
  //                     Inspection Status
  //                   </Text>
  //                   <Text style={{ width: "50%", textAlign: "left" }}>
  //                     Comments
  //                   </Text>
  //                 </View>

  //                 {/* Render items for the current page */}
  //                 {services
  //                   .slice(
  //                     pageIndex * itemsPerPage,
  //                     (pageIndex + 1) * itemsPerPage
  //                   )
  //                   .map((service, index) => {
  //                     // Safely get the first item name or use a default value
  //                     const itemName =
  //                       service.items_required && service.items_required[0]
  //                         ? service.items_required[0].item_name
  //                         : "No items";

  //                     // Safely parse comments
  //                     const comments = service.comments
  //                       ? JSON.parse(service.comments)[0]?.comments
  //                       : "-";

  //                     return (
  //                       <View
  //                         key={index}
  //                         style={{ flexDirection: "row", padding: 1 }}
  //                       >
  //                         <Text style={{ width: "10%", textAlign: "center" }}>
  //                           {index + 1 + pageIndex * itemsPerPage}
  //                         </Text>
  //                         <Text style={{ width: "40%", textAlign: "left" }}>
  //                           {`${itemName} - ${service.service_description || ""}`}
  //                         </Text>
  //                         <Text
  //                           style={{
  //                             marginLeft: "10px",
  //                             width: "30%",
  //                             textAlign: "left",
  //                           }}
  //                         >
  //                           {service.service_status === "Completed"
  //                             ? "Checked Ok"
  //                             : "Deffered"}
  //                         </Text>
  //                         <Text style={{ width: "50%", textAlign: "left" }}>
  //                           {comments}
  //                         </Text>
  //                       </View>
  //                     );
  //                   })}
  //               </View>

  //               {/* Signature section */}
  //               <View
  //                 style={{
  //                   border: "1px solid #000",
  //                   padding: "50 30 10 30",
  //                   marginBottom: 10,
  //                   display: "flex",
  //                   flexDirection: "row",
  //                   justifyContent: "space-between",
  //                 }}
  //               >
  //                 <View>
  //                   <Text>Prepared By</Text>
  //                 </View>

  //                 <View>
  //                   <Text>Received By</Text>
  //                 </View>
  //               </View>

  //               {/* Footer Section */}
  //               {/* <View style={{ width: "100%", textAlign: "right" }}>
  //                 <Text>
  //                   Printed by : {userId} - {user}
  //                 </Text>
  //               </View> */}
  //               <View
  //                 style={{
  //                   flexDirection: "row",
  //                   justifyContent: "space-between",
  //                 }}
  //               >
  //                 <Text>Date: {formatDate(printDate)}</Text>
  //                 <Text>Printed By: {printedBy}</Text>
  //                 <Text>Print Type: Reprint</Text>
  //               </View>
  //             </Page>
  //           ))}
  //         </Document>
  //       );
  //     };

  //     const pdfBlob = await pdf(<MyDocument />).toBlob();
  //     const url = URL.createObjectURL(pdfBlob);
  //     const link = document.createElement("a");
  //     link.href = url;
  //     const Timestamp = new Date().getTime();
  //     link.download = `Delivery_Challan_${appointmentId}_${Timestamp}.pdf`;
  //     document.body.appendChild(link);
  //     // Open the file in a new tab
  //     // window.open(url, `Estimate_${appointmentId}_${Timestamp}.pdf`);
  //     link.click();
  //     return pdfBlob;
  //   };
  const handleDeliveryPrint = async () => {
    // Add delivery print logic
    const user = Cookies.get("userName");
    const userId = Cookies.get("userId");
    await generatePDF(
      customer,
      services,
      appointmentId,
      vehicleId,
      km,
      inventory,
      user,
      userId
    );
  };

  const handleInvoicePrint = async () => {
    var invoiceId = await ReadInvoiceId(appointmentId, setInvoiceId);

    const user = Cookies.get("userName");
    const userId = Cookies.get("userId");

    // Initialize grandTotal and totalTax
    let grandTotal = 0;
    let totalTax = 0;

    // Calculate totals from services_actual
    services.forEach((service) => {
      const servicePrice = parseFloat(service.price) || 0; // Use the price from the service
      const items = service.items_required;

      // Calculate total for each item
      items.forEach((item) => {
        const itemQty = parseFloat(item.qty) || 0;
        const itemTax = item.tax || 0; // Assuming tax is in percentage

        // Calculate total for this item
        // const itemTotal = itemQty * servicePrice;
        // grandTotal += itemTotal;

        // Calculate tax for this item
        const itemTaxAmount = (itemTotal * itemTax) / 100;
        totalTax += itemTaxAmount;
      });
    });

    const taxDetails = {
      value: grandTotal,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      totalTax: totalTax,
    };

    const amountInWords = (amount) => {
      const wholeNumber = Math.round(amount);
      const toWords = require("number-to-words");
      return (
        toWords.toWords(wholeNumber).charAt(0).toUpperCase() +
        toWords.toWords(wholeNumber).slice(1)
      );
    };

    let upiDetails = {
      pa: upi,
      pn: companyName,
      tn: appointmentId,
      am: grandTotal?.toFixed(2) || 0,
      cu: "INR",
    };

    let upiLink = `upi://pay?pa=${encodeURIComponent(
      upiDetails.pa
    )}&pn=${encodeURIComponent(upiDetails.pn)}&tn=${encodeURIComponent(
      upiDetails.tn
    )}&am=${encodeURIComponent(upiDetails.am)}&cu=${encodeURIComponent(
      upiDetails.cu
    )}`;

    const qrCodeDataUrl = await QRCode.toDataURL(upiLink);

    const itemsPerPage = 20; // Set the number of items per page
    const totalPages = Math.ceil(services?.length / itemsPerPage); // Calculate total pages || (invoiceId) || (vehicleId)
    if (!customer || !invoiceId || !vehicleId || !services) {
      console.error("Missing required data for InvoiceDocument");
      return;
    }

    const InvoiceDocument = () => {
      console.log(
        "InvoiceDocument props:",
        customer,
        invoiceId,
        vehicleId,
        services
      );
      return (
        <Document>
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <Page
              key={pageIndex}
              size="A4"
              style={{
                padding: 20,
                fontSize: 10,
                fontFamily: "Times-Roman",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "100vh",
              }}
            >
              {/* Watermark */}
              <PDFImage
                src="/icons/Arg_s7Cars Logo.png"
                style={{
                  height: 300,
                  width: 450,
                  position: "absolute",
                  top: "30%",
                  left: "10%",
                  opacity: 0.1,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
              />

              {/* Header Section
              <View style={{ textAlign: "center", marginBottom: 10 }} fixed>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: 10,
                    borderBottom: "2px solid #000",
                  }}
                >
                  <Image
                    src="/icons/pdf_head.png"
                    style={{ height: 75, width: 75 }}
                  />
                  <Image
                    src="/icons/Arg_s7Cars Logo.png"
                    style={{ height: 100, width: 150 }}
                  />
                  <View style={{ textAlign: "center", flexGrow: 1 }}>
                    <Image
                      src="/icons/ayyanar.png"
                      style={{ height: 30, width: 130, marginRight: 350 }}
                    />
                    <Text
                      style={{
                        fontSize: 20,
                        fontWeight: "bolder",
                        marginLeft: 80,
                        fontFamily: "Helvetica-Bold",
                      }}
                    >
                      ARG's 7 Cars
                    </Text>
                    <Text
                      style={{
                        fontWeight: "light",
                        fontStyle: "italic",
                        marginLeft: 80,
                      }}
                    >
                      Perfectus Immutatio
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      No 366, Thiruthangal Road, Sivakasi - 626130
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      Contact: 77080 03008, 72003 77707
                    </Text>
                    <Text style={{ marginLeft: 80 }}>
                      GSTIN: 33BGFPA9032E1ZY
                    </Text>
                  </View>
                </View>
              </View> */}

              <PDFImage
                src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${PdfHeaderImage}`}
                style={{
                  width: 580,
                  height: 95,
                }}
              />

              <View>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    textAlign: "center",
                  }}
                >
                  Invoice
                </Text>
              </View>

              {/* Patron and Vehicle Details */}
              <View
                style={{
                  border: "1px solid #000",
                  padding: 10,
                  marginBottom: 10,
                  display: "flex",
                  flexDirection: "row", // Align in row for three columns
                  justifyContent: "space-between",
                }}
              >
                {/* First Column - Customer Details */}
                <View style={{ width: "33%" }}>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    Patron: {customer.prefix} {customer.customer_name}
                  </Text>
                  <Text style={{ marginLeft: 35 }}>
                    {customer.contact.address.street},
                  </Text>
                  <Text style={{ marginLeft: 35 }}>
                    {customer.contact.address.city}
                  </Text>
                  <Text
                    style={{ marginLeft: 35, fontFamily: "Helvetica-Bold" }}
                  >
                    {customer.contact.phone}
                  </Text>
                </View>

                {/* Second Column - Invoice Details */}
                <View style={{ width: "33%" }}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Invoice No :</Text>
                    <Text
                      style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}
                    >
                      {invoiceId}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Invoice Date :</Text>
                    <Text
                      style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}
                    >
                      {appTimezone?.utc_offset
                        ? formatDateInTimezone(new Date(), appTimezone, "DD/MM/YYYY")
                        : new Date().toLocaleDateString("en-GB")}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Vehicle No :</Text>
                    <Text
                      style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}
                    >
                      {vehicleId}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={{ fontWeight: "bold" }}>Vehicle Kms :</Text>
                    <Text
                      style={{ fontFamily: "Helvetica-Bold", marginLeft: 5 }}
                    >
                      {km}
                    </Text>
                  </View>
                </View>

                {/* Third Column - Next Service */}
                <View style={{ width: "33%" }}>
                  <Text style={{ fontWeight: "bold" }}>Next Service:</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold" }}>
                    {km ? km + 10000 : "N/A"} KM /{" "}
                    {formatWallDatePlusMonths(appTimezone, new Date(), 6, "DD/MM/YYYY")}
                  </Text>
                </View>
              </View>

              {/* GST Information if available */}
              {customer.gst_number && (
                <View
                  style={{
                    padding: 1,
                    width: "30%",
                    marginTop: 5,
                  }}
                >
                  <Text>GSTIN: {customer.gst_number || "N/A"}</Text>
                </View>
              )}

              {/* Items Table */}
              <View
                style={{ border: "1px solid #000", marginBottom: 10, flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    borderBottom: "1px solid #000",
                    backgroundColor: "#f0f0f0",
                    padding: 5,
                  }}
                >
                  <Text style={{ width: "10%", textAlign: "left" }}>S.No</Text>
                  <Text style={{ width: "40%", textAlign: "left" }}>
                    Particulars
                  </Text>
                  <Text style={{ width: "10%", textAlign: "center" }}>Qty</Text>
                  {/* {services[0].uom ? (
                    <Text style={{ width: "10%", textAlign: "center" }}>
                      UOM
                    </Text>
                  ) : null} */}
                  <Text style={{ width: "10%", textAlign: "right" }}>Rate</Text>
                  {/* {customer.gst_number ? ( */}
                  <Text style={{ width: "10%", textAlign: "right" }}>GST%</Text>
                  {/* ) : null} */}
                  <Text style={{ width: "20%", textAlign: "right" }}>
                    Amount
                  </Text>
                </View>

                {/* Render items for the current page */}
                {services
                  .slice(
                    pageIndex * itemsPerPage,
                    (pageIndex + 1) * itemsPerPage
                  )
                  .map((service, index) => (
                    <View
                      key={index}
                      style={{ flexDirection: "row", padding: 1 }}
                    >
                      <Text style={{ width: "10%", textAlign: "center" }}>
                        {index + 1 + pageIndex * itemsPerPage}
                      </Text>
                      <Text
                        style={{ width: "40%", textAlign: "left" }}
                      >{`${service.items_required
                        .map((item) => item.item_name)
                        .join(", ")} - ${service.service_description}`}</Text>
                      <Text style={{ width: "10%", textAlign: "center" }}>
                        {service.items_required.reduce(
                          (total, item) =>
                            total + parseFloat(item.qty || 0).toFixed(1),
                          0
                        )}
                      </Text>
                      {/* {services[0].uom ? (
                        <Text style={{ width: "10%", textAlign: "center" }}>
                          {services[0].uom || "N/A"}
                        </Text>
                      ) : null} */}
                      <Text style={{ width: "10%", textAlign: "right" }}>
                        {parseFloat(service.price || 0).toFixed(2)}
                      </Text>
                      {/* {customer.gst_number ? ( */}
                      <Text style={{ width: "10%", textAlign: "right" }}>
                        {service.items_required[0]?.tax || "N/A"}%
                      </Text>
                      {/* ) : null} */}
                      <Text style={{ width: "20%", textAlign: "right" }}>
                        {service.items_required
                          .reduce(
                            (total, item) =>
                              total +
                              parseFloat(item.qty || 0) *
                                parseFloat(service.price || 0),
                            0
                          )
                          .toFixed(2)}
                      </Text>
                    </View>
                  ))}
              </View>

              {/* Only add the footer on the last page */}
              {pageIndex === totalPages - 1 && (
                <>
                  {/* Total Section */}
                  <View
                    style={{
                      flexDirection: "row",
                      borderTop: "1px solid #000",
                      padding: 2,
                    }}
                  >
                    <View style={{ width: "80%", fontWeight: "bold" }}>
                      <Text style={{ textAlign: "left", fontSize: 8 }}>
                        Amount in Words :{" "}
                      </Text>
                      <Text style={{ textAlign: "left", fontSize: 10 }}>
                        {"Rupees " + amountInWords(grandTotal) + " Only."}
                      </Text>
                    </View>
                    <Text
                      style={{
                        width: "80%",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      Total :{" "}
                      {"Rs." +
                        (grandTotal - totalTax.toFixed(2)).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                    </Text>
                  </View>

                  {/* New Totals Section */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text
                      style={{
                        width: "80%",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      GST Total: {"Rs." + totalTax.toFixed(2)}
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Text
                      style={{
                        width: "80%",
                        textAlign: "right",
                        fontWeight: "bold",
                        fontSize: 12,
                      }}
                    >
                      Overall Total:{" "}
                      {"Rs." +
                        grandTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </Text>
                  </View>

                  {/* Footer Section */}
                  <View
                    style={{
                      borderTop: "1px solid #000",
                      paddingTop: 10,
                      backgroundColor: "#f0f0f0",
                      padding: 10,
                      marginTop: "auto",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginBottom: 10,
                      }}
                    >
                      <View style={{ width: "50%" }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            marginBottom: 5,
                            fontStyle: "underline",
                          }}
                        >
                          Bank Details:
                        </Text>
                        <Text style={{ fontWeight: "bold" }}>
                          ARG's 7 Cars & Sree Jaya Finserve
                        </Text>
                        {companyDetails && companyDetails.length > 0 && (
                          <>
                            <Text>{companyDetails[0].bank_name || ""}</Text>
                            <Text>
                              Account No: {companyDetails[0].account_no || ""}
                            </Text>
                            <Text>
                              IFSC Code: {companyDetails[0].ifsc_code || ""}
                            </Text>
                            <Text>
                              GPay: {companyDetails[0].gpay_number || ""}
                            </Text>
                          </>
                        )}
                      </View>
                      {/* {customer.gst_number && (
                        <>
                          <View
                            style={{
                              width: "1px",
                              height: "100%",
                              backgroundColor: "#000",
                              marginLeft: 10,
                              marginRight: 10,
                            }}
                          ></View>
                          <View
                            style={{
                              width: "45%",
                              border: "1px solid #000",
                              padding: 5,
                            }}
                          >
                            <Text
                              style={{ fontWeight: "bold", marginBottom: 5 }}
                            >
                              Tax Details:
                            </Text>
                            <Text>Value: {taxDetails.value.toFixed(2)}</Text>
                            <Text>CGST: {taxDetails.cgst.toFixed(2)}</Text>
                            <Text>SGST: {taxDetails.sgst.toFixed(2)}</Text>
                            <Text>
                              Total Tax: {taxDetails.totalTax.toFixed(2)}
                            </Text>
                          </View>
                        </>
                      )} */}

                      <>
                        <View
                          style={{
                            width: "1px",
                            height: "100%",
                            backgroundColor: "#000",
                            marginLeft: 10,
                            marginRight: 10,
                          }}
                        ></View>
                        <View
                          style={{
                            width: "45%",
                            border: "1px solid #000",
                            padding: 5,
                          }}
                        >
                          <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                            Tax Details:
                          </Text>
                          <Text>
                            Value:{" "}
                            {"Rs." +
                              (grandTotal - totalTax.toFixed(2)).toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                          </Text>
                          <Text>CGST: {"Rs." + (totalTax / 2).toFixed(2)}</Text>
                          <Text>SGST: {"Rs." + (totalTax / 2).toFixed(2)}</Text>
                          <Text>
                            Total Tax:{" "}
                            {"Rs." +
                              grandTotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                          </Text>
                        </View>
                      </>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "flex-begin",
                          alignItems: "left",
                        }}
                      >
                        <PDFImage
                          src={qrCodeDataUrl}
                          style={{ width: 70, height: 70 }}
                        />
                      </View>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 10,
                      }}
                    >
                      <View style={{ width: "50%", textAlign: "left" }}>
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                          Our Services:
                        </Text>
                        <Text>
                          {companyDetails && companyDetails.length > 0
                            ? companyDetails[0].services
                            : "Multi Brand Car Service & Accessories"}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: "50%",
                          textAlign: "right",
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                          For ARG's 7 Cars
                        </Text>
                        <Text style={{ marginBottom: 5, paddingTop: 50 }}>
                          Authorized Signature
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginTop: "auto",
                    }}
                  >
                    <View style={{ width: "100%" }}>
                      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                        Subsidiary:
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        width: "50%",
                        marginLeft: 0,
                        position: "static",
                      }}
                    >
                      {/* <Image
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      /> */}
                      {/* Footer Section */}
                      {pageIndex === totalPages - 1 && (
                        <PDFImage
                          src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_footer/${pdfFooterImage}`}
                          style={{
                            width: 550,
                            height: 100,
                          }}
                        />
                      )}
                    </View>
                    <View
                      style={{
                        width: "50%",
                        marginLeft: 50,
                        position: "static",
                      }}
                    >
                      {/* <Image
                        src="/icons/ARG_s 7Fitness2.jpg"
                        style={{ height: 50, width: 250 }}
                      /> */}
                    </View>
                  </View>
                </>
              )}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text>Date: {formatDate(printDate)}</Text>
                <Text>Printed By: {printedBy}</Text>
                <Text>Print Type: Reprint</Text>
              </View>
            </Page>
          ))}
        </Document>
      );
    };

    //
    const pdfBlob = await pdf(<InvoiceDocument />).toBlob();
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    const Timestamp = new Date().getTime();
    link.download = `Invoice_${appointmentId}_${Timestamp}.pdf`;
    link.click();
    return pdfBlob;
  };

  // Add this before the return statement
  const renderActionButtons = () => {
    const status = appointmentStatus.toLowerCase();

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 2,
          marginRight: 2,
        }}
      >
        {/* Estimate Print - Show for all statuses */}
        <Button
          variant="contained"
          onClick={handleEstimatePrint}
          sx={{ display: !isCounterSales ? "block" : "none" }}
        >
          Estimate Print
        </Button>

        {/* Delivery Print - Show for inspection and invoice/invoiced status */}
        {(appointmentStatus === "invoice" ||
          appointmentStatus === "invoiced") && (
          <Button
            variant="contained"
            onClick={deliverChallanClick}
            sx={{ display: !isCounterSales ? "block" : "none" }}
          >
            Delivery Print
          </Button>
        )}

        {/* Invoice Print - Show only for invoice/invoiced status */}
        {(appointmentStatus === "invoice" ||
          appointmentStatus === "invoiced") && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={async () => {
              await handleInvoicePrints();
            }}
            // disabled={!estimateItems.some((item) => item.price > 0)}
          >
            Invoice Print
          </Button>
        )}
      </Box>
    );
  };
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
      {/* <Navbar pageName={`Job Card No - ${appointmentId}`} /> */}
      {pageType !== "tab" && (
        <Navbar pageName={`Job Card No - ${appointmentId}`} />
      )}
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
            onClose={() => handleCloseSnackbar(setOpenSnackbar)}
          >
            <MuiAlert
              onClose={() => handleCloseSnackbar(setOpenSnackbar)}
              severity={snackBarSeverity}
              sx={{ width: "100%" }}
            >
              {snackbarMessage}
            </MuiAlert>
          </Snackbar>
          {customer && (
            <Box display="flex" flexDirection="column" gap={3}>
              {/* Add the buttons right after the customer info card */}
              {renderActionButtons()}

              {/* Customer Information and Address Card */}
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  marginBottom: 3,
                  paddingBottom: 2,
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  padding: 2,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(1px)",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    paddingBottom: 16,
                    width: "100%",
                  }}
                >
                  {/* <BackButton />
                  <Typography variant="h6" style={{ marginLeft: "8px" }}>
                    Appointment No: {appointmentId}
                  </Typography> */}
                </div>

                {/* Customer Information and Vehicle Information in Parallel Batches */}
                <div
                   style={{
    display: "flex",
    width: "100%",
    flexWrap: "wrap",
    gap: "16px",
  }}
                >
                  {/* First Batch: Customer Name & Phone */}
                  <div style={{ flex: "1 1 30%", minWidth: "250px" }}>
                  <Typography variant="body1" sx={{ marginBottom: 1 }}>
  <strong>Customer Name: </strong>

  <Tooltip title={`${customer?.prefix || ''} ${customer?.customer_name || ''}`}>
    <span>
      {customer?.prefix} {customer?.customer_name?.slice(0, 15)}
    </span>
  </Tooltip>
</Typography>

                    <Typography variant="body2" sx={{ marginBottom: 1 }}>
                      <strong>Phone: </strong>
                      <a href={`tel://${customer.contact.phone}`}>
                        {customer.contact.phone}
                      </a>
                    </Typography>
                  </div>

                  {/* Second Batch: Email & Address */}
                  <div style={{ flex: "1 1 30%", minWidth: "250px",overflow:"auto"}}>
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

                  {/* Third Batch: Vehicle Information (displayed as text) */}
                  <div style={{ flex: "1 1 30%", minWidth: "250px" }}>
                    {customer.vehicles
                      .filter((vehicle) => vehicle.vehicle_id === vehicleId) // Filter the vehicles by vehicleId
                      .map((vehicle, index) => (
                        <div key={index} style={{ marginBottom: 16 }}>
                          {/* Vehicle Year and Make */}
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: "bold", color: "#333" }}
                          >
                            {`${vehicle.make}`}
                          </Typography>

                          {/* Vehicle Model */}
                          <Typography variant="body2" sx={{ color: "#555" }}>
                            <strong>Model:</strong> {vehicle.model}
                          </Typography>

                          {/* Vehicle Plate Number */}
                          <Typography variant="body2" sx={{ color: "#888" }}>
                            <strong>Plate Number:</strong>{" "}
                            {vehicle.vehicle_id || "N/A"}
                          </Typography>
                        </div>
                      ))}
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "#555", marginRight: "8px" }}
                      >
                        <strong>KMs: {km}km</strong>
                      </Typography>
                    </div>
                  </div>
                </div>
              </Paper>

              {/* Job Card Creation with Vehicle Details */}
              <Paper
                elevation={1}
                sx={{
                  padding: 1,
                  borderRadius: 2,
                  marginBottom: 3,
                  marginTop: -5,
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(1px)",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="h6" gutterBottom>
                    Job Details
                  </Typography>
                </div>
                <Divider sx={{ marginBottom: 2 }} />

                {isMobileView ? (
                  // Mobile view with cards
                  <Box>
                    {services.map((service, index) => (
                      <Paper
                        key={index}
                        sx={{
                          marginBottom: 2,
                          padding: 2,
                          backgroundColor: "white",
                          borderRadius: 2,
                        }}
                      >
                        {!showDetails[index] ? (
                          // Summary view
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                paddingBottom: 1,
                              }}
                            >
                              <Box>
                                {/* <Typography variant="subtitle1">
                                  <b>Type:</b> {service.service_type}
                                </Typography> */}
                                <Typography>
                                  <b>Spare List:</b>{" "}
                                  {service.items_required[0]?.item_name}
                                </Typography>
                                <Typography>
                                  <b>Reported Issue:</b>{" "}
                                  {service.service_description}
                                </Typography>
                              </Box>
                              <Box>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  {service.service_status === "Completed" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "green" }}
                                    />
                                  ) : service.service_status ===
                                    "In Progress" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "orange" }}
                                    />
                                  ) : (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "maroon" }}
                                    />
                                  )}
                                  <Typography>
                                    {service.service_status}
                                  </Typography>
                                </div>
                              </Box>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => toggleDetails(index)}
                              sx={{ mt: 1 }}
                            >
                              More Details
                            </Button>
                          </Box>
                        ) : (
                          // Details view
                          <Box>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              {/* <Typography>
                                <b>Type:</b> {service.service_type}
                              </Typography> */}
                              <Typography>
                                <b>Spare List:</b>{" "}
                                {service.items_required[0]?.item_name}
                              </Typography>
                              <Typography>
                                <b>Reported Issue:</b>{" "}
                                {service.service_description}
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Typography>
                                  <b>Status:</b>
                                </Typography>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  {service.service_status === "Completed" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "green" }}
                                    />
                                  ) : service.service_status ===
                                    "In Progress" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "orange" }}
                                    />
                                  ) : (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "maroon" }}
                                    />
                                  )}
                                  <Typography>
                                    {service.service_status}
                                  </Typography>
                                </div>
                              </Box>
                              <Typography>
                                <b>Comments:</b>{" "}
                                {service.comments
                                  ? JSON.parse(service.comments)[0].comments
                                  : ""}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => toggleDetails(index)}
                              sx={{ mt: 1 }}
                            >
                              Hide Details
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  // Desktop view with table
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {/* <TableCell align="center" sx={{ minWidth: "100px" }}>
                            Type
                          </TableCell> */}
                          <TableCell align="Left" sx={{ minWidth: "180px" }}>
                            Reported Issue
                          </TableCell>
                          <TableCell align="left" sx={{ minWidth: "180px" }}>
                            Spare List
                          </TableCell>

                          <TableCell align="center" sx={{ minWidth: "100px" }}>
                            Status
                          </TableCell>

                          <TableCell align="center" sx={{ minWidth: "250px" }}>
                            Comments
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {services.map((service, index) => {
                          return (
                            <TableRow key={index}>
                              <TableCell
                                align="left"
                                sx={{ minWidth: "250px" }}
                              >
                                <Typography>
                                  {service.service_description}
                                </Typography>
                              </TableCell>
                              {/* <TableCell align="center" sx={{ minWidth: "70px" }}>
                                <Typography>{service.service_type}</Typography>
                              </TableCell> */}
                              <TableCell
                                align="left"
                                sx={{ minWidth: "250px" }}
                              >
                                <Typography>
                                  {service.items_required[0]?.item_name}
                                </Typography>
                              </TableCell>

                              <TableCell align="center">
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 5,
                                  }}
                                >
                                  {" "}
                                  {service.service_status == "Completed" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "green" }}
                                    />
                                  ) : service.service_status ==
                                    "In Progress" ? (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "orange" }}
                                    />
                                  ) : (
                                    <CircleIcon
                                      sx={{ fontSize: "12px", color: "maroon" }}
                                    />
                                  )}
                                  <Typography>
                                    {service.service_status}
                                  </Typography>
                                </div>
                              </TableCell>

                              <TableCell align="center">
                                {/* //! add appropriate query */}
                                <Typography>
                                  {safeParseComments(service.comments).map((item, index) => (
  <span key={index}>
    {item.comments}
  </span>
))}

                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Box>
          )}

          {/* Chat Box */}
          <LiveChat room={appointmentId} />
        </Box>
      </Box>
    </div>
  );
}
