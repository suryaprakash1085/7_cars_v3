import * as XLSX from "xlsx";

const searchSupplier = async (
  token,
  searchText,
  entries,
  setFilteredEntries,
  setOpenSnackbar,
  setSnackbarMessage,
  setSnackbarSeverity
) => {
  try {
    // Make the backend API call to search customers
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/supplier/search?search=${searchText}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    // console.log({ filetredData: result });

    if (!response.ok) {
      setOpenSnackbar(true);
      setSnackbarMessage(result.error);
      setSnackbarSeverity("error");
    }

    let data = result?.map((item) => ({
      supplier_id: item.supplier_id,
      name: item.name,
      gst_number: item.gst_number,
      contact: {
        email: item.email,
        phone: item.phone,
        address: {
          street: item.street,
          city: item.city,
          state: item.state,
          zip: item.zip,
        },
      },
    }));

    setFilteredEntries(data);
  } catch (error) {
    console.log(error);
    // setOpenSnackbar(true);
    // setSnackbarMessage("Error fetching search results. Please try again.");
    // setSnackbarSeverity("error");
    return entries; // Return existing rows if the fetch fails
  }
};

const downloadFailedDataAsExcel = (failedSuppliers = []) => {
  const workbook = XLSX.utils.book_new();

  if (failedSuppliers.length > 0) {
    const customerSheet = XLSX.utils.json_to_sheet(failedSuppliers);
    XLSX.utils.book_append_sheet(workbook, customerSheet, "Failed Customers");
  }

  // Create and trigger the file download
  XLSX.writeFile(workbook, "failed_uploads.xlsx");
};

const handleBulkUpload = async (
  event,
  token,
  setSnackbarMessage,
  setSnackbarSeverity,
  setOpenSnackbar,
  setIsLoading
) => {
  const file = event.target.files[0];
  if (
    !file ||
    file.type !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    alert("Please upload a valid Excel file.");
    return;
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const suppliers = XLSX.utils.sheet_to_json(
    workbook.Sheets[workbook.SheetNames[0]]
  );

  setIsLoading(true);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/supplier/bulkUpload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ suppliers }),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      setIsLoading(false);
      const errorMessages =
        result.details || "An error occurred while processing suppliers.";
      setSnackbarMessage(errorMessages);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(false);

    downloadFailedDataAsExcel(result.summary.failedSuppliers);
    // Success message with summary
    const { success, failed, duplicatePhone, duplicateGst } = result.summary;
    setSnackbarMessage(
      `${success} completed, ${failed} failed, ${duplicatePhone} duplicate phone, ${duplicateGst} duplicate GST`
    );
    setSnackbarSeverity("success");
    setOpenSnackbar(true);
  } catch (error) {
    setIsLoading(false);
    setSnackbarMessage("An unexpected error occurred.");
    setSnackbarSeverity("error");
    setOpenSnackbar(true);
  }
};
export { searchSupplier, handleBulkUpload };
