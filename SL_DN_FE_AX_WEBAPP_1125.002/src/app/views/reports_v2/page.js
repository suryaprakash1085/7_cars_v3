"use client";

// React and Next imports
import * as React from "react";
import { useEffect, useState, useMemo} from "react";
import axios from "axios";
import dayjs from "dayjs";
import { useAppTimezone } from "@/utils/timezoneUtil";

// Chart imports
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart
} from 'recharts';

// Material-UI imports
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import SettingsAccessibilityIcon from "@mui/icons-material/SettingsAccessibility";
import Button from "@mui/material/Button";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import SearchIcon from "@mui/icons-material/Search";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import Modal from "@mui/material/Modal";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import LaunchIcon from "@mui/icons-material/Launch";
import CloseIcon from "@mui/icons-material/Close";
import LinearProgress from "@mui/material/LinearProgress";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import InventoryIcon from "@mui/icons-material/Inventory";
import BusinessIcon from "@mui/icons-material/Business";
import MapIcon from "@mui/icons-material/Map";
import ConstructionIcon from "@mui/icons-material/Construction";
import InsightsIcon from "@mui/icons-material/Insights";
import Cookies from "js-cookie";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://7carsbe.sl-diginova.com';

if (typeof window !== 'undefined') {
    // This will only run on the client side
    const JWT_TOKEN = Cookies.get('token') || '';
    if (!JWT_TOKEN) {
        window.location.href = '/'; // Redirect to login if token is not set
    }
}

// Professional Color Palette
const COLORS = {
    primary: ['#3B82F6', '#1E40AF', '#1D4ED8', '#2563EB'],
    success: ['#10B981', '#059669', '#047857', '#065F46'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    teal: ['#14B8A6', '#0D9488', '#0F766E', '#115E59']
};






// API Functions using axios with proper error handling
async function fetchData(endpoint) {
    try {
        const JWT_TOKEN = Cookies.get('token') || '';
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return null;
    }
}

const drawerWidth = 240;

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: "hidden",
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up("sm")]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
    shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    ...(open && {
        ...openedMixin(theme),
        "& .MuiDrawer-paper": openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        "& .MuiDrawer-paper": closedMixin(theme),
    }),
}));




