const fetchData = async (storedToken, setLoading, setTableRows) => {
  setLoading(true);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/all`,
      {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      }
    );
    const data = await response.json();
    setTableRows(data);
  } catch (error) {
    console.log("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

const createCounterSale = async (saleData, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/countertopsales`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(saleData),
      }
    );

    if (!response.ok) throw new Error("Failed to create counter sale");

    const data = await response.json();
    return data.id; // Return the ID of the created countertop sale
  } catch (err) {
    console.log("Error creating counter sale:", err);
    return null;
  }
};

const deleteCTInvoice = async (
  appointmentId,
  token,
  setLoading,
  setTableRows
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/countertopsales/delete/${appointmentId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Failed to delete counter sale");

    fetchData(token, setLoading, setTableRows);
    return true;
  } catch (err) {
    console.log("Error deleting counter sale:", err);
    return false;
  }
};

export { fetchData, createCounterSale, deleteCTInvoice };
