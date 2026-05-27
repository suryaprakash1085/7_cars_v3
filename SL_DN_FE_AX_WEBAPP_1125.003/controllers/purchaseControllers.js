import {
  checkWhatsappLoggedIn,
  sendWhatsappMessage,
} from "@/components/whatsapp";
import { Cookie } from "@mui/icons-material";
import axios from "axios";
import Cookies from "js-cookie";
const fetchData = async (token, setPrList, setSelectedPR, slcdPr, currentSelectedPR = null) => {
  if (!token) {
    throw new Error("No token found. Please log in.");
  }

  // If a specific PR is requested, fetch only that PR from the optimized endpoint
  if (currentSelectedPR && currentSelectedPR.pr_no) {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/single/${currentSelectedPR.pr_no}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.status === 404) {
          console.warn(`PR ${currentSelectedPR.pr_no} not found`);
          throw new Error("PR not found");
        }
        return response.json();
      })
      .then((data) => {
        // Set both list and selected PR to show this single PR
        setPrList([data]);
        setSelectedPR(data);
      })
      .catch((error) => {
        // console.log("Error fetching specific PR:", error);
        // Fallback: Fetch all PRs if specific PR fetch fails
        fetchAllPRs(token, setPrList, setSelectedPR);
      });
  } else {
    // Fetch all PRs if no specific PR is requested
    fetchAllPRs(token, setPrList, setSelectedPR);
  }
};

// Helper function to fetch all PRs
const fetchAllPRs = (token, setPrList, setSelectedPR) => {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/procurement/both`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((data) => {
      setPrList(data);
      if (data.length > 0) {
        // Sort by PR number and select the last (most recent) PR
        const sortedData = [...data].sort((a, b) => {
          const numA = parseInt(a.pr_no.split("-")[1], 10);
          const numB = parseInt(b.pr_no.split("-")[1], 10);
          return numB - numA; // Descending order
        });
        setSelectedPR(sortedData[0]); // Select the highest numbered PR
      }
    })
    .catch((error) => console.log("Error fetching all PRs:", error));
};

const replacePlaceholders = (template, dynamicValues) => {
  return template.replace(
    /{{([^}]+)}}/g,
    (match, p1) => dynamicValues[p1] || match
  );
};

const updatePRItem = async (
  token,
  prNo,
  itemDetails,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity,
  setPrEditModalOpen,
  setUpdateKey
) => {
  const itemId = itemDetails.item_id;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/procurement/updateItem/${prNo}/${itemId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemDetails),
      }
    );
    let result = await response.json();

    if (response.ok) {
      // console.log(itemDetails);
      if (checkWhatsappLoggedIn()) {
        const page = "purchase";
        const templateResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/templates/name/${page}`,
          {
            headers: {
              Authorization: `Bearer ${Cookies.get("token")}`,
              "Content-Type": "application/json",
            },
          }
        );
        const template = templateResponse; // Assuming the template is in the response data
        const fromNumber = Cookies.get("phone");
        const toNumber = itemDetails.supplierNumber;
        const dynamic = {
          product_name: itemDetails.product, // Assuming itemDetails has productName
          supplier_name: itemDetails.supplierName, // Assuming itemDetails has supplierName
          qty: itemDetails.qty, // Assuming itemDetails has quantity
          supplier_number: itemDetails.supplierNumber, // Assuming itemDetails has supplierNumber
        };

        const message = replacePlaceholders(
          template.data.template_message,
          dynamic
        );
        sendWhatsappMessage(fromNumber, toNumber, message, "text");
      }
      setUpdateKey(prevKey => prevKey + 1);
      setSnackbarOpen(true);
      setSnackbarMessage(result.message);
      setSnackbarSeverity("success");
      setPrEditModalOpen(false);
      setTimeout(() => {
        // window.location.reload();
      }, 1000);
    }
  } catch (error) {
    setSnackbarOpen(true);
    setSnackbarMessage("Error updating PR");
    console.log(error);
    setSnackbarSeverity("error");
  }
};

const searchPR = (
  token,
  prList,
  setSelectedPR,
  slcdPr,
  searchQuery,
  setPrList
) => {
  // If search is empty, reset to full list
  if (!searchQuery.trim()) {
    fetchData(token, setPrList, setSelectedPR, slcdPr);
    return;
  }

  const query = searchQuery.trim().toLowerCase();

  // Filter PRs based on search criteria
  const filteredPRs = prList.filter(pr => {
    // Check PR-level fields
    const prFieldsMatch =
      pr.pr_no?.toLowerCase().includes(query) ||
      pr._id?.toLowerCase().includes(query) ||
      pr.referenceName?.toLowerCase().includes(query) ||
      pr.status?.toLowerCase().includes(query) ||
      pr.pr_type?.toLowerCase().includes(query) ||
      pr.notes?.toLowerCase().includes(query) ||
      pr.telecaller?.toLowerCase().includes(query);

    // Check items-level fields
    const itemsMatch = pr.items?.some(item =>
      item.product?.toLowerCase().includes(query) ||
      item.details?.toLowerCase().includes(query) ||
      item.supplierName?.toLowerCase().includes(query) ||
      item.supplierNumber?.toLowerCase().includes(query) ||
      item.item_id?.toLowerCase().includes(query) ||
      String(item.qty)?.includes(query) ||
      String(item.received_qty)?.includes(query) ||
      item.estimatedDelivery?.toLowerCase().includes(query)
    );

    return prFieldsMatch || itemsMatch;
  });

  // Update state
  setPrList(filteredPRs);

  // Select first matching PR if available
  if (filteredPRs.length > 0) {
    setSelectedPR(filteredPRs[0]);
  } else {
    setSelectedPR(null);
  }
};

const deletePRItem = async (
  token,
  prNo,
  itemId,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity,
  setOpenDeleteDialog,
  setUpdateKey
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/procurement/deleteItem/${prNo}/${itemId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    let result = await response.json();

    if (response.ok) {
      setSnackbarOpen(true);
      setSnackbarMessage(result.message);
      setSnackbarSeverity("success");
      setOpenDeleteDialog(false);
      // Refresh the data by updating the updateKey
      if (setUpdateKey) {
        setUpdateKey(prevKey => prevKey + 1);
      }
    } else {
      setSnackbarOpen(true);
      setSnackbarMessage(result.error || "Error deleting PR item");
      setSnackbarSeverity("error");
    }
  } catch (error) {
    setSnackbarOpen(true);
    setSnackbarMessage("Error deleting PR item");
    setSnackbarSeverity("error");
    console.error("Error deleting PR item:", error);
  }
};

export { fetchData, updatePRItem, deletePRItem, searchPR };
