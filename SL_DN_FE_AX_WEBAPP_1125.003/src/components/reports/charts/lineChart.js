import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";

export default function Line({ chartData }) {
  return (
    <LineChart
      xAxis={[
        {
          
          data: chartData?.map((item) => item.xAxis.split("-")[1]) || [0, 0], // Extract month values
          scaleType: "band", // Treat xAxis as categorical
          label: "Months",
        },
      ]}
      series={[
        {
          id: "new-customers",
          data: chartData?.map((item) => item.yAxis) || [0, 0], // Y-axis values
          label: "New Customers",
        },
      ]}
      height={350}
    />
  );
}
