"use client";
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  Button,
  Snackbar,
  Alert,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Checkbox, FormControlLabel } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CancelIcon from "@mui/icons-material/Cancel";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CompanyDetails() {
  const [allCompanies, setAllCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [showList, setShowList] = useState(true);

  const [bgimage, setBgImage] = useState("");
  const [logo, setLogo] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyGST, setCompanyGST] = useState("");
  const [companyUPI, setCompanyUPI] = useState("");
  const [companyPhoneNumber, setCompanyPhoneNumber] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState([]);
  const [compressedBgImage, setCompressedBgImage] = useState("");
  const [compressedLogo, setCompressedLogo] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [id, setId] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [companyprconfig, setCompanyPrConfig] = useState("");
    const [whatsapp, setwhatsapp] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [logos, setLogos] = useState([]);
  const [bgImages, setBgImages] = useState([]);
  const [newLogos, setNewLogos] = useState([]);
  const [newBgImages, setNewBgImages] = useState([]);
  const [checked, setChecked] = useState(false);
  const [goodsReceiptEnabled, setGoodsReceiptEnabled] = useState(0);
  const [bankName, setBankName] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [gpayNumber, setGpayNumber] = useState("");
  const [services, setServices] = useState("");
  const [newSubsidiaryImages, setNewSubsidiaryImages] = useState([]);
  const [pdfHeaderImage, setPdfHeaderImage] = useState("");
  const [pdfFooterImage, setPdfFooterImage] = useState("");
  const [newPdfHeaderImage, setNewPdfHeaderImage] = useState([]);
  const [newPdfFooterImage, setNewPdfFooterImage] = useState([]);
  const [fetchLimit, setFetchLimit] = useState([])
  const [fetchpage, setFetchpage] = useState("")
  const [companyStreet, setCompanyStreet] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyPincode, setCompanyPincode] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const handleChange = (event) => {
    setChecked(event.target.checked);
  };

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  const fetchAllCompanies = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`);
      const data = await response.json();
      const companies = data.company_details || [];
      setAllCompanies(companies);
      if (companies.length > 0 && !selectedCompanyId) {
        loadCompanyDetails(companies[0]);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const loadCompanyDetails = (company) => {
    setSelectedCompanyId(company.id);
    setData(company);
    setId(company.id);
    setCompanyCode(company.company_code || "");
    setCompanyName(company.company_name || "");
    setCompanyGST(company.company_gst || "");
    setCompanyPhoneNumber(company.company_phone_number || "");
    setCompanyUPI(company.company_upi || "");
    setCompanyPrConfig(company.pr_limit_config || "");
    setwhatsapp(company.whatsapp || "");
    setBgImage(company.background_image || "");
    setLogo(company.logo || "");
    setGoodsReceiptEnabled(company.goods_receipt ? 1 : 0);
    setFetchLimit(company.fetch_limit || "");
    setFetchpage(company.page_type || "");
    setBankName(company.bank_name || "");
    setAccountNo(company.account_no || "");
    setIfscCode(company.ifsc_code || "");
    setGpayNumber(company.gpay_number || "");
    setServices(company.services || "");
    setPdfHeaderImage(company.pdf_header || "");
    setPdfFooterImage(company.pdf_footer || "");
    setCompanyStreet(company.company_street || "");
    setCompanyCity(company.company_city || "");
    setCompanyState(company.company_state || "");
    setCompanyPincode(company.company_pincode || "");
    setShowList(false);
    setIsEditing(false);
  };

  const handleNewCompany = () => {
    setId("");
    setCompanyCode("");
    setCompanyName("");
    setCompanyGST("");
    setCompanyPhoneNumber("");
    setCompanyUPI("");
    setCompanyPrConfig("");
    setwhatsapp("");
    setBgImage("");
    setLogo("");
    setGoodsReceiptEnabled(0);
    setFetchLimit("");
    setFetchpage("");
    setBankName("");
    setAccountNo("");
    setIfscCode("");
    setGpayNumber("");
    setServices("");
    setPdfHeaderImage("");
    setPdfFooterImage("");
    setCompanyStreet("");
    setCompanyCity("");
    setCompanyState("");
    setCompanyPincode("");
    setIsCreating(true);
    setIsEditing(true);
    setShowList(false);
  };

  const handleDeleteClick = (companyId) => {
    setDeleteCompanyId(companyId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    // Note: Implement delete on backend if needed
    setDeleteDialogOpen(false);
    setShowList(true);
    fetchAllCompanies();
  };

  const handleFileChange = (event, setFiles, setNewFiles) => {
    const files = Array.from(event.target.files);
    setFiles(files);
    setNewFiles(files);
  };

  // const compressImage = (base64, newWidth, newHeight, setImage) => {
  //   const img = new Image();
  //   img.src = base64;
  //   img.onload = () => {
  //     const canvas = document.createElement("canvas");
  //     canvas.width = newWidth;
  //     canvas.height = newHeight;
  //     const ctx = canvas.getContext("2d");
  //     ctx.drawImage(img, 0, 0, newWidth, newHeight);
  //     const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);
  //     setImage(resizedBase64);
  //   };
  //   img.onerror = (error) => {
  //     // console.log("Image load error:", error);
  //   };
  // };

  const handleEditClick = () => {
    setIsEditing(true);
    setIsCreating(false);

    if (bgimage && !compressedBgImage) {
      setCompressedBgImage(bgimage);
    }
    if (logo && !compressedLogo) {
      setCompressedLogo(logo);
    }
  };

  const handleCreateClick = () => {
    setIsEditing(true);
    setIsCreating(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("company_code", companyCode);
    formData.append("company_name", companyName);
    formData.append("company_gst", companyGST);
    formData.append("company_upi", companyUPI);
    formData.append("pr_limit_config", companyprconfig);
    formData.append("company_phone_number", companyPhoneNumber);
    formData.append("goods_receipt", goodsReceiptEnabled);
    formData.append("bank_name", bankName);
    formData.append("account_no", accountNo);
    formData.append("ifsc_code", ifscCode);
    formData.append("gpay_number", gpayNumber);
    formData.append("services", services);
    formData.append("fetch_limit", fetchLimit);
    formData.append("page_type", fetchpage);
    formData.append("company_street", companyStreet);
    formData.append("company_city", companyCity);
    formData.append("company_state", companyState);
    formData.append("company_pincode", companyPincode);
formData.append("whatsapp", whatsapp);
    if (newLogos.length > 0) {
      for (const logo of newLogos) {
        formData.append("logo", logo);
      }
    }

    if (newBgImages.length > 0) {
      for (const bgImage of newBgImages) {
        formData.append("background", bgImage);
      }
    }

    if (newPdfHeaderImage.length > 0) {
      formData.append("pdf_header", newPdfHeaderImage[0]);
    }

    if (newPdfFooterImage.length > 0) {
      formData.append("pdf_footer", newPdfFooterImage[0]);
    }

    // if (newSubsidiaryImages.length > 0) {
    //   for (const subsidiaryImg of newSubsidiaryImages) {
    //     formData.append("subsidiary", subsidiaryImg);
    //   }
    // }
    console.log(formData);
    console.log(newPdfHeaderImage);
    console.log(newPdfFooterImage);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/company/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const responseData = await response.json();
      setSnackbarMessage("Company details updated successfully!");
      setSnackbarOpen(true);
      setIsEditing(false);
      setTimeout(() => {
        setShowList(true);
        fetchAllCompanies();
      }, 1500);
    } catch (error) {
      console.error("Error updating company details:", error);
      setSnackbarMessage("Error updating company details");
      setSnackbarOpen(true);
    }
  };

  const handleRemoveImage = (setImage) => {
    setImage("");
  };


  const pageTypes = [
  { label: "Tab", value: "tab" },
  { label: "Tiles", value: "tiles" },
];


  const isEmpty =
    !companyCode && !companyName && !companyGST && !companyPhoneNumber;

  return (
    <div>
      {showList ? (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                Company Details - All Companies
              </Typography>
            </Box>
            <Tooltip title="Add New Company">
              <IconButton
                variant="contained"
                onClick={handleNewCompany}
                sx={{ height: "40px", backgroundColor: "pink" }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Company Code</TableCell>
                  <TableCell>Company Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>{company.company_code || "-"}</TableCell>
                    <TableCell>{company.company_name || "-"}</TableCell>
                    <TableCell>{company.company_phone_number || "-"}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => loadCompanyDetails(company)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(company.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <>
          <Box sx={{ display: "flex", justifyContent: "space-between", p: 2 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{ mb: 3, fontSize: { xs: "1.5rem", md: "2rem" } }}
              >
                {isCreating ? "Create New Company" : "Edit Company"}
              </Typography>
            </Box>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <Tooltip title="Back to List">
                <IconButton
                  variant="contained"
                  onClick={() => {
                    setShowList(true);
                    setIsEditing(false);
                  }}
                  sx={{ height: "40px", backgroundColor: "lightgray" }}
                >
                  <CancelIcon />
                </IconButton>
              </Tooltip>

              {!isEditing ? (
                <Tooltip title="Edit Company details">
                  <IconButton
                    variant="contained"
                    onClick={handleEditClick}
                    sx={{ height: "40px", backgroundColor: "pink" }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Submit">
                  <IconButton
                    variant="contained"
                    sx={{ height: "40px", backgroundColor: "pink" }}
                    onClick={handleSubmit}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          </Box>
        </>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Company Code"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyCode}
          onChange={(e) => setCompanyCode(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="Company Name"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={!isEditing}
        />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Company GST"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyGST}
          onChange={(e) => setCompanyGST(e.target.value)}
          disabled={!isEditing}
        />
        {/* company UPI */}
        <TextField
          label="Company UPI"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyUPI}
          onChange={(e) => setCompanyUPI(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="Company Phone Number"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyPhoneNumber}
          onChange={(e) => setCompanyPhoneNumber(e.target.value)}
          disabled={!isEditing}
        />
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={companyprconfig === "true"}
              onChange={(e) =>
                setCompanyPrConfig(e.target.checked ? "true" : "false")
              }
              color="primary"
              disabled={!isEditing}
            />
          }
          label="Disable Purchase Processing"
        />
        {checked && <p>You have accepted the Disable Purchase Processing.</p>}
      </Box>


 <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={whatsapp === "true"}
              onChange={(e) =>
                setwhatsapp(e.target.checked ? "true" : "false")
              }
              color="primary"
              disabled={!isEditing}
            />
          }
          label="Whapp Processing"
        />
        {checked && <p>You have accepted the Disable Purchase Processing.</p>}
      </Box>




      
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={goodsReceiptEnabled === 1}
              onChange={(e) => setGoodsReceiptEnabled(e.target.checked ? 1 : 0)}
              color="primary"
              disabled={!isEditing}
            />
          }
          label="Enable Goods Receipt"
        />
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Enter Number"
          variant="outlined"
          type="number"
          inputProps={{ min: 0 }} // Optional: Set min value if needed
          value={fetchLimit}
          onChange={(e) => setFetchLimit(e.target.value)}
          disabled={!isEditing}
        />

      </Box>
      

    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
  <FormControl sx={{ minWidth: 200 }} disabled={!isEditing}>
    <InputLabel id="page-type-label">Select page type</InputLabel>
    <Select
      labelId="page-type-label"
      id="page-type-select"
      value={fetchpage}
      onChange={(e) => setFetchpage(e.target.value)}
      label="Select page type"
      displayEmpty
    >
      <MenuItem value="">
        <em>Select page</em>
      </MenuItem>
      {pageTypes.map((type) => (
        <MenuItem key={type.value} value={type.value}>
          {type.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
</Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <Box
          sx={{
            flex: 1,
            border: "1px dashed #ccc",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <label
            htmlFor="bg-file-input"
            style={{ display: "block", height: "90%", width: "100%" }}
          >
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  handleFileChange(e, setBgImages, setNewBgImages)
                }
                style={{ display: "none" }}
                id="bg-file-input"
              />
            )}
            {newBgImages.length > 0 ? (
              newBgImages.map((bgImage, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(bgImage)}
                  alt="Selected Background"
                  style={{ width: "100%", height: "90%", objectFit: "contain" }}
                />
              ))
            ) : bgimage ? (
              <>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgimage}`}
                  alt="Selected Background"
                  style={{ width: "100%", height: "90%", objectFit: "contain" }}
                />
                {isEditing && (
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={() => handleRemoveImage(setBgImage)}
                  >
                    Remove Image
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="body1" sx={{ textAlign: "center" }}>
                Select Background Image
              </Typography>
            )}
          </label>
        </Box>
        <Box
          sx={{
            flex: 1,
            border: "1px dashed #ccc",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            height: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <label
            htmlFor="logo-file-input"
            style={{ display: "block", height: "90%", width: "100%" }}
          >
            {isEditing && (
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, setLogos, setNewLogos)}
                style={{ display: "none" }}
                id="logo-file-input"
              />
            )}
            {newLogos.length > 0 ? (
              newLogos.map((logo, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(logo)}
                  alt="Selected Logo"
                  style={{ width: "100%", height: "90%", objectFit: "contain" }}
                />
              ))
            ) : logo ? (
              <>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${logo}`}
                  alt="Selected Logo"
                  style={{ width: "100%", height: "90%", objectFit: "contain" }}
                />
                {isEditing && (
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={() => handleRemoveImage(setLogo)}
                  >
                    Remove Image
                  </Button>
                )}
              </>
            ) : (
              <Typography variant="body1" sx={{ textAlign: "center" }}>
                Select Logo
              </Typography>
            )}
          </label>
        </Box>
      </Box>
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Bank Details</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Bank Name"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="Account Number"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={accountNo}
          onChange={(e) => setAccountNo(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="IFSC Code"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={ifscCode}
          onChange={(e) => setIfscCode(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="GPay Number"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={gpayNumber}
          onChange={(e) => setGpayNumber(e.target.value)}
          disabled={!isEditing}
        />
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Services</Typography>
      <TextField
        label="Our Services"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        margin="normal"
        value={services}
        onChange={(e) => setServices(e.target.value)}
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>PDF Header Image</Typography>
      <Box
        sx={{
          border: "1px dashed #ccc",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          height: "200px",
          mb: 2
        }}
      >
        <label htmlFor="pdf-header-file-input" style={{ display: "block", height: "100%" }}>
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setPdfHeaderImage, setNewPdfHeaderImage)}
              style={{ display: "none" }}
              id="pdf-header-file-input"
            />
          )}
          {newPdfHeaderImage.length > 0 ? (
            <img
              src={URL.createObjectURL(newPdfHeaderImage[0])}
              alt="PDF Header"
              style={{ height: "100%", objectFit: "contain" }}
            />
          ) : pdfHeaderImage ? (
            <>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_header/${pdfHeaderImage}`}
                alt="PDF Header"
                style={{ height: "100%", objectFit: "contain" }}
              />
              {isEditing && (
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => handleRemoveImage(setPdfHeaderImage)}
                >
                  Remove Image
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body1">Select PDF Header Image</Typography>
          )}
        </label>
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>PDF Footer Image</Typography>
      <Box
        sx={{
          border: "1px dashed #ccc",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          height: "200px",
          mb: 2
        }}
      >
        <label htmlFor="pdf-footer-file-input" style={{ display: "block", height: "100%" }}>
          {isEditing && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setPdfFooterImage, setNewPdfFooterImage)}
              style={{ display: "none" }}
              id="pdf-footer-file-input"
            />
          )}
          {newPdfFooterImage.length > 0 ? (
            <img
              src={URL.createObjectURL(newPdfFooterImage[0])}
              alt="PDF Footer"
              style={{ height: "100%", objectFit: "contain" }}
            />
          ) : pdfFooterImage ? (
            <>
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/pdf_footer/${pdfFooterImage}`}
                alt="PDF Footer"
                style={{ height: "100%", objectFit: "contain" }}
              />
              {isEditing && (
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => handleRemoveImage(setPdfFooterImage)}
                >
                  Remove Image
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body1">Select PDF Footer Image</Typography>
          )}
        </label>
      </Box>

      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Company Address</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <TextField
          label="Street"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyStreet}
          onChange={(e) => setCompanyStreet(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="City"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyCity}
          onChange={(e) => setCompanyCity(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="State"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyState}
          onChange={(e) => setCompanyState(e.target.value)}
          disabled={!isEditing}
        />
        <TextField
          label="Pincode"
          variant="outlined"
          fullWidth
          margin="normal"
          sx={{ flex: 1 }}
          value={companyPincode}
          onChange={(e) => setCompanyPincode(e.target.value)}
          disabled={!isEditing}
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