// Custom hook for data fetching with proper error handling and loading states
function useApiData(endpoint, dependencies = []) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    useEffect(() => {
        let mounted = true;

        const fetchApiData = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchData(endpoint);
                if (mounted) {
                    setData(result);
                }
            } catch (err) {
                if (mounted) {
                    setError(err);
                    setData(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchApiData();

        return () => {
            mounted = false;
        };
    }, dependencies);

    return { data, loading, error };
}

// Reusable Data Modal Component
function DataModal({ open, onClose, title, data, columns }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{title} ({Array.isArray(data) ? data.length : 0} records)</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                {columns.map((col) => (
                                    <TableCell key={col.key}>{col.label}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Array.isArray(data) && data.map((row, index) => (
                                <TableRow key={index}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key}>
                                            {col.render ? col.render(row[col.key], row) : (row[col.key] || 'N/A')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
        </Dialog>
    );
}

// Professional KPI Card Component with Modal Integration
function KPICard({ title, value, subtitle, trend, trendValue, icon, color = 'primary', data, modalColumns, modalTitle }) {
    const [modalOpen, setModalOpen] = useState(false);

    const colorMap = {
        primary: COLORS.primary[0],
        success: COLORS.success[0],
        warning: COLORS.warning[0],
        danger: COLORS.danger[0],
        purple: COLORS.purple[0],
        teal: COLORS.teal[0]
    };

    return (
        <>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
                <CardContent sx={{
                    background: `linear-gradient(135deg, ${colorMap[color]}15 0%, ${colorMap[color]}25 100%)`,
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                            <Typography variant="caption" color="textSecondary" fontWeight="bold">
                                {title}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                {icon && icon.startsWith('/') ? (
                                    <Box component="img" src={icon} alt={title} sx={{ width: 24, height: 24, objectFit: 'contain' }} />
                                ) : (
                                    <Box sx={{ fontSize: '1.5rem' }}>{icon}</Box>
                                )}
                                {data && modalColumns && (
                                    <IconButton
                                        size="small"
                                        onClick={() => setModalOpen(true)}
                                        sx={{
                                            backgroundColor: 'rgba(255,255,255,0.8)',
                                            '&:hover': { backgroundColor: 'rgba(255,255,255,1)' }
                                        }}
                                    >
                                        <LaunchIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color={colorMap[color]}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="textSecondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {trend && trendValue && (
                        <Box display="flex" alignItems="center" mt={1}>
                            <Chip
                                label={`${trend === 'up' ? '↗' : '↘'} ${trendValue}`}
                                size="small"
                                color={trend === 'up' ? 'success' : 'error'}
                                variant="outlined"
                            />
                        </Box>
                    )}
                </CardContent>
            </Card>

            {modalOpen && (
                <DataModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title={modalTitle || title}
                    data={data}
                    columns={modalColumns}
                />
            )}
        </>
    );
}

// Advanced Chart Component
function AdvancedChart({ type, data, config, height = 300 }) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={height}>
                <Typography color="textSecondary">No data available</Typography>
            </Box>
        );
    }

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey={config.xKey} stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        />
                        <Bar dataKey={config.yKey} fill={config.color || COLORS.primary[0]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey={config.valueKey}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS.primary[index % COLORS.primary.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                );
            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey={config.xKey} stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey={config.yKey}
                            stroke={config.color || COLORS.primary[0]}
                            fill={config.color || COLORS.primary[0]}
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                );
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey={config.xKey} stroke="#666" fontSize={12} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey={config.yKey}
                            stroke={config.color || COLORS.primary[0]}
                            strokeWidth={3}
                            dot={{ r: 5 }}
                        />
                    </LineChart>
                );
            default:
                return null;
        }
    };

    return (
        <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
        </ResponsiveContainer>
    );
}

// Executive Summary Dashboard
function ExecutiveSummary({ startDate, endDate, companyDetails }) {
    const { fmtDate } = useAppTimezone();
    const [appointments, setAppointments] = useState([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);
    const { data: inventory, loading: inventoryLoading } = useApiData('/inventory?limit=100000');
    const { data: users, loading: usersLoading } = useApiData('/auth/users');

    useEffect(() => {
        const fetchAppointmentsByDate = async () => {
            setAppointmentsLoading(true);
            try {
                if (!startDate || !endDate) {
                    const data = await fetchData('/appointment/');
                    setAppointments(Array.isArray(data) ? data : []);
                } else {
                    const formattedStart = new Date(startDate).toISOString().split("T")[0];
                    const formattedEnd = new Date(endDate).toISOString().split("T")[0];
                    const data = await fetchData(
                        `/appointment/reports/get_appointments_by_date/${formattedStart}/${formattedEnd}`
                    );
                    const result = Array.isArray(data) ? data : [];
                    if (result.length === 0) {
                        const allData = await fetchData('/appointment/');
                        setAppointments(Array.isArray(allData) ? allData : []);
                    } else {
                        setAppointments(result);
                    }
                }
            } catch (error) {
                console.error('Error fetching appointments:', error);
                const allData = await fetchData('/appointment/');
                setAppointments(Array.isArray(allData) ? allData : []);
            } finally {
                setAppointmentsLoading(false);
            }
        };
        fetchAppointmentsByDate();
    }, [startDate, endDate]);

    if (appointmentsLoading || inventoryLoading || usersLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    const appointmentsList = Array.isArray(appointments) ? appointments : [];
    const inventoryList = Array.isArray(inventory) ? inventory : [];
    const usersList = Array.isArray(users) ? users : [];

    const totalRevenue = appointmentsList.reduce((sum, a) => sum + (parseFloat(a?.paid_amount) || 0), 0);

    const serviceEfficiency = appointmentsList.length > 0
        ? (appointmentsList.filter(a => a?.status?.includes('invoiced')).length / appointmentsList.length) * 100
        : 0;

    const uniqueCustomerIds = new Set(appointmentsList.map(a => a?.customer_id));
    const customersList = [...uniqueCustomerIds].map(id => {
        const appt = appointmentsList.find(a => a?.customer_id === id);
        return { customer_id: id, customer_name: appt?.customer_name, city: appt?.city };
    });

    const geoData = appointmentsList.reduce((acc, appt) => {
        const city = appt?.city || 'Unknown';
        acc[city] = (acc[city] || 0) + 1;
        return acc;
    }, {});
    const topCities = Object.entries(geoData).sort(([, a], [, b]) => b - a).slice(0, 8);

    const brandData = appointmentsList.reduce((acc, appt) => {
        const brand = appt?.make || 'Unknown';
        if (brand !== 'Unknown') acc[brand] = (acc[brand] || 0) + 1;
        return acc;
    }, {});
    const chartData = Object.entries(brandData).slice(0, 10).map(([brand, count]) => ({
        brand: brand.substring(0, 15),
        count
    }));

    const appointmentColumns = [
        { key: 'appointment_id', label: 'ID' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'status', label: 'Status' },
        { key: 'appointment_date', label: 'Date', render: (value) => fmtDate(value) },
        { key: 'paid_amount', label: 'Amount', render: (value) => `₹${(parseFloat(value) || 0).toLocaleString()}` }
    ];

    const customerColumns = [
        { key: 'customer_id', label: 'ID' },
        { key: 'customer_name', label: 'Name' },
        { key: 'city', label: 'City' },
    ];

    const inventoryColumns = [
        { key: 'inventory_id', label: 'ID' },
        { key: 'part_name', label: 'Part Name' },
        { key: 'category', label: 'Category' },
        { key: 'quantity', label: 'Quantity', render: (value) => value || 0 },
        { key: 'price', label: 'Price', render: (value) => `₹${(value || 0).toLocaleString()}` }
    ];

    const userColumns = [
        { key: 'user_id', label: 'ID' },
        { key: 'username', label: 'Username' },
        { key: 'role', label: 'Role' },
        { key: 'email', label: 'Email' }
    ];

    const bgImage = companyDetails?.background_image || null;

    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%",
            }}
        >
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Revenue"
                            value={`₹${totalRevenue.toLocaleString()}`}
                            subtitle="Appointment revenue"
                            trend="up"
                            trendValue="12.5%"
                            icon="💰"
                            color="success"
                            data={appointmentsList}
                            modalColumns={appointmentColumns}
                            modalTitle="Appointment Revenue"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Service Efficiency"
                            value={`${serviceEfficiency.toFixed(1)}%`}
                            subtitle="Completion rate"
                            trend="up"
                            trendValue="8.3%"
                            icon="⚡"
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Vechicle Base"
                            value={customersList.length.toLocaleString()}
                            subtitle="Active customers"
                            trend="up"
                            trendValue="15.2%"
                            icon="👥"
                            color="purple"
                            data={customersList}
                            modalColumns={customerColumns}
                            modalTitle="Customer Directory"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Appointments"
                            value={appointmentsList.length.toLocaleString()}
                            subtitle="Service bookings"
                            trend="up"
                            trendValue="5.7%"
                            icon="📅"
                            color="warning"
                            data={appointmentsList}
                            modalColumns={appointmentColumns}
                            modalTitle="Appointment Details"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <MapIcon sx={{ mr: 1 }} />
                                Location Market Distribution
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {topCities.map(([city, count], index) => {
                                    const percentage = appointmentsList.length > 0
                                        ? (count / appointmentsList.length) * 100
                                        : 0;
                                    const colorIndex = index % COLORS.primary.length;
                                    return (
                                        <Box key={city} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    backgroundColor: COLORS.primary[colorIndex],
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 'bold',
                                                    mr: 2
                                                }}
                                            >
                                                {index + 1}
                                            </Box>
                                            <Box sx={{ flex: 1 }}>
                                                <Box display="flex" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="body1" fontWeight="medium">{city}</Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        {count} appointments ({percentage.toFixed(1)}%)
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percentage}
                                                    sx={{
                                                        height: 8,
                                                        borderRadius: 4,
                                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                                        '& .MuiLinearProgress-bar': {
                                                            backgroundColor: COLORS.primary[colorIndex],
                                                            borderRadius: 4
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                Vehicle Brand Distribution
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <AdvancedChart
                                    type="bar"
                                    data={chartData}
                                    config={{ xKey: 'brand', yKey: 'count', color: COLORS.primary[0] }}
                                    height={300}
                                />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <InventoryIcon sx={{ mr: 1 }} />
                                Inventory Category Analysis
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                <AdvancedChart
                                    type="pie"
                                    data={inventoryList.reduce((acc, item) => {
                                        const existing = acc.find(a => a.name === item?.category);
                                        if (existing) {
                                            existing.value += 1;
                                        } else {
                                            acc.push({ name: item?.category || 'Unknown', value: 1 });
                                        }
                                        return acc;
                                    }, [])}
                                    config={{ valueKey: 'value' }}
                                    height={300}
                                />
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
function ServiceAnalytics({ startDate, endDate, companyDetails }) {
    const { fmtDate, fmtShortMonthDay } = useAppTimezone();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
console.log('ServiceAnalytics received dates:', { startDate, endDate });
   useEffect(() => {

    const fetchAppointmentsByDate = async () => {

        setLoading(true);

        try {

            let url = "/appointment/";

            if (startDate && endDate) {

                const formattedStart = new Date(startDate)
                    .toISOString()
                    .split("T")[0];

                const formattedEnd = new Date(endDate)
                    .toISOString()
                    .split("T")[0];

                url = `/appointment/reports/get_appointments_by_date/${formattedStart}/${formattedEnd}`;
            }

            console.log("ServiceAnalytics API URL:", url);
            console.log("Appointments after filter:", appointments);
            const data = await fetchData(url);

            console.log("ServiceAnalytics API response:", data);

            setAppointments(Array.isArray(data) ? data : []);

        } catch (error) {

            console.error("Error fetching appointments:", error);
            setAppointments([]);

        } finally {

            setLoading(false);

        }

    };

    fetchAppointmentsByDate();

}, [startDate, endDate]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    const totalAppointments = appointmentsList.length;
    const completedAppointments = appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('invoiced')).length;
    const pendingAppointments = appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('scheduled')).length;
    const cancelledAppointments = appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('deleted')).length;
    const underInspection = appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('inspection')).length;
    const rework = appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('rework')).length;

    const getWeekLabel = (dateValue) => {
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) return 'Unknown';

        const dayOfWeek = date.getDay();
        const dayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() + dayOffset);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekStartLabel = fmtShortMonthDay(weekStart);
        const weekEndLabel = fmtShortMonthDay(weekEnd);
        return `${weekStartLabel} - ${weekEndLabel}`;
    };

    const serviceTrends = appointmentsList.reduce((acc, apt) => {
        const week = getWeekLabel(apt?.appointment_date || apt?.created_at || Date.now());
        acc[week] = (acc[week] || 0) + 1;
        return acc;
    }, {});

    const trendData = Object.entries(serviceTrends)
        .map(([week, count]) => ({ week, appointments: count }))
        .sort((a, b) => new Date(a.week.split(' - ')[0]) - new Date(b.week.split(' - ')[0]));

    const serviceTypes = appointmentsList.reduce((acc, apt) => {
        const type = apt?.service_type || apt?.type || 'General Service';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const serviceTypeData = Object.entries(serviceTypes).map(([type, count]) => ({ name: type, value: count }));

    const appointmentColumns = [
        { key: 'appointment_id', label: 'ID' },
        { key: 'customer_name', label: 'Customer' },
        { key: 'status', label: 'Status' },
        { key: 'appointment_date', label: 'Date', render: (value) => fmtDate(value) }
    ];

    //   KEY FIX: derive bgImage from companyDetails prop
    const bgImage = companyDetails?.background_image || null;

    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%",
            }}
        >
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Total Appointments"
                            value={totalAppointments.toLocaleString()}
                            subtitle="Service bookings"
                            trend="up"
                            trendValue="23.1%"
                            icon="📅"
                            color="primary"
                            data={appointmentsList}
                            modalColumns={appointmentColumns}
                            modalTitle="All Appointments"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Completed Services"
                            value={completedAppointments.toLocaleString()}
                            subtitle="Successful completions"
                            trend="up"
                            trendValue="18.5%"
                            icon=" "
                            color="success"
                            data={appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('invoiced'))}
                            modalColumns={appointmentColumns}
                            modalTitle="Completed Services"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Pending Services"
                            value={pendingAppointments.toLocaleString()}
                            subtitle="Awaiting completion"
                            icon="⏳"
                            color="warning"
                            data={appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('scheduled'))}
                            modalColumns={appointmentColumns}
                            modalTitle="Pending Services"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Cancelled Services"
                            value={cancelledAppointments.toLocaleString()}
                            subtitle="Cancelled appointments"
                            icon="❌"
                            color="danger"
                            data={appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('deleted'))}
                            modalColumns={appointmentColumns}
                            modalTitle="Cancelled Services"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Under Inspection"
                            value={underInspection.toLocaleString()}
                            subtitle="Currently under inspection"
                            icon="🔍"
                            color="teal"
                            data={appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('inspection'))}
                            modalColumns={appointmentColumns}
                            modalTitle="Under Inspection"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4} lg={2}>
                        <KPICard
                            title="Rework Services"
                            value={rework.toLocaleString()}
                            subtitle="Currently under rework"
                            icon="🔧"
                            color="purple"
                            data={appointmentsList.filter(apt => apt?.status?.toLowerCase().includes('rework'))}
                            modalColumns={appointmentColumns}
                            modalTitle="Rework Services"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                Service Appointment Trends
                            </Typography>
                            <AdvancedChart
                                type="line"
                                data={trendData}
                                config={{ xKey: 'week', yKey: 'appointments', color: COLORS.primary[0] }}
                                height={300}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <SettingsAccessibilityIcon sx={{ mr: 1 }} />
                                Service Type Distribution
                            </Typography>
                            <AdvancedChart
                                type="pie"
                                data={serviceTypeData}
                                config={{ valueKey: 'value' }}
                                height={300}
                            />
                        </Paper>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Service Efficiency Overview</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="success.main" fontWeight="bold">
                                            {totalAppointments > 0 ? ((completedAppointments / totalAppointments) * 100).toFixed(1) : 0}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Completion Rate</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                                            {totalAppointments > 0 ? ((pendingAppointments / totalAppointments) * 100).toFixed(1) : 0}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Pending Rate</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="info.main" fontWeight="bold">
                                            {totalAppointments > 0 ? ((underInspection / totalAppointments) * 100).toFixed(1) : 0}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Inspection Rate</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="error.main" fontWeight="bold">
                                            {totalAppointments > 0 ? ((rework / totalAppointments) * 100).toFixed(1) : 0}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Rework Rate</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}

