import React, { useEffect, useState } from "react";
import Cookies from "js-cookie"; // For handling authentication tokens
import {
  useAppTimezone,
  formatCalendarWallPlusDays,
  formatDateInTimezone,
  wallYmdMinusMonthsFromNow,
} from "@/utils/timezoneUtil";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
// import  SupportAgentIcon  '@mui/icons-material/SupportAgent';
import InfoIcon from "@mui/icons-material/Info";
import DownloadIcon from "@mui/icons-material/Download";

const CrmReport = () => {
  const [isClient, setIsClient] = useState(false); //Ensures the component runs only on the client-side
  const [open, setOpen] = useState(false); //Controls the visibility of the modal (dialog).
  const [tableTitle, setTableTitle] = useState(""); //Stores the title of the currently open report
  const [tableData, setTableData] = useState([]); //Holds data to be displayed in the table
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leadsOwners, setLeadsOwners] = useState(new Set()); // Add leadsOwners state

  const { timezone: appTimezone, fmtTime } = useAppTimezone();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [todayChartData, setTodayChartData] = useState([]);
  const [tomorrowChartData, setTomorrowChartData] = useState([]);
  const [salesConvertChartData, setSalesConvertChartData] = useState([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!appTimezone?.utc_offset) return;
    const end = formatDateInTimezone(new Date(), appTimezone, "YYYY-MM-DD");
    const start = wallYmdMinusMonthsFromNow(appTimezone, 3);
    setEndDate(end);
    setStartDate(start);
  }, [appTimezone]);

  const flattenTableData = (data = []) => {
    const flattened = [];

    data.forEach((entry) => {
      const { telecall = [], ...rest } = entry;

      // If no telecalls, still include the customer data
      if (telecall.length === 0) {
        flattened.push({ ...rest });
      } else {
        telecall.forEach((call) => {
          flattened.push({
            ...rest,
            ...call, // flatten telecall details into same row
          });
        });
      }
    });

    return flattened;
  };

  const downloadDataAsExcel = (tableData = [], tableTitle) => {
    const workbook = XLSX.utils.book_new();

    // Flatten nested telecall array into rows
    const flattenedData = flattenTableData(tableData);

    if (flattenedData.length > 0) {
      const tableDataSheet = XLSX.utils.json_to_sheet(flattenedData);
      XLSX.utils.book_append_sheet(workbook, tableDataSheet, "Report");
    }

    XLSX.writeFile(workbook, `${tableTitle}.xlsx`);
  };

  // Add useEffect to fetch today's data on component mount
  useEffect(() => {
    if (isClient) {
      fetchTodayData();
      fetchTomorrowData();
    }
  }, [isClient]);

  const fetchTodayData = async () => {
    try {
      const authToken = Cookies.get("token");
      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crmReports/telecaller/report/today`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      let data = await response.json();
      console.log("Original Data:", data);

      // Format updated_at to HH:mm:ss
      data = data.map((item) => ({
        ...item,
        updated_at: formatTime(item.updated_at),
      }));

      console.log("Formatted Data:", data);

      // Apply filtering function
      const filteredData = filterTodayData(data);
      console.log("Filtered Data1:", filteredData);

      // Process and set the chart data
      const processedData = processChartData(filteredData, "today");
      console.log({ processedData });
      setTodayChartData(processedData);
    } catch (error) {
      console.error("Error fetching today's data:", error);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    return fmtTime(isoString);
  };

  const fetchTomorrowData = async () => {
    try {
      const authToken = Cookies.get("token");
      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crmReports/telecaller/report`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      console.log("Original Data:", data);

      // Process the data for tomorrow's chart
      const processedData = processChartData1(data);
      setTomorrowChartData(processedData);
    } catch (error) {
      console.error("Error fetching tomorrow's data:", error);
    }
  };

  // Processing Chart Data

  const processChartData = (data) => {
    if (!Array.isArray(data)) return [];

    // Initialize time slots (0-23) with default count 0 for each leads_owner
    const timeSlots = {};
    const newLeadsOwners = new Set();

    // First, collect all unique leads_owners
    data.forEach((item) => {
      if (item.leads_owner) {
        newLeadsOwners.add(item.leads_owner);
      }
    });

    // Update the leadsOwners state
    setLeadsOwners(newLeadsOwners);

    // Initialize time slots for each hour and leads_owner
    for (let i = 0; i < 24; i++) {
      timeSlots[i] = {
        hour: `${i.toString().padStart(2, "0")}:00`,
        currentTime: []
      };
      
      // Add a count for each leads_owner
      newLeadsOwners.forEach(owner => {
        timeSlots[i][`count_${owner}`] = 0;
      });
    }

    // Process the data
    data.forEach((item) => {
      if (item.telecall && Array.isArray(item.telecall) && item.telecall.length > 0) {
        const lastTelecall = item.telecall[item.telecall.length - 1];
        
        if (lastTelecall && lastTelecall.currentTime) {
          const [hour] = lastTelecall.currentTime.split(":");
          const hourNum = parseInt(hour, 10);

          if (!isNaN(hourNum) && hourNum >= 0 && hourNum < 24) {
            // Increment count for the specific leads_owner
            timeSlots[hourNum][`count_${item.leads_owner}`] += 1;
            timeSlots[hourNum].currentTime.push(lastTelecall.currentTime);
          }
        }
      }
    });

    // Convert to array & sort by hour
    return Object.values(timeSlots).map(slot => ({
      ...slot,
      currentTime: slot.currentTime.join(", ")
    }));
  };

  const processChartData1 = (data) => {
    if (!Array.isArray(data)) return [];

    // Initialize time slots (0-23) with default count 0
    const timeSlots = {};
    for (let i = 0; i < 24; i++) {
      timeSlots[i] = {
        hour: `${i.toString().padStart(2, "0")}:00`,
        call_count: 0,
        currentTime: [] // Array to store all currentTimes for this hour
      };
    }

    data.forEach((item) => {
      if (item.telecall && Array.isArray(item.telecall) && item.telecall.length > 0) {
        // Get only the last telecall entry
        const lastTelecall = item.telecall[item.telecall.length - 1];
        
        if (lastTelecall && lastTelecall.currentTime) {
          const [hour] = lastTelecall.currentTime.split(":");
          const hourNum = parseInt(hour, 10);

          if (!isNaN(hourNum) && hourNum >= 0 && hourNum < 24) {
            timeSlots[hourNum].call_count += 1;
            timeSlots[hourNum].currentTime.push(lastTelecall.currentTime);
          }
        }
      }
    });

    // Convert to array & sort by hour
    return Object.values(timeSlots).map(slot => ({
      ...slot,
      currentTime: slot.currentTime.join(", ") // Join all times for this hour
    }));
  };

  // Fetch API data based on the report type
  const fetchTableData = async (title) => {
    try {
      setLoading(true);
      setError(null);
      setTableData([]);

      const authToken = Cookies.get("token"); // Get token from cookies

      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      console.log({ authToken });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crmReports/telecaller/report`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`, // Send token in headers
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data from API");
      }

      const data = await response.json();
      console.log({ table: data });
      setTableData(data); // Update table data
    } catch (error) {
      console.error("Error fetching table data:", error);
      setError("Failed to load data. Please check API or token.");
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect to watch date changes for Sales Convert
  useEffect(() => {
    if (startDate && endDate) {
      fetchSalesConvertData();
    }
  }, [startDate, endDate]);

  const handleOpen = async (title) => {
    setTableTitle(title);
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const authToken = Cookies.get("token");
      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crmReports/telecaller/report/today`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data from API");
      }

      const data = await response.json();
      console.log("API Response:", data);

      if (title === "Telecaller Today Call List") {
        // Filter data for today's calls
        const filteredData = filterTodayData(data);
        console.log("Filtered Today's Data:", filteredData);
        setTableData(filteredData);
      } else {
        setTableData(data);
      }
    } catch (error) {
      console.error("Error opening modal:", error);
      setError("Failed to load data.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesConvertData = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = Cookies.get("token");
      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      // Format dates correctly for API

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/crmReports/converted/customers?startDate=${startDate}&endDate=${endDate}`;
      console.log("Fetching sales convert data:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch sales convert data");
      }

      const data = await response.json();
      console.log("Sales Convert API Response:", data);

      setTableData(data); // Set raw data for table

      // Process data for chart
      const chartDataProcessed = data.reduce((acc, item) => {
        const owner = item.leads_owner || "Unknown";
        if (!acc[owner]) {
          acc[owner] = {
            leads_owner: owner,
            convert_count: 0,
          };
        }
        acc[owner].convert_count += 1;
        return acc;
      }, {});

      setSalesConvertChartData(Object.values(chartDataProcessed));
    } catch (error) {
      console.error("Error fetching sales convert data:", error);
      setError("Failed to load sales convert data");
      setTableData([]);
      setSalesConvertChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen3 = async (title) => {
    setTableTitle(title);
    if (title === "Telecaller to Sales Convert") {
      await fetchSalesConvertData();
      setOpen(true);
    } else {
      setOpen(true);
      await fetchTableData(title);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen1 = async (title) => {
    setTableTitle(title);
    setOpen(true);
    setLoading(true);
    setError(null);

    try {
      const authToken = Cookies.get("token");
      if (!authToken) {
        throw new Error("No token found in cookies");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/crmReports/telecaller/report`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch data");

      const data = await response.json();
      // For popup, only show tomorrow's data
      const tomorrowData = filterTomorrowData(data);
      setTableData(tomorrowData);
    } catch (error) {
      console.error("Error opening modal:", error);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen2 = (title) => {
    setTableTitle(title);
    setOpen(true);
    fetchTableData(title); // Fetch data when modal opens
  };

  const filterTodayData = (data) => {
    if (!Array.isArray(data)) {
      console.error("filterTodayData Error: Data is not an array", data);
      return [];
    }

    const endYmd = appTimezone?.utc_offset
      ? formatDateInTimezone(new Date(), appTimezone, "YYYY-MM-DD")
      : new Date().toISOString().slice(0, 10);
    const startYmd = appTimezone?.utc_offset
      ? wallYmdMinusMonthsFromNow(appTimezone, 3)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 3);
          return d.toISOString().slice(0, 10);
        })();

    return data.filter((item) => {
      try {
        if (!item.telecall || !Array.isArray(item.telecall) || item.telecall.length === 0) {
          return false;
        }

        const lastTelecall = item.telecall[item.telecall.length - 1];
        if (!lastTelecall.scheduledDate) return false;

        const [day, month, year] = lastTelecall.scheduledDate.split("-").map(Number);
        const callYmd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        return callYmd >= startYmd && callYmd <= endYmd;
      } catch (error) {
        console.error("Error processing telecall data:", error);
        return false;
      }
    });
  };

  const filterTomorrowData = (data) => {
    if (!Array.isArray(data)) {
      console.error("filterTomorrowData Error: Data is not an array", data);
      return [];
    }

    const tomorrowFormatted = appTimezone?.utc_offset
      ? formatCalendarWallPlusDays(appTimezone, new Date(), 1, "DD-MM-YYYY")
      : (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          return tomorrow.toLocaleDateString("en-GB").replace(/\//g, "-");
        })();

    return data.filter((item) => {
      try {
        if (!item.telecall || !Array.isArray(item.telecall) || item.telecall.length === 0) {
          return false;
        }

        // Get only the last telecall entry's scheduledDate
        const lastTelecall = item.telecall[item.telecall.length - 1];
        return lastTelecall.scheduledDate === tomorrowFormatted;
      } catch (error) {
        console.error("Error processing telecall data:", error);
        return false;
      }
    });
  };

  const filterLastThreeMonthsData = (data) => {
    if (!Array.isArray(data)) {
      console.error("filterLastThreeMonthsData Error: Data is not an array", data);
      return [];
    }

    const endYmd = appTimezone?.utc_offset
      ? formatDateInTimezone(new Date(), appTimezone, "YYYY-MM-DD")
      : new Date().toISOString().slice(0, 10);
    const startYmd = appTimezone?.utc_offset
      ? wallYmdMinusMonthsFromNow(appTimezone, 3)
      : (() => {
          const d = new Date();
          d.setMonth(d.getMonth() - 3);
          return d.toISOString().slice(0, 10);
        })();

    return data.filter((item) => {
      try {
        if (!item.telecall || !Array.isArray(item.telecall) || item.telecall.length === 0) {
          return false;
        }

        const lastTelecall = item.telecall[item.telecall.length - 1];
        if (!lastTelecall.scheduledDate) return false;

        const [day, month, year] = lastTelecall.scheduledDate.split("-").map(Number);
        const callYmd = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        return callYmd >= startYmd && callYmd <= endYmd;
      } catch (error) {
        console.error("Error processing telecall data:", error);
        return false;
      }
    });
  };

  return (
    <div>
      {isClient && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
          {/* Telecaller Today Call List */}
          <Card
            sx={{ flex: "1 1 48%", minWidth: "300px", position: "relative" }}
          >
            <CardContent>
              <Typography variant="h5" component="div">
                Telecaller Today Call List
                <IconButton
                  sx={{ position: "absolute", top: 10, right: 10 }}
                  color="primary"
                  onClick={() => handleOpen("Telecaller Today Call List")}
                >
                  <InfoIcon />
                </IconButton>
              </Typography>
              <LineChart width={500} height={300} data={todayChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => {
                    const owner = name.replace('count_', '');
                    return [`${value} calls at ${props.payload.currentTime || 'No time data'}`, `Owner: ${owner}`];
                  }}
                />
                <Legend />
                {Array.from(leadsOwners).map((owner, index) => (
                  <Line
                    key={owner}
                    type="monotone"
                    dataKey={`count_${owner}`}
                    stroke={`hsl(${index * 40}, 80%, 50%)`}
                    name={`Owner: ${owner}`}
                  />
                ))}
              </LineChart>
            </CardContent>
          </Card>

          {/* Telecaller Tomorrow Plan */}
          <Card
            sx={{ flex: "1 1 48%", minWidth: "300px", position: "relative" }}
          >
            <CardContent>
              <Typography variant="h5" component="div">
                Telecaller Tomorrow Plan
                <IconButton
                  sx={{ position: "absolute", top: 10, right: 10 }}
                  color="primary"
                  onClick={() => handleOpen1("Telecaller Tomorrow Plan")}
                >
                  <InfoIcon />
                </IconButton>
              </Typography>
              <LineChart width={500} height={300} data={tomorrowChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(tick) => `${tick}:00`} />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} calls at ${props.payload.currentTime || 'No time data'}`,
                    name
                  ]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="call_count"
                  stroke="#82ca9d"
                  name="Planned Calls"
                />
              </LineChart>
            </CardContent>
          </Card>

          {/* Telecaller to Sales Convert */}
          <Card
            sx={{ flex: "1 1 48%", minWidth: "300px", position: "relative" }}
          >
            <CardContent>
              <Typography variant="h5" component="div">
                Telecaller to Sales Convert
                <IconButton
                  sx={{ position: "absolute", top: 10, right: 10 }}
                  color="primary"
                  onClick={() => handleOpen3("Telecaller to Sales Convert")}
                >
                  <InfoIcon />
                </IconButton>
              </Typography>
              <div
                style={{ display: "flex", gap: "20px", marginBottom: "20px" }}
              >
                <TextField
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: "200px" }}
                />
                <TextField
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: "200px" }}
                />
              </div>

              {/* Make the chart responsive */}
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesConvertChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="leads_owner" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="convert_count"
                      stroke="#ff7300"
                      name="Conversions"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog (Modal) with Table */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          {tableTitle}
          {/* <Box sx={{ display: "flex", flexDirection: "row", gap: 1 }}> */}
          <IconButton
            sx={{ position: "absolute", top: 10, right: 40 }}
            onClick={() => {
              downloadDataAsExcel(tableData, tableTitle);
            }}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            sx={{ position: "absolute", top: 10, right: 10 }}
            onClick={handleClose}
          >
            <CloseIcon />
          </IconButton>
          {/* </Box> */}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    {tableTitle === "Telecaller to Sales Convert" ? (
                      <>
                        <TableCell>
                          <b>Customer ID</b>
                        </TableCell>
                        <TableCell>
                          <b>Customer Name</b>
                        </TableCell>
                        <TableCell>
                          <b>Leads Owner</b>
                        </TableCell>
                        <TableCell>
                          <b>Convert Date</b>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <b>Customer ID</b>
                        </TableCell>
                        <TableCell>
                          <b>Customer Name</b>
                        </TableCell>
                        <TableCell>
                          <b>Call Type</b>
                        </TableCell>
                        <TableCell>
                          <b>Call Status</b>
                        </TableCell>
                        <TableCell>
                          <b>Scheduled Date</b>
                        </TableCell>
                        <TableCell>
                          <b>Call Feedback</b>
                        </TableCell>
                        <TableCell>
                          <b>time</b>
                        </TableCell>
                        <TableCell>
                          <b>Comment</b>
                        </TableCell>
                        <TableCell>
                          <b>Leads Owner</b>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableTitle === "Telecaller to Sales Convert" ? (
                    Array.isArray(tableData) && tableData.length > 0 ? (
                      tableData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.customer_id || "N/A"}</TableCell>
                          <TableCell>{row.customer_name || "N/A"}</TableCell>
                          <TableCell>{row.leads_owner || "N/A"}</TableCell>
                          <TableCell>{row.convert_date || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No data available
                        </TableCell>
                      </TableRow>
                    )
                  ) : (
                    tableData.map((row, index) => {
                      let telecallData = [];

                      if (row.telecall) {
                        try {
                          // Ensure row.telecall is an array before proceeding
                          telecallData =
                            typeof row.telecall === "string"
                              ? JSON.parse(row.telecall)
                              : row.telecall;

                          if (!Array.isArray(telecallData)) {
                            console.warn(
                              "Unexpected telecall data format:",
                              telecallData
                            );
                            telecallData = []; // Reset if not an array
                          }
                        } catch (error) {
                          console.error(
                            "Error parsing telecall JSON:",
                            error,
                            "Data:",
                            row.telecall
                          );
                        }
                      }

                      return (
                        <TableRow key={index}>
                          <TableCell>{row.customer_id || "N/A"}</TableCell>
                          <TableCell>{row.customer_name || "N/A"}</TableCell>
                          {telecallData.length > 0 ? (
                            <>
                              <TableCell>
                                {telecallData[0]?.type || "N/A"}
                              </TableCell>
                              <TableCell>
                                {telecallData[0]?.callStatus || "N/A"}
                              </TableCell>
                              <TableCell>
                                {telecallData[0]?.scheduledDate || "N/A"}
                              </TableCell>
                              <TableCell>
                                {telecallData[0]?.callFeedback || "N/A"}
                              </TableCell>
                              <TableCell>
                                {telecallData[0]?.currentTime || "N/A"}
                              </TableCell>
                              <TableCell>
                                {telecallData[0]?.comment || "N/A"}
                              </TableCell>
                            </>
                          ) : (
                            <TableCell
                              colSpan={5}
                              style={{ textAlign: "center", color: "gray" }}
                            >
                              No Telecall Data
                            </TableCell>
                          )}

                          <TableCell>{row.leads_owner || "N/A"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrmReport;
