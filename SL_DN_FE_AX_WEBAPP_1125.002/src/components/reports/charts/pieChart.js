import * as React from "react";
import { PieChart } from "@mui/x-charts/PieChart";
import { Box } from "@mui/material";

export default function Pie({ chartData }) {
  function transformData(data) {
    if (!data)
      return [
        {
          id: "",
          value: "",
          label: "",
        },
      ];

    return data?.map((item, index) => ({
      id: index,
      value: parseFloat(item.total_price),
      label: item.service_type,
    }));
  }

  let formattedData = transformData(chartData);

  return (
    <Box
      sx={{
        marginBottom:"20%",
        display: "flex",
        justifyContent: "center",  // Center horizontally
        alignItems: "center",      // Center vertically
        width: "100%",             // Ensure full width for container
        height: "100%",            // Ensure full height for container
      }}
    >
      <PieChart
        series={[
          {
            data: formattedData,
          },
        ]}
        width={450}
        height={200}
      />
    </Box>
  );
}