// Customer Intelligence Section with proper error handling
function CustomerIntelligence({ startDate, endDate, companyDetails }) {
    const { fmtDate } = useAppTimezone();
    console.log('CustomerIntelligence received dates:', { startDate, endDate });
    const [customers, setCustomers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
useEffect(() => {
    const fetchCustomers = async () => {
        setLoading(true);

        try {
            let url = "/customer/";

            if (startDate && endDate) {
                const formattedStart = new Date(startDate)
                    .toISOString()
                    .split("T")[0];

                const formattedEnd = new Date(endDate)
                    .toISOString()
                    .split("T")[0];

                url = `/customer/?startDate=${formattedStart}&endDate=${formattedEnd}`;
            }

            console.log("Customer API URL:", url);

            const data = await fetchData(url);

            console.log("Customer API response:", data);

            setCustomers(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error("Customer API error:", error);
            setCustomers([]);
        } finally {
            setLoading(false);
        }
    };

    fetchCustomers();
}, [startDate, endDate]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

 

    
const customersList = (Array.isArray(customers) ? customers : []).filter(customer => {
    if (!startDate || !endDate) return true;

    const customerDate = new Date(customer?.created_at);
    const start = new Date(startDate);
    const end = new Date(endDate);

    return customerDate >= start && customerDate <= end;
});
    // Real customer analytics with safe access
    const totalCustomers = customersList.length;
    const newCustomers = customersList.filter(customer => {
        try {
            const createdDate = new Date(customer?.created_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return createdDate > thirtyDaysAgo;
        } catch {
            return false;
        }
    }).length;

    const highValueCustomers = customersList.filter(customer =>
        Array.isArray(customer?.vehicles) && customer.vehicles.length > 1
    ).length;

    const totalVehicles = customersList.reduce((sum, customer) =>
        sum + (Array.isArray(customer?.vehicles) ? customer.vehicles.length : 0), 0
    );

    // Extract all vehicles from customers
    const allVehicles = customersList.reduce((acc, customer) => {
        if (Array.isArray(customer?.vehicles)) {
            customer.vehicles.forEach(vehicle => {
                acc.push({
                    customer_name: customer.customer_name,
                    customer_id: customer.customer_id,
                    make: vehicle?.make || '',
                    model: vehicle?.model || '',
                    year: vehicle?.year || '',
                    plateNumber: vehicle?.plateNumber || vehicle?.plate_number || '',
                    vin: vehicle?.vin || vehicle?.vehicle_vin || vehicle?.vin_number || '',
                    fuelType: vehicle?.fuelType || vehicle?.fuel_type || '',
                    registrationDate: vehicle?.registration_date || vehicle?.registrationDate || ''
                });
            });
        }
        return acc;
    }, []);

    const vehicleColumns = [
        { key: 'customer_name', label: 'Customer' },
        { key: 'plateNumber', label: 'Plate Number' },
        { key: 'make', label: 'Make' },
        { key: 'model', label: 'Model' },
        { key: 'year', label: 'Year' },
        { key: 'vin', label: 'VIN' },
        { key: 'fuelType', label: 'Fuel Type' },
        { key: 'registrationDate', label: 'Registration Date' }
    ];

    const visibleVehicleColumns = vehicleColumns.filter((col) =>
        col.key === 'customer_name' || allVehicles.some((vehicle) => !!vehicle[col.key])
    );

    // Customer segmentation by type from API data
    const customerTypes = customersList.reduce((acc, customer) => {
        const type = customer?.contact?.type || 'General';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const typeData = Object.entries(customerTypes).map(([type, count]) => ({ name: type, value: count }));

    // Vehicle brand analysis from real data
    const brandData = customersList.reduce((acc, customer) => {
        if (Array.isArray(customer?.vehicles)) {
            customer.vehicles.forEach(vehicle => {
                const brand = vehicle?.make || 'Unknown';
                acc[brand] = (acc[brand] || 0) + 1;
            });
        }
        return acc;
    }, {});

    const topBrands = Object.entries(brandData).sort(([, a], [, b]) => b - a).slice(0, 8)
        .map(([brand, count]) => ({ brand: brand.substring(0, 15), count }));

    // Modal column configurations
    const customerColumns = [
        { key: 'customer_id', label: 'ID' },
        { key: 'customer_name', label: 'Name' },
        { key: 'contact', label: 'Phone', render: (value) => value?.phone || 'N/A' },
        { key: 'contact', label: 'City', render: (value) => value?.address?.city || 'N/A' },
        { key: 'vehicles', label: 'Vehicles', render: (value) => Array.isArray(value) ? value.length : 0 }
    ];

    const newCustomerColumns = [
        { key: 'customer_id', label: 'ID' },
        { key: 'customer_name', label: 'Name' },
        { key: 'created_at', label: 'Join Date', render: (value) => fmtDate(value) },
        { key: 'contact', label: 'Phone', render: (value) => value?.phone || 'N/A' }
    ];

    const highValueData = customersList.filter(customer =>
        Array.isArray(customer?.vehicles) && customer.vehicles.length > 1
    );

   const bgImage = companyDetails?.background_image || null;
    return (
        <Box
  sx={{
    backgroundImage: bgImage
      ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
      : "none",
    backgroundSize: "cover",
    backgroundAttachment: "fixed",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    width: "100%",
  }}
>
        <Box sx={{ p: 3 }}>
            {/* Customer KPIs */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total Customers"
                        value={totalCustomers.toLocaleString()}
                        subtitle="Active customer base"
                        trend="up"
                        trendValue="15.2%"
                        icon="👥"
                        color="primary"
                        data={customersList}
                        modalColumns={customerColumns}
                        modalTitle="Customer Directory"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="New Customers"
                        value={newCustomers.toLocaleString()}
                        subtitle="Last 30 days"
                        trend="up"
                        trendValue="28.7%"
                        icon="🆕"
                        color="success"
                        data={customersList.filter(customer => {
                            try {
                                const createdDate = new Date(customer?.created_at);
                                const thirtyDaysAgo = new Date();
                                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                                return createdDate > thirtyDaysAgo;
                            } catch {
                                return false;
                            }
                        })}
                        modalColumns={newCustomerColumns}
                        modalTitle="New Customers (Last 30 Days)"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="High-Value Customers"
                        value={highValueCustomers.toLocaleString()}
                        subtitle="Multiple vehicles"
                        trend="up"
                        trendValue="9.4%"
                        icon="💎"
                        color="purple"
                        data={highValueData}
                        modalColumns={customerColumns}
                        modalTitle="High-Value Customers"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Fleet Size"
                        value={totalVehicles.toLocaleString()}
                        subtitle="Total vehicles managed"
                        trend="up"
                        trendValue="18.9%"
                        icon="/icons/sport-car.png"
                        color="warning"
                        data={allVehicles}
                        modalColumns={visibleVehicleColumns}
                        modalTitle="Fleet - All Vehicles"
                    />
                </Grid>
            </Grid>

            {/* Customer Analytics Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <GroupIcon sx={{ mr: 1 }} />
                            Customer Segmentation
                        </Typography>
                        <AdvancedChart
                            type="pie"
                            data={typeData}
                            config={{ valueKey: 'value' }}
                            height={300}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Vehicle Brand Preferences
                        </Typography>
                        <AdvancedChart
                            type="bar"
                            data={topBrands}
                            config={{ xKey: 'brand', yKey: 'count', color: COLORS.primary[0] }}
                            height={300}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Customer Growth Analysis */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Customer Growth Analysis</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2} bgcolor="primary.light" color="white" borderRadius={2}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {totalCustomers > 0 ? ((newCustomers / totalCustomers) * 100).toFixed(1) : 0}%
                                    </Typography>
                                    <Typography variant="body2">Growth Rate</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2} bgcolor="success.light" color="white" borderRadius={2}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {totalCustomers > 0 ? ((highValueCustomers / totalCustomers) * 100).toFixed(1) : 0}%
                                    </Typography>
                                    <Typography variant="body2">High-Value Rate</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2} bgcolor="warning.light" color="white" borderRadius={2}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {totalCustomers > 0 ? (totalVehicles / totalCustomers).toFixed(1) : 0}
                                    </Typography>
                                    <Typography variant="body2">Vehicles per Customer</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2} bgcolor="info.light" color="white" borderRadius={2}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {Object.keys(brandData).length}
                                    </Typography>
                                    <Typography variant="body2">Vehicle Brands</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        </Box>
    );
}

// Financial Dashboard Section with proper transaction handling
function FinancialDashboard({ startDate, endDate, companyDetails }) {
    const { fmtDate, fmtShortMonthDay } = useAppTimezone();
    console.log('FinancialDashboard props:', { startDate, endDate, companyDetails });

    const formatDate = (date) => date ? date.format('YYYY-MM-DD') : '';

    const transactionUrl = `/finance/transactions?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
    const inventoryUrl = `/inventory?limit=100000&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;

    //   FIX: use URL as dependency (IMPORTANT)
    const { data: transactionsResponse, loading: transactionsLoading } =
        useApiData(transactionUrl, [transactionUrl]);

    const { data: inventory, loading: inventoryLoading } =
        useApiData(inventoryUrl, [inventoryUrl]);

    if (transactionsLoading || inventoryLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    const transactionsList = Array.isArray(transactionsResponse?.data)
        ? transactionsResponse.data
        : Array.isArray(transactionsResponse?.transactions)
            ? transactionsResponse.transactions
            : Array.isArray(transactionsResponse)
                ? transactionsResponse
                : [];

    const inventoryList = Array.isArray(inventory) ? inventory : [];

    const totalCredits = transactionsList.reduce((sum, t) => {
        const creditValue = t?.credit && t.credit !== "0" ? parseFloat(t.credit) : 0;
        return sum + creditValue;
    }, 0);

    const totalDebits = transactionsList.reduce((sum, t) => {
        const debitValue = t?.debit && t.debit !== "0" ? parseFloat(t.debit) : 0;
        return sum + debitValue;
    }, 0);

    const netRevenue = totalCredits - totalDebits;

    const totalInventoryValue = inventoryList.reduce(
        (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)),
        0
    );

    const transactionTrends = transactionsList.reduce((acc, transaction) => {
        const dateStr = transaction?.creation_date || new Date().toISOString();
        const month = fmtShortMonthDay(dateStr);

        if (!acc[month]) acc[month] = { month, credits: 0, debits: 0 };

        const creditValue = transaction?.credit && transaction.credit !== "0"
            ? parseFloat(transaction.credit)
            : 0;

        const debitValue = transaction?.debit && transaction.debit !== "0"
            ? parseFloat(transaction.debit)
            : 0;

        acc[month].credits += creditValue;
        acc[month].debits += debitValue;

        return acc;
    }, {});

    const trendData = Object.values(transactionTrends);

    const revenueByType = transactionsList.reduce((acc, t) => {
        const type = t?.expense_type || 'Unknown';
        if (!acc[type]) acc[type] = 0;

        const creditValue = t?.credit && t.credit !== "0"
            ? parseFloat(t.credit)
            : 0;

        acc[type] += creditValue;
        return acc;
    }, {});

    const revenueTypeData = Object.entries(revenueByType)
        .filter(([_, amount]) => amount > 0)
        .map(([type, amount]) => ({ name: type, value: amount }));

    const transactionColumns = [
        { key: 'creation_date', label: 'Date', render: (value) => fmtDate(value) },
        { key: 'expense_type', label: 'Type' },
        { key: 'description', label: 'Description' },
        { key: 'credit', label: 'Credit', render: (value) => value && value !== "0" ? `₹${parseFloat(value).toLocaleString()}` : '-' },
        { key: 'debit', label: 'Debit', render: (value) => value && value !== "0" ? `₹${parseFloat(value).toLocaleString()}` : '-' }
    ];

    const creditTransactions = transactionsList.filter(t => t?.credit && t.credit !== "0");
    const debitTransactions = transactionsList.filter(t => t?.debit && t.debit !== "0");

    const bgImage = companyDetails?.background_image || null;
 
    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%",
            }}
        >
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Credits"
                            value={`₹${totalCredits.toLocaleString()}`}
                            subtitle="Revenue received"
                            trend="up"
                            trendValue="12.8%"
                            icon="💰"
                            color="success"
                            data={creditTransactions}
                            modalColumns={transactionColumns}
                            modalTitle="Credit Transactions"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Debits"
                            value={`₹${totalDebits.toLocaleString()}`}
                            subtitle="Expenses incurred"
                            icon="📉"
                            color="danger"
                            data={debitTransactions}
                            modalColumns={transactionColumns}
                            modalTitle="Debit Transactions"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Net Revenue"
                            value={`₹${netRevenue.toLocaleString()}`}
                            subtitle="Profit/Loss"
                            trend={netRevenue > 0 ? "up" : "down"}
                            trendValue="18.5%"
                            icon="📊"
                            color={netRevenue > 0 ? "success" : "danger"}
                            data={transactionsList}
                            modalColumns={transactionColumns}
                            modalTitle="All Transactions"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Inventory Value"
                            value={`₹${totalInventoryValue.toLocaleString()}`}
                            subtitle="Asset worth"
                            icon="📦"
                            color="primary"
                        />
                    </Grid>
                </Grid>
 
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                Revenue vs Expenses Trend
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="credits" fill={COLORS.success[0]} name="Credits" />
                                    <Bar dataKey="debits" fill={COLORS.danger[0]} name="Debits" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>
 
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <AttachMoneyIcon sx={{ mr: 1 }} />
                                Revenue by Type
                            </Typography>
                            <AdvancedChart
                                type="pie"
                                data={revenueTypeData}
                                config={{ valueKey: 'value' }}
                                height={300}
                            />
                        </Paper>
                    </Grid>
                </Grid>
 
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Financial Performance Summary</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color={netRevenue > 0 ? "success.main" : "error.main"} fontWeight="bold">
                                            {totalCredits > 0 ? ((netRevenue / totalCredits) * 100).toFixed(1) : 0}%
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Profit Margin</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                                            {transactionsList.length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Total Transactions</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="success.main" fontWeight="bold">
                                            {creditTransactions.length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Credit Entries</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="error.main" fontWeight="bold">
                                            {debitTransactions.length}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Debit Entries</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                                            {creditTransactions.length > 0 ? (totalCredits / creditTransactions.length).toFixed(0) : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Avg Credit</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={2}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h4" color="info.main" fontWeight="bold">
                                            {debitTransactions.length > 0 ? (totalDebits / debitTransactions.length).toFixed(0) : 0}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">Avg Debit</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
 

// Operations Center Section
function OperationsCenter({ companyDetails, startDate, endDate }) {
    const bgImage = companyDetails?.background_image || null;

    //   date formatter
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
    };

    //   dynamic URLs (ONLY change here)
    const customerUrl =
        startDate && endDate
            ? `/customer?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
            : `/customer/`;

    const appointmentUrl =
        startDate && endDate
            ? `/appointment?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
            : `/appointment/`;

    //   API calls (auto refetch on date change)
    const { data: customers, loading: customersLoading } =
        useApiData(customerUrl, [startDate, endDate]);

    const { data: appointments, loading: appointmentsLoading } =
        useApiData(appointmentUrl, [startDate, endDate]);

    if (customersLoading || appointmentsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    const customersList = Array.isArray(customers) ? customers : [];
    const appointmentsList = Array.isArray(appointments) ? appointments : [];
 
    const geoData = customersList.reduce((acc, customer) => {
        const city = customer?.contact?.address?.city || 'Unknown';
        const state = customer?.contact?.address?.state || 'Unknown';
        const key = `${city}, ${state}`;
 
        if (!acc[key]) {
            acc[key] = { city, state, count: 0, appointments: 0 };
        }
        acc[key].count += 1;
        return acc;
    }, {});
 
    appointmentsList.forEach(appointment => {
        const customer = customersList.find(c => c?.customer_id === appointment?.customer_id);
        if (customer) {
            const city = customer?.contact?.address?.city || 'Unknown';
            const state = customer?.contact?.address?.state || 'Unknown';
            const key = `${city}, ${state}`;
            if (geoData[key]) {
                geoData[key].appointments += 1;
            }
        }
    });
 
    const mapData = Object.values(geoData).sort((a, b) => b.count - a.count);
    const uniqueStates = new Set(customersList.map(c => c?.contact?.address?.state).filter(Boolean));
 
    
 
    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%",
            }}
        >
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Service Areas"
                            value={Object.keys(geoData).length.toLocaleString()}
                            subtitle="Active locations"
                            icon="🗺️"
                            color="primary"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Top Market"
                            value={mapData[0]?.city || 'N/A'}
                            subtitle={`${mapData[0]?.count || 0} customers`}
                            icon="🎯"
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Coverage"
                            value={`${uniqueStates.size} States`}
                            subtitle="Geographic reach"
                            icon="📍"
                            color="purple"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Avg Density"
                            value={`${(customersList.length / Math.max(Object.keys(geoData).length, 1)).toFixed(1)}`}
                            subtitle="Customers per area"
                            icon="📊"
                            color="warning"
                        />
                    </Grid>
                </Grid>
 
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <MapIcon sx={{ mr: 1 }} />
                                Service Area Density Map
                            </Typography>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                                borderRadius: 2,
                                p: 3,
                                minHeight: 400
                            }}>
                                <Typography variant="h6" color="primary.main" gutterBottom>
                                    Customer & Service Distribution
                                </Typography>
                                <Grid container spacing={1} sx={{ mt: 2 }}>
                                    {mapData.slice(0, 16).map((location, index) => {
                                        const intensity = (location.count / Math.max(...mapData.map(l => l.count))) * 100;
                                        const hasServices = location.appointments > 0;
                                        return (
                                            <Grid item xs={3} key={`${location.city}-${location.state}`}>
                                                <Box
                                                    sx={{
                                                        minHeight: 80,
                                                        borderRadius: 2,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                                                        color: intensity > 50 ? 'white' : 'primary.main',
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        transition: 'transform 0.2s',
                                                        '&:hover': { transform: 'scale(1.05)' }
                                                    }}
                                                >
                                                    <Typography variant="h6" fontWeight="bold">{location.count}</Typography>
                                                    <Typography variant="caption" textAlign="center">
                                                        {location.city}
                                                    </Typography>
                                                    {hasServices && (
                                                        <Box
                                                            sx={{
                                                                position: 'absolute',
                                                                top: 4,
                                                                right: 4,
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: '50%',
                                                                backgroundColor: 'success.main'
                                                            }}
                                                        />
                                                    )}
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                                <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: 'rgba(59, 130, 246, 0.3)', borderRadius: 1 }} />
                                        <Typography variant="caption">Low Density</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ width: 16, height: 16, backgroundColor: 'primary.main', borderRadius: 1 }} />
                                        <Typography variant="caption">High Density</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'success.main' }} />
                                        <Typography variant="caption">Active Services</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
 
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Service Location Rankings</Typography>
                            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                                {mapData.slice(0, 10).map((location, index) => {
                                    const percentage = (location.count / customersList.length) * 100;
                                    return (
                                        <Box key={`${location.city}-${location.state}`} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography variant="h6" color="primary.main">#{index + 1}</Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    {location.count} customers
                                                </Typography>
                                            </Box>
                                            <Typography variant="subtitle1" fontWeight="bold">{location.city}</Typography>
                                            <Typography variant="body2" color="textSecondary">{location.state}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {location.appointments} service appointments
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={percentage}
                                                sx={{
                                                    mt: 1,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    backgroundColor: 'grey.200',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 3,
                                                        backgroundColor: COLORS.primary[index % COLORS.primary.length]
                                                    }
                                                }}
                                            />
                                            <Typography variant="caption" color="textSecondary">
                                                {percentage.toFixed(1)}% of total
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
 
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <TrendingUpIcon sx={{ mr: 1 }} />
                                Service Route Efficiency
                            </Typography>
                            <AdvancedChart
                                type="bar"
                                data={mapData.slice(0, 8).map(location => ({
                                    location: location.city.substring(0, 10),
                                    customers: location.count,
                                    services: location.appointments
                                }))}
                                config={{ xKey: 'location', yKey: 'customers', color: COLORS.teal[0] }}
                                height={300}
                            />
                        </Paper>
                    </Grid>
 
                    <Grid item xs={12} lg={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <InsightsIcon sx={{ mr: 1 }} />
                                Market Penetration Metrics
                            </Typography>
                            <Grid container spacing={3} sx={{ mt: 1 }}>
                                <Grid item xs={12}>
                                    <Box textAlign="center" p={2}>
                                        <Typography variant="h3" color="primary.main" fontWeight="bold">
                                            {((mapData.filter(l => l.count >= 5).length / mapData.length) * 100).toFixed(1)}%
                                        </Typography>
                                        <Typography variant="h6" color="textSecondary">High-Density Markets</Typography>
                                        <Typography variant="body2" color="textSecondary">Geographic coverage</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2} bgcolor="success.light" color="white" borderRadius={2}>
                                        <Typography variant="h4" fontWeight="bold">
                                            {mapData.filter(l => l.appointments >= 3).length}
                                        </Typography>
                                        <Typography variant="body2">Active Service Areas</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box textAlign="center" p={2} bgcolor="warning.light" color="white" borderRadius={2}>
                                        <Typography variant="h4" fontWeight="bold">
                                            {mapData.filter(l => l.count < 3).length}
                                        </Typography>
                                        <Typography variant="body2">Growth Opportunities</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
}
// Workforce Analytics Section
function WorkforceAnalytics({ startDate, endDate, companyDetails }) {

    //   format date to YYYY-MM-DD
    const formatDate = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    //   dynamic API url
    const appointmentApi =
        formattedStartDate && formattedEndDate
            ? `/appointment/reports/get_appointments_by_date/${formattedStartDate}/${formattedEndDate}`
            : `/appointment`;

    //   API calls
    const { data: users, loading: usersLoading } = useApiData('/auth/users');

    const { data: appointments, loading: appointmentsLoading } =
        useApiData(appointmentApi, [formattedStartDate, formattedEndDate]);

    //   loading state
    if (usersLoading || appointmentsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    //   safe arrays
    const usersList = Array.isArray(users) ? users : [];
    const appointmentsList = Array.isArray(appointments) ? appointments : [];


    const mechanics = usersList.filter(user =>
        user?.role_type?.toLowerCase().includes('mechanic') ||
        user?.role?.toLowerCase().includes('mechanic') ||
        user?.role?.toLowerCase().includes('technician')
    );

    const mechanicWorkload = mechanics.map(mechanic => {
        const assignedAppointments = appointmentsList.filter(apt =>
            apt?.assigned_to === mechanic?.user_id ||
            apt?.technician_id === mechanic?.user_id ||
            apt?.mechanic_id === mechanic?.user_id
        );

        const completedWork = assignedAppointments.filter(apt =>
            apt?.status?.toLowerCase().includes('invoiced')
        );

        return {
            mechanicId: mechanic?.user_id || '',
            mechanicName: mechanic?.username || mechanic?.name || 'Unknown',
            totalAssigned: assignedAppointments.length,
            completed: completedWork.length,
            efficiency: assignedAppointments.length > 0 ?
                (completedWork.length / assignedAppointments.length) * 100 : 0
        };
    });

    const sortedByWorkload = [...mechanicWorkload].sort((a, b) => b.totalAssigned - a.totalAssigned);
    const topPerformers = sortedByWorkload.slice(0, 5);

    const totalMechanics = mechanics.length;
    const totalWorkAssigned = mechanicWorkload.reduce((sum, m) => sum + m.totalAssigned, 0);
    const avgWorkPerMechanic = totalWorkAssigned / Math.max(totalMechanics, 1);

    const mechanicColumns = [
        { key: 'mechanicId', label: 'ID' },
        { key: 'mechanicName', label: 'Name' },
        { key: 'totalAssigned', label: 'Assigned Jobs' },
        { key: 'completed', label: 'Completed' },
        { key: 'efficiency', label: 'Efficiency %', render: (value) => `${value.toFixed(1)}%` }
    ];

    //   ONLY ADD THIS (BACKGROUND IMAGE)
    const bgImage = companyDetails?.background_image || null;

    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                minHeight: "100vh",
                width: "100%",
            }}
        >
            {/*   YOUR ORIGINAL DESIGN STARTS — UNCHANGED */}
            <Box sx={{ p: 3 }}>

                {/* Mechanic KPIs */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Mechanics"
                            value={totalMechanics.toLocaleString()}
                            subtitle="Active technicians"
                            icon="👨‍🔧"
                            color="primary"
                            data={mechanicWorkload}
                            modalColumns={mechanicColumns}
                            modalTitle="Mechanic Directory"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Work Assigned"
                            value={totalWorkAssigned.toLocaleString()}
                            subtitle="Total appointments"
                            icon="📋"
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Avg Workload"
                            value={avgWorkPerMechanic.toFixed(1)}
                            subtitle="Appointments per mechanic"
                            icon="⚖️"
                            color="purple"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Top Performer"
                            value={topPerformers[0]?.mechanicName || 'N/A'}
                            subtitle={`${topPerformers[0]?.totalAssigned || 0} appointments`}
                            icon="🏆"
                            color="warning"
                            data={topPerformers}
                            modalColumns={mechanicColumns}
                            modalTitle="Top Performing Mechanics"
                        />
                    </Grid>
                </Grid>

            {/* Mechanic Performance Analysis */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Mechanic Workload Distribution
                        </Typography>
                        <AdvancedChart
                            type="bar"
                            data={mechanicWorkload.map(m => ({
                                name: m.mechanicName.substring(0, 10),
                                workload: m.totalAssigned
                            }))}
                            config={{ xKey: 'name', yKey: 'workload', color: COLORS.primary[0] }}
                            height={350}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <ConstructionIcon sx={{ mr: 1 }} />
                            Efficiency Comparison
                        </Typography>
                        <AdvancedChart
                            type="bar"
                            data={mechanicWorkload.map(m => ({
                                name: m.mechanicName.substring(0, 10),
                                efficiency: m.efficiency
                            }))}
                            config={{ xKey: 'name', yKey: 'efficiency', color: COLORS.success[0] }}
                            height={350}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Performance Insights */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <InsightsIcon sx={{ mr: 1 }} />
                            Top Performing Mechanics
                        </Typography>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {topPerformers.map((mechanic, index) => (
                                <Box
                                    key={mechanic.mechanicId}
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        bgcolor: 'success.light',
                                        color: 'white',
                                        borderRadius: 2,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <Box display="flex" alignItems="center">
                                        <Box
                                            sx={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: '50%',
                                                backgroundColor: 'success.dark',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                mr: 2
                                            }}
                                        >
                                            {index + 1}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {mechanic.mechanicName}
                                            </Typography>
                                            <Typography variant="caption">
                                                {mechanic.mechanicId}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box textAlign="right">
                                        <Typography variant="h6" fontWeight="bold">
                                            {mechanic.totalAssigned} jobs
                                        </Typography>
                                        <Typography variant="caption">
                                            {mechanic.efficiency.toFixed(1)}% efficiency
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Performance Insights
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Workload Balance</Typography>
                                <Typography variant="body2">
                                    {Math.max(0, (topPerformers[0]?.totalAssigned || 0) - avgWorkPerMechanic).toFixed(0)} appointments difference between top and average performers
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Efficiency Leader</Typography>
                                <Typography variant="body2">
                                    {mechanicWorkload.sort((a, b) => b.efficiency - a.efficiency)[0]?.mechanicName || 'N/A'} leads with {mechanicWorkload.sort((a, b) => b.efficiency - a.efficiency)[0]?.efficiency.toFixed(1) || 0}% completion rate
                                </Typography>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">Optimization Opportunity</Typography>
                                <Typography variant="body2">
                                    Redistribute {Math.max(0, (topPerformers[0]?.totalAssigned || 0) - avgWorkPerMechanic).toFixed(0)} appointments for better balance
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Workforce Summary */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Workforce Performance Summary</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {mechanicWorkload.length > 0 ? (mechanicWorkload.reduce((sum, m) => sum + m.efficiency, 0) / mechanicWorkload.length).toFixed(1) : 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Avg Efficiency</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {mechanicWorkload.filter(m => m.totalAssigned > avgWorkPerMechanic).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">High Performers</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {mechanicWorkload.filter(m => m.totalAssigned < avgWorkPerMechanic * 0.7).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Under Utilized</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                        {mechanicWorkload.reduce((sum, m) => sum + m.completed, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Total Completed</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="error.main" fontWeight="bold">
                                        {totalWorkAssigned - mechanicWorkload.reduce((sum, m) => sum + m.completed, 0)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Pending Work</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="purple.main" fontWeight="bold">
                                        {mechanicWorkload.filter(m => m.efficiency >= 80).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Efficient Workers</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        </Box>
    );
}


// Inventory Margins Section - Profit Analysis
function InventoryMargins({ startDate, endDate, companyDetails }) {

  // =========================================================
  // 1. ALL HOOKS FIRST (NEVER WRITE RETURN BEFORE THIS)
  // =========================================================

  const bgImage = companyDetails?.background_image || null;

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

  const appointmentUrl =
    startDate && endDate
      ? `/appointment?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
      : `/appointment`;

  const { data: appointments, loading: appointmentsLoading } =
    useApiData(appointmentUrl, [startDate, endDate]);

  const inventoryUrl =
  startDate && endDate
    ? `/inventory?limit=100000&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
    : `/inventory?limit=100000`;

  const { data: inventory, loading: inventoryLoading } =
   useApiData(inventoryUrl, [startDate, endDate]);

  const loading = appointmentsLoading || inventoryLoading;

  // =========================================================
  // 2. SAFE DERIVED DATA
  // =========================================================

  const appointmentsList = Array.isArray(appointments) ? appointments : [];
  const inventoryList = Array.isArray(inventory) ? inventory : [];
  console.log("Inventory Data:", inventoryList);
  // =========================================================
  // 3. MAIN CALCULATION (useMemo)
  // =========================================================

  const productMargins = useMemo(() => {
    return inventoryList.map(product => {
      const buyingPrice = parseFloat(product?.buying_price || product?.cost_price || 0);
      const sellingPrice = parseFloat(product?.price || 0);
      const quantity = parseInt(product?.quantity || 0);

      const totalBuyingCost = buyingPrice * quantity;
      const totalSellingValue = sellingPrice * quantity;

      const profitPerUnit = Math.max(0, sellingPrice - buyingPrice);
      const totalProfit = profitPerUnit * quantity;

      const marginPercent =
        totalSellingValue > 0 ? (totalProfit / totalSellingValue) * 100 : 0;

      const usageCount = appointmentsList.filter(apt => {
        const service = apt?.service_type?.toLowerCase() || "";
        const desc = apt?.description?.toLowerCase() || "";
        const notes = apt?.notes?.toLowerCase() || "";
        const category = product?.category?.toLowerCase() || "";
        const name = product?.part_name?.toLowerCase() || "";

        return (
          service.includes(category) ||
          desc.includes(name) ||
          notes.includes(name)
        );
      }).length;

      return {
        inventory_id: product?.inventory_id,
        part_name: product?.part_name,
        category: product?.category,
        quantity,
        buyingPrice,
        sellingPrice,
        totalBuyingCost,
        totalSellingValue,
        profitPerUnit,
        totalProfit,
        marginPercent,
        usageCount
      };
    });
  },  [inventoryList, appointmentsList, startDate, endDate]);

  // =========================================================
  // 4. SORTING (useMemo)
  // =========================================================

  const sortedByProfit = useMemo(() => {
    return [...productMargins].sort((a, b) => b.totalProfit - a.totalProfit);
  }, [productMargins]);

  const sortedByMargin = useMemo(() => {
    return [...productMargins].sort((a, b) => b.marginPercent - a.marginPercent);
  }, [productMargins]);

  // =========================================================
  // 5. SUMMARY (useMemo)
  // =========================================================

  const {
    totalSellingValue,
    totalCostValue,
    totalMarginValue,
    averageMarginPercent,
    highMarginProducts,
    lowMarginProducts
  } = useMemo(() => {
    const totalSellingValue = productMargins.reduce((sum, p) => sum + p.totalSellingValue, 0);
    const totalCostValue = productMargins.reduce((sum, p) => sum + p.totalBuyingCost, 0);
    const totalMarginValue = productMargins.reduce((sum, p) => sum + p.totalProfit, 0);

    const averageMarginPercent =
      productMargins.length
        ? productMargins.reduce((sum, p) => sum + p.marginPercent, 0) / productMargins.length
        : 0;

    const highMarginProducts = productMargins.filter(p => p.marginPercent >= 40).length;
    const lowMarginProducts = productMargins.filter(p => p.marginPercent < 10).length;

    return {
      totalSellingValue,
      totalCostValue,
      totalMarginValue,
      averageMarginPercent,
      highMarginProducts,
      lowMarginProducts
    };
  },  [productMargins, startDate, endDate]);

  // =========================================================
  // 6. LOADING (ONLY AFTER ALL HOOKS)
  // =========================================================

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={400}>
        <CircularProgress />
      </Box>
    );
  }

  // =========================================================
  // 7. UI (YOUR ORIGINAL DESIGN - NO CHANGE)
  // =========================================================

  const marginColumns = [
    { key: 'part_name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'buyingPrice', label: 'Buying Price', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'sellingPrice', label: 'Selling Price', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'profitPerUnit', label: 'Profit/Unit', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'marginPercent', label: 'Margin %', render: (v) => `${(v || 0).toFixed(1)}%` }
  ];

  return (
    <Box
      sx={{
        p: 3,
        backgroundImage: bgImage
          ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
          : "none",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Box sx={{ p: 3 }}>

        {/* ================= KPI SECTION (UNCHANGED UI) ================= */}
        <Grid container spacing={3} sx={{ mb: 4 }}>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Selling Value"
              value={`₹${totalSellingValue.toLocaleString()}`}
              subtitle="All products"
              trend="up"
              trendValue="12.3%"
              icon="💵"
              color="primary"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Cost Value"
              value={`₹${totalCostValue.toLocaleString()}`}
              subtitle="Investment"
              icon="📦"
              color="warning"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Total Margin"
              value={`₹${totalMarginValue.toLocaleString()}`}
              subtitle="Gross profit"
              trend="up"
              trendValue="18.5%"
              icon="📈"
              color="success"
              data={sortedByProfit}
              modalColumns={marginColumns}
              modalTitle="Product Profit Details"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KPICard
              title="Avg Margin %"
              value={`${averageMarginPercent.toFixed(1)}%`}
              subtitle="Average profitability"
              trend="up"
              trendValue="5.2%"
              icon="📊"
              color="purple"
            />
          </Grid>

        </Grid>

            {/* Margin Analysis Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Top Profit Products
                        </Typography>
                        <AdvancedChart
                            type="bar"
                            data={sortedByProfit.slice(0, 10).map(p => ({
                                name: p.part_name.substring(0, 15),
                                profit: Math.round(p.totalProfit)
                            }))}
                            config={{ xKey: 'name', yKey: 'profit', color: COLORS.success[0] }}
                            height={300}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <AttachMoneyIcon sx={{ mr: 1 }} />
                            Margin % Distribution
                        </Typography>
                        <AdvancedChart
                            type="pie"
                            data={[
                                { name: 'High Margin (40%+)', value: highMarginProducts },
                                { name: 'Medium Margin (10-40%)', value: productMargins.filter(p => p.marginPercent >= 10 && p.marginPercent < 40).length },
                                { name: 'Low Margin (below 10%)', value: lowMarginProducts }
                            ]}
                            config={{ valueKey: 'value' }}
                            height={300}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Detailed Margin Analysis */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Top Margin Products */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Highest Margin Products
                        </Typography>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {sortedByMargin.slice(0, 5).map((product, index) => (
                                <Box key={product?.inventory_id} sx={{ mb: 2, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            #{index + 1}
                                        </Typography>
                                        <Chip label={`${product.marginPercent.toFixed(1)}%`} color="success" size="small" />
                                    </Box>
                                    <Typography variant="body2" fontWeight="bold">{product.part_name}</Typography>
                                    <Typography variant="caption">{product.category}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption">
                                            Profit: ₹{product.totalProfit.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Lowest Margin Products */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingDownIcon sx={{ mr: 1 }} />
                            Lowest Margin Products
                        </Typography>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                            {sortedByMargin.slice(-5).reverse().map((product, index) => (
                                <Box key={product?.inventory_id} sx={{ mb: 2, p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            Low #{index + 1}
                                        </Typography>
                                        <Chip label={`${product.marginPercent.toFixed(1)}%`} color="warning" size="small" />
                                    </Box>
                                    <Typography variant="body2" fontWeight="bold">{product.part_name}</Typography>
                                    <Typography variant="caption">{product.category}</Typography>
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption">
                                            Profit: ₹{product.totalProfit.toLocaleString()}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Margin Statistics */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <InsightsIcon sx={{ mr: 1 }} />
                            Margin Insights
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {highMarginProducts}
                                </Typography>
                                <Typography variant="body2">High Margin Products (40%+)</Typography>
                            </Box>

                            <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {productMargins.filter(p => p.marginPercent >= 10 && p.marginPercent < 40).length}
                                </Typography>
                                <Typography variant="body2">Medium Margin Products</Typography>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    {lowMarginProducts}
                                </Typography>
                                <Typography variant="body2">Low Margin Products (below 10%)</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Comprehensive Margin Summary */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Margin Performance Summary</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {productMargins.length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Total Products</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                      {totalSellingValue > 0
  ? ((totalMarginValue / totalSellingValue) * 100).toFixed(1)
  : 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Overall Margin %</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                       {productMargins.length
  ? Math.max(...productMargins.map(p => p.marginPercent)).toFixed(1)
  : 0}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Max Margin</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {Math.min(...productMargins.map(p => p.marginPercent)).toFixed(1)}%
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Min Margin</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold" sx={{ fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {sortedByProfit[0]?.part_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Top Profit</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        ₹{totalMarginValue.toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Gross Margin</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        </Box>
    );
}

// Inventory Intelligence Section
function InventoryIntelligence({ startDate, endDate, companyDetails }) {

    const bgImage = companyDetails?.background_image || null;

    // =========================
    // 1. ADD THIS (DATE FORMATTER)
    // =========================
    const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
    };

    const formattedStart = formatDate(startDate);
    const formattedEnd = formatDate(endDate);

    // =========================
    // 2. ADD THIS (API URL + REFRESH KEY)
    // =========================
    const apiUrl =
        formattedStart && formattedEnd
            ? `/inventory?limit=100000&startDate=${formattedStart}&endDate=${formattedEnd}`
            : `/inventory?limit=100000`;

    const refreshKey = `${formattedStart}-${formattedEnd}`;

    // =========================
    // 3. API CALL (REPLACE OLD useApiData HERE)
    // =========================
    const { data: inventory, loading } = useApiData(apiUrl, [
        refreshKey
    ]);

    // =========================
    // 4. NOW LOADING CHECK
    // =========================
    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    // =========================
    // 5. ONLY AFTER THIS → CALCULATIONS START
    // =========================
    const inventoryList = Array.isArray(inventory) ? inventory : [];

    const totalItems = inventoryList.length;

    const totalValue = inventoryList.reduce(
        (sum, item) => sum + ((item?.price || 0) * (item?.quantity || 0)),
        0
    );

    const lowStockItems = inventoryList.filter(i => (i?.quantity || 0) < 5).length;

    const outOfStockItems = inventoryList.filter(i => (i?.quantity || 0) === 0).length;

    const categoryData = inventoryList.reduce((acc, item) => {
        const category = item?.category || "Unknown";
        if (!acc[category]) acc[category] = { count: 0, value: 0 };

        acc[category].count += 1;
        acc[category].value += (item?.price || 0) * (item?.quantity || 0);

        return acc;
    }, {});

    const categoryChartData = Object.entries(categoryData).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
    }));

    const topItems = inventoryList
        .map(item => ({
            ...item,
            totalValue: (item?.price || 0) * (item?.quantity || 0)
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10);

    const lowStockList = inventoryList.filter(item => (item?.quantity || 0) <= 5).slice(0, 5);

    const inventoryColumns = [
        { key: "inventory_id", label: "ID" },
        { key: "part_name", label: "Part Name" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "price", label: "Price", render: (v) => `₹${(v || 0).toLocaleString()}` },
        {
            key: "totalValue",
            label: "Total Value",
            render: (v, row) =>
                `₹${((row?.price || 0) * (row?.quantity || 0)).toLocaleString()}`
        }
    ];

    return (
        <Box
            sx={{
                p: 3,
                minHeight: "100vh",
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "url('/bg.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                position: "relative"
            }}
        >
            <Box sx={{ position: "relative", zIndex: 1 }}>

                {/* ================= KPI SECTION (NO CHANGE) ================= */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Items"
                            value={totalItems.toLocaleString()}
                            subtitle="Inventory count"
                            icon="📦"
                            color="primary"
                            data={inventoryList}
                            modalColumns={inventoryColumns}
                            modalTitle="Complete Inventory"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Total Value"
                            value={`₹${totalValue.toLocaleString()}`}
                            subtitle="Asset worth"
                            icon="💰"
                            color="success"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Low Stock Alerts"
                            value={lowStockItems.toLocaleString()}
                            subtitle="Items need restocking"
                            icon="⚠️"
                            color="warning"
                            data={lowStockList}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Out of Stock"
                            value={outOfStockItems.toLocaleString()}
                            subtitle="Critical shortage"
                            icon="🔴"
                            color="danger"
                            data={inventoryList.filter(i => (i?.quantity || 0) === 0)}
                        />
                    </Grid>
                </Grid>

            {/* Inventory Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <InventoryIcon sx={{ mr: 1 }} />
                            Inventory by Category
                        </Typography>
                        <AdvancedChart
                            type="pie"
                            data={categoryChartData.map(item => ({ name: item.category, value: item.count }))}
                            config={{ valueKey: 'value' }}
                            height={300}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <AttachMoneyIcon sx={{ mr: 1 }} />
                            Value Distribution
                        </Typography>
                        <AdvancedChart
                            type="bar"
                            data={categoryChartData}
                            config={{ xKey: 'category', yKey: 'value', color: COLORS.success[0] }}
                            height={300}
                        />
                    </Paper>
                </Grid>
            </Grid>

            {/* Inventory Intelligence Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Stock Alerts */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingDownIcon sx={{ mr: 1 }} />
                            Stock Alerts
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {lowStockList.map((item, index) => (
                                <Box key={item?.inventory_id || index} sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {item?.part_name || 'Unknown Item'}
                                            </Typography>
                                            <Typography variant="caption">
                                                {item?.category || 'Unknown Category'}
                                            </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="h6" fontWeight="bold">
                                                {item?.quantity || 0} left
                                            </Typography>
                                            <Typography variant="caption">
                                                ₹{(item?.price || 0).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Top Value Items */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <InsightsIcon sx={{ mr: 1 }} />
                            High-Value Items
                        </Typography>
                        <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                            {topItems.slice(0, 5).map((item, index) => (
                                <Box key={item?.inventory_id || index} sx={{ mb: 2, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="bold">
                                                {item?.part_name || 'Unknown Item'}
                                            </Typography>
                                            <Typography variant="caption">
                                                {item?.category || 'Unknown Category'}
                                            </Typography>
                                        </Box>
                                        <Box textAlign="right">
                                            <Typography variant="h6" fontWeight="bold">
                                                ₹{(item?.totalValue || 0).toLocaleString()}
                                            </Typography>
                                            <Typography variant="caption">
                                                {item?.quantity || 0} units
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Inventory Health */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Inventory Health
                        </Typography>
                        <Box sx={{ mt: 3 }}>
                            <Box textAlign="center" mb={3}>
                                <Typography variant="h3" color="success.main" fontWeight="bold">
                                    {totalItems > 0 ? ((inventoryList.filter(item => (item?.quantity || 0) > 5).length / totalItems) * 100).toFixed(1) : 0}%
                                </Typography>
                                <Typography variant="h6" color="textSecondary">Healthy Stock</Typography>
                            </Box>

                            <Box sx={{ space: 3 }}>
                                <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">Well Stocked</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                        {inventoryList.filter(item => (item?.quantity || 0) > 10).length}
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">Need Reorder</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="warning.main">
                                        {lowStockItems}
                                    </Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="body2" color="textSecondary">Critical</Typography>
                                    <Typography variant="body2" fontWeight="bold" color="error.main">
                                        {outOfStockItems}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Inventory Summary */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Inventory Health Summary</Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {inventoryList.filter(item => (item?.quantity || 0) > 10).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Well Stocked</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {inventoryList.filter(item => (item?.quantity || 0) >= 5 && (item?.quantity || 0) <= 10).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Moderate Stock</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {inventoryList.filter(item => (item?.quantity || 0) > 0 && (item?.quantity || 0) < 5).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Low Stock</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="error.main" fontWeight="bold">
                                        {outOfStockItems}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Out of Stock</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="info.main" fontWeight="bold">
                                        {Object.keys(categoryData).length}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Categories</Typography>
                                </Box>
                            </Grid> 
                            <Grid item xs={12} sm={6} md={2}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" color="purple.main" fontWeight="bold">
                                        ₹{totalItems > 0 ? (totalValue / totalItems).toFixed(0) : 0}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">Avg Item Value</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        </Box>
    );
}

// Business Insights Section
function BusinessInsights({ startDate, endDate, companyDetails }) {
    console.log("BusinessInsights Props:", { startDate, endDate, companyDetails });

    //   Date formatter (FIX)
    const formatDate = (date) => (date ? dayjs(date).format("YYYY-MM-DD") : "");

    //   Apply date filter like FinancialDashboard
    const customerUrl = `/customer?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
    const transactionUrl = `/finance/transactions?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;
    const appointmentUrl = `/appointment?startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`;

    const { data: customers, loading: customersLoading } =
        useApiData(customerUrl, [startDate, endDate]);

    const { data: transactionsResponse, loading: transactionsLoading } =
        useApiData(transactionUrl, [startDate, endDate]);

    const { data: appointments, loading: appointmentsLoading } =
        useApiData(appointmentUrl, [startDate, endDate]);

    if (customersLoading || transactionsLoading || appointmentsLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
            </Box>
        );
    }

    const customersList = Array.isArray(customers) ? customers : [];

    const transactionsList = Array.isArray(transactionsResponse?.data)
        ? transactionsResponse.data
        : Array.isArray(transactionsResponse?.transactions)
            ? transactionsResponse.transactions
            : Array.isArray(transactionsResponse)
                ? transactionsResponse
                : [];

    const appointmentsList = Array.isArray(appointments) ? appointments : [];

    // 🔥 Background Image
    const bgImage = companyDetails?.background_image || null;

const filterByDate = (list, key) => {
    if (!startDate || !endDate) return list;

    const start = new Date(startDate);
    const end = new Date(endDate);

    return list.filter(item => {
        try {
            const date = new Date(item?.[key]);
            return date >= start && date <= end;
        } catch {
            return false;
        }
    });
};
const filteredCustomers = filterByDate(customersList, "created_at");

// 🔥 IMPORTANT: CHANGE FIELD IF NEEDED
const filteredTransactions = filterByDate(
    transactionsList,
    "transaction_date" // 👉 if not working, change to "created_at"
);

const filteredAppointments = filterByDate(
    appointmentsList,
    "appointment_date" // 👉 if not working, change to "created_at"
);
//   FALLBACK IF FILTER RETURNS EMPTY
const finalCustomers =
    filteredCustomers.length > 0 ? filteredCustomers : customersList;

const finalTransactions =
    filteredTransactions.length > 0 ? filteredTransactions : transactionsList;

const finalAppointments =
    filteredAppointments.length > 0 ? filteredAppointments : appointmentsList;

    // 📊 Calculations (UNCHANGED)
    // const customerGrowth = customersList.filter(c => {
    //     try {
    //         const date = new Date(c?.created_at);
    //         const lastMonth = new Date();
    //         lastMonth.setMonth(lastMonth.getMonth() - 1);
    //         return date > lastMonth;
    //     } catch {
    //         return false;
    //     }
    // }).length;
   //   CALCULATIONS (FIXED)

const customerGrowth = finalCustomers.length;

const totalRevenue = finalTransactions.reduce((sum, t) => {
    const creditValue =
        t?.credit && t.credit !== "0" && t.credit !== null
            ? parseFloat(t.credit)
            : 0;
    return sum + (isNaN(creditValue) ? 0 : creditValue);
}, 0);

const totalExpenses = finalTransactions.reduce((sum, t) => {
    const debitValue =
        t?.debit && t.debit !== "0" && t.debit !== null
            ? parseFloat(t.debit)
            : 0;
    return sum + (isNaN(debitValue) ? 0 : debitValue);
}, 0);

const profitMargin =
    totalRevenue > 0
        ? ((totalRevenue - totalExpenses) / totalRevenue) * 100
        : 0;

const serviceUtilization =
    finalAppointments.length / Math.max(finalCustomers.length, 1);

const completionRate =
    finalAppointments.length > 0
        ? (finalAppointments.filter(a =>
              a?.status?.toLowerCase().includes("completed")
          ).length / finalAppointments.length) * 100
        : 0;

//   FORECAST (NOW WORKS)
const revenueProjection = totalRevenue * 1.15;
const growthForecast = Math.round(customerGrowth * 1.2);
const marketOpportunity =
    Math.round((finalCustomers.length * 2.5) - finalCustomers.length);     

    //   YOUR UI BELOW — NO CHANGES
    return (
        <Box
            sx={{
                backgroundImage: bgImage
                    ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
                    : "none",
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                minHeight: "100vh",
                width: "100%"
            }}
        >
            <Box sx={{ p: 3 }}>

                {/* KPI Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Customer Growth"
                            value={`+${customerGrowth}`}
                            subtitle="New customers this month"
                            icon="📈"
                            color="success"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Profit Margin"
                            value={`${profitMargin.toFixed(1)}%`}
                            subtitle="Business efficiency"
                            icon="💰"
                            color={profitMargin > 0 ? "success" : "danger"}
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Service Rate"
                            value={serviceUtilization.toFixed(1)}
                            subtitle="Services per customer"
                            icon="⚙️"
                            color="primary"
                        />
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <KPICard
                            title="Completion Rate"
                            value={`${completionRate.toFixed(1)}%`}
                            subtitle="Service efficiency"
                            icon=" "
                            color="purple"
                        />
                    </Grid>
                </Grid>

            {/* Strategic Insights */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingUpIcon sx={{ mr: 1 }} />
                            Growth Opportunities
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'success.main' }}>
                                <Typography variant="h6" fontWeight="bold">Market Expansion</Typography>
                                <Typography variant="body2">
                                    {customerGrowth} new customers added this month - strong growth trajectory
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'primary.main' }}>
                                <Typography variant="h6" fontWeight="bold">Service Optimization</Typography>
                                <Typography variant="body2">
                                    Current {completionRate.toFixed(1)}% completion rate shows room for process improvement
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: 'purple.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'purple.main' }}>
                                <Typography variant="h6" fontWeight="bold">Revenue Enhancement</Typography>
                                <Typography variant="body2">
                                    ₹{totalRevenue.toLocaleString()} total revenue with {profitMargin.toFixed(1)}% margin
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} lg={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <TrendingDownIcon sx={{ mr: 1 }} />
                            Risk Assessment
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'warning.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'warning.main' }}>
                                <Typography variant="h6" fontWeight="bold">Operational Efficiency</Typography>
                                <Typography variant="body2">
                                    {appointmentsList.filter(a => a?.status?.includes('pending')).length} pending appointments need attention
                                </Typography>
                            </Box>
                            <Box sx={{ mb: 2, p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'error.main' }}>
                                <Typography variant="h6" fontWeight="bold">Financial Management</Typography>
                                <Typography variant="body2">
                                    Total expenses ₹{totalExpenses.toLocaleString()} - monitor cost control
                                </Typography>
                            </Box>
                            <Box sx={{ p: 2, bgcolor: 'info.light', color: 'white', borderRadius: 2, borderLeft: 4, borderColor: 'info.main' }}>
                                <Typography variant="h6" fontWeight="bold">Market Competition</Typography>
                                <Typography variant="body2">
                                    Service utilization rate {serviceUtilization.toFixed(1)} indicates market saturation risk
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Performance Benchmarks */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <InsightsIcon sx={{ mr: 1 }} />
                            Performance Benchmarks
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box
                                    textAlign="center"
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                                        borderRadius: 3
                                    }}
                                >
                                    <Typography variant="h3" color="success.main" fontWeight="bold">
                                        {totalRevenue > totalExpenses ? 'A+' : 'B+'}
                                    </Typography>
                                    <Typography variant="h6" color="textPrimary" fontWeight="medium">Financial Health</Typography>
                                    <Typography variant="body2" color="textSecondary">Overall rating</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box
                                    textAlign="center"
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                                        borderRadius: 3
                                    }}
                                >
                                    <Typography variant="h3" color="primary.main" fontWeight="bold">
                                        {completionRate.toFixed(0)}%
                                    </Typography>
                                    <Typography variant="h6" color="textPrimary" fontWeight="medium">Service Quality</Typography>
                                    <Typography variant="body2" color="textSecondary">Completion rate</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box
                                    textAlign="center"
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
                                        borderRadius: 3
                                    }}
                                >
                                    <Typography variant="h3" color="purple.main" fontWeight="bold">
                                        {Math.round((customerGrowth / Math.max(customersList.length, 1)) * 100)}%
                                    </Typography>
                                    <Typography variant="h6" color="textPrimary" fontWeight="medium">Growth Rate</Typography>
                                    <Typography variant="body2" color="textSecondary">Monthly expansion</Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box
                                    textAlign="center"
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #FFF3E0 0%, #FFCC02 100%)',
                                        borderRadius: 3
                                    }}
                                >
                                    <Typography variant="h3" color="warning.main" fontWeight="bold">
                                        {Math.round(serviceUtilization * 100) / 100}x
                                    </Typography>
                                    <Typography variant="h6" color="textPrimary" fontWeight="medium">Service Efficiency</Typography>
                                    <Typography variant="body2" color="textSecondary">Utilization ratio</Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            {/* Predictive Analytics */}
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                            <BusinessIcon sx={{ mr: 1 }} />
                            Business Forecast & Recommendations
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            <Grid item xs={12} lg={4}>
                                <Box
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                                        borderRadius: 3,
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom>
                                        Revenue Projection
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ mb: 2 }}>
                                        ₹{Math.round(totalRevenue * 1.15).toLocaleString()}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Projected next month revenue based on current {customerGrowth} customer growth
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} lg={4}>
                                <Box
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #E8F5E8 0%, #C8E6C9 100%)',
                                        borderRadius: 3,
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" color="success.main" gutterBottom>
                                        Growth Forecast
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ mb: 2 }}>
                                        +{Math.round(customerGrowth * 1.2)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Expected new customers next month with current growth trajectory
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} lg={4}>
                                <Box
                                    p={3}
                                    sx={{
                                        background: 'linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)',
                                        borderRadius: 3,
                                        height: '100%'
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" color="purple.main" gutterBottom>
                                        Market Opportunity
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="purple.main" sx={{ mb: 2 }}>
                                        {Math.round((customersList.length * 2.5) - customersList.length)}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Potential customers in current market areas based on penetration analysis
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
        </Box>
    );
}

// Main Dashboard Component
function Dashboard() {
    const theme = useTheme();
    const { fmtTime } = useAppTimezone();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('executive');
    const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
    const [endDate, setEndDate] = useState(dayjs());
    const [currentTime, setCurrentTime] = useState('');

    const [companyDetails, setCompanyDetails] = useState(null);

 useEffect(() => {
  const fetchCompanyDetails = async () => {
    const JWT_TOKEN = Cookies.get('token') || '';
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
      headers: {
        Authorization: `Bearer ${JWT_TOKEN}`,
      },
    });
    
    const data = await response.json();

    console.log("API DATA:", data); // 👈 check this

    const companyDetailsData = data.company_details?.[0];

    console.log("Selected company:", companyDetailsData); // 👈 check this

    setCompanyDetails(companyDetailsData);
   // 👈 check this
  };

  fetchCompanyDetails();
}, []);

    useEffect(() => {
        setCurrentTime(fmtTime(new Date()));
    }, [fmtTime]);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    // Safe color mapping for tab styling
    const getTabColor = (color) => {
        const colorMap = {
            primary: theme.palette.primary,
            secondary: theme.palette.secondary,
            success: theme.palette.success,
            warning: theme.palette.warning,
            error: theme.palette.error,
            info: theme.palette.info
        };
        return colorMap[color] || theme.palette.primary;
    };

    const tabs = [
        { id: 'executive', name: 'Executive Summary', icon: <DashboardIcon />, color: 'primary' },
        { id: 'appointments', name: 'Service Analytics', icon: <CalendarTodayIcon />, color: 'success' },
        { id: 'customers', name: 'Customer Intelligence', icon: <GroupIcon />, color: 'info' },
        { id: 'financial', name: 'Financial Dashboard', icon: <AttachMoneyIcon />, color: 'warning' },
        { id: 'operations', name: 'Operations Center', icon: <MapIcon />, color: 'primary' },
        { id: 'workforce', name: 'Workforce Analytics', icon: <ConstructionIcon />, color: 'error' },
        { id: 'inventory', name: 'Inventory Intelligence', icon: <InventoryIcon />, color: 'info' },
        { id: 'margins', name: 'Inventory Margins', icon: <TrendingUpIcon />, color: 'purple' },
        { id: 'insights', name: 'Business Insights', icon: <InsightsIcon />, color: 'secondary' }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'executive':
                return <ExecutiveSummary startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}       companyDetails={companyDetails} />;
            case 'appointments':
                return <ServiceAnalytics startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}    companyDetails={companyDetails} />;
            case 'customers':
                return <CustomerIntelligence  startDate={startDate} endDate={endDate} companyDetails={companyDetails}/>;
            case 'financial':
                return <FinancialDashboard  startDate={startDate} endDate={endDate} companyDetails={companyDetails} />;
            case 'operations':
                return <OperationsCenter startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}   companyDetails={companyDetails} />;
            case 'workforce':
                return <WorkforceAnalytics startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')} companyDetails={companyDetails} />;
            case 'inventory':
                return <InventoryIntelligence startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}   companyDetails={companyDetails}/>;
            case 'margins':
                return <InventoryMargins startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')} companyDetails={companyDetails}  />;
            case 'insights':
                return <BusinessInsights  startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}  companyDetails={companyDetails}/>;
            default:
                return <ExecutiveSummary startDate={startDate.format('YYYY-MM-DD')} endDate={endDate.format('YYYY-MM-DD')}    companyDetails={companyDetails} />;
        }
    };
   
   const [bgImage, setBgImage] = useState(null);
    return (
        
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* <Box sx={{ display: "flex" }}> */}
            <Box
    sx={{
        display: "flex",
        minHeight: "100vh",
        backgroundImage: bgImage
            ? `url(${process.env.NEXT_PUBLIC_API_URL}/company/image/file/background/${bgImage})`
            : "none",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
    }}
>
                <CssBaseline />

                {/* Header */}
                <Box
                    component="header"
                    sx={{
                        position: "fixed",
                        top: 0,
                        left: open ? drawerWidth : `calc(${theme.spacing(7)} + 1px)`,
                        right: 0,
                        height: 64,
                        backgroundColor: "background.paper",
                        borderBottom: 1,
                        borderColor: "divider",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 3,
                        zIndex: theme.zIndex.appBar,
                        transition: theme.transitions.create(["margin", "width"], {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.leavingScreen,
                        }),
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            onClick={handleDrawerOpen}
                            edge="start"
                            sx={{ mr: 2, ...(open && { display: "none" }) }}
                        >
                            <MenuIcon />
                        </IconButton>
                        {/* <Box
                            component="img"
                            src="/icons/bmw-logo.png"
                            alt="BMW Logo"
                            sx={{ width: 52, height: 52, objectFit: 'contain' }}
                        /> */}


       <div>
      {companyDetails?.logo ? (
        <img
          src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${companyDetails.logo}`}
          alt="logo"
          width={150}
        />
      ) : (
        <p>Loading...</p>
      )}
    </div>
                     </Box>

                    <Box display="flex" alignItems="center" gap={2}>
                        <DatePicker
                            label="Start Date"
                            value={startDate}
                            onChange={(newValue) => setStartDate(newValue)}
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                        <DatePicker
                            label="End Date"
                            value={endDate}
                            onChange={(newValue) => setEndDate(newValue)}
                            slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
                        />
                        <Chip
                            label={`Live Data ${currentTime ? '• ' + currentTime : ''}`}
                            color="success"
                            variant="outlined"
                            size="small"
                        />
                    </Box>
                </Box>

                {/* Sidebar */}
                <Drawer variant="permanent" open={open}>
                    <DrawerHeader>
                        <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }} color="primary.main">
                            Auto x
                        </Typography>
                        <IconButton onClick={handleDrawerClose}>
                            {theme.direction === "rtl" ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                        </IconButton>
                    </DrawerHeader>
                    <Divider />
                    <List>
                        {tabs.map((tab) => (
                            <ListItem key={tab.id} disablePadding sx={{ display: "block" }}>
                                <ListItemButton
                                    onClick={() => setActiveTab(tab.id)}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? "initial" : "center",
                                        px: 2.5,
                                        backgroundColor: activeTab === tab.id ?
                                            getTabColor(tab.color).light :
                                            'transparent',
                                        color: activeTab === tab.id ?
                                            'white' :
                                            'text.primary',
                                        '&:hover': {
                                            backgroundColor: activeTab === tab.id ?
                                                getTabColor(tab.color).main :
                                                'action.hover',
                                        },
                                        borderRadius: 1,
                                        mb: 0.5,
                                        mx: 1
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: open ? 3 : "auto",
                                            justifyContent: "center",
                                            color: 'inherit'
                                        }}
                                    >
                                        {tab.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={tab.name}
                                        sx={{ opacity: open ? 1 : 0 }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Drawer>

                {/* Main Content */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        pt: 10, // Account for fixed header
                        backgroundColor: "background.default",
                        minHeight: "100vh",
                    }}
                >
                    {renderContent()}
                </Box>
            </Box>
        </LocalizationProvider>
    );
}

export default Dashboard;
