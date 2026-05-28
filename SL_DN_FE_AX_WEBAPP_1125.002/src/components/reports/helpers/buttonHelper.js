
//financeReport la revenue

const getButtonRevenue = async (token, setButtonRevenue, startDate,
    endDate) => {
    let year = "2024";
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/dashboard/performanceScore?startDate=${startDate}&endDate=${endDate}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
  
    let performanceScore = await response.json();
    setButtonRevenue(performanceScore);
  };

  export { getButtonRevenue};
