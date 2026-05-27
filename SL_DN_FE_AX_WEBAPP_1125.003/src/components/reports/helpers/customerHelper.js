const getNewCustomersData = async (
  token,
  setNewCustomersData,
  startDate,
  endDate
) => {
  let year = "2024";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/newCustomersByYear?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  let newCustomers = await response.json();

  console.log({ newCustomers });

  let total = 0;

  newCustomers.map((item) => {
    total = total + item.yAxis;
  });

  // Format the total with commas
  const formattedTotal = new Intl.NumberFormat("en-IN").format(total);

  let result = {
    total_new_customers: formattedTotal,
    newCustomerSplitup: newCustomers,
  };

  setNewCustomersData(result);
};

const getPerformanceScore = async (
  token,
  setPerformanceScore,
  startDate,
  endDate
) => {
  let year = "2024";
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/salesReports/performanceScore?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  let performanceScore = await response.json();

  setPerformanceScore(performanceScore);
};
export { getNewCustomersData, getPerformanceScore };
