"use client";
//? React and Next imports
import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useMediaQuery } from "@mui/material";
//? Component Imports
import BackButton from "./backButton.js";
import GeneralChat from "./generalChat.js";
import ConformationDialogue from "./conformationDialogue";
import { usePathname } from "next/navigation";


//? Functional Package Imports
import io from "socket.io-client";

//? UI package imports - Alphabetical
import {
  Avatar,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Typography,
  Tooltip,
  IconButton,
  TextField,
  Modal,
  Snackbar,
  Alert,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import Badge from "@mui/material/Badge";

//? Images and icon imports - Alphabetical
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import MenuIcon from "@mui/icons-material/Menu";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { LockReset } from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ?cookies for whatasapp
import Cookies from "js-cookie";
import { checkCustomRoutes } from "next/dist/lib/load-custom-routes.js";
import { checkWhatsappLoggedIn } from "./whatsapp.js";

let socket;

export default function Navbar({ pageName, hasChanges }) {
  const router = useRouter();
  //* LK: If required we can use chat rooms
  // const params = useParams();
  // const room = params.id;

  const pathname = usePathname();
  //? Check if page is inside an iframe
  const [isInsideIframe, setIsInsideIframe] = useState(false);

  //? FrontEnd extracted data states
  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState();
  const [userRole, setUserRole] = useState();
  const [userName, setUserName] = useState();
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [chatStatus, setChatStatus] = useState(false);

  //? Modal and Alert states
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorEl2, setAnchorEl2] = useState(null);
  const [open, setOpen] = useState(false);

  //? Backend Data states
  const [notifications, setNotifications] = useState([]);
  //? Company Details
  const [companyDetails, setCompanyDetails] = useState([]);
  const [isWhatsappEnabled, setIsWhatsappEnabled] = useState(false);
  //? Whatsapp status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(Cookies.get("phone") || "");

  //? Chat box state
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  const chatContainerRef = useRef(null);

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("");
  const [tiles, setTiles] = useState([]);
  const [tilesToDisplay, setTilesToDisplay] = useState([]);

  const [openLogoutConfirmation, setOpenLogoutConfirmation] = useState(false);
  const [openWhatsappLogoutWarning, setOpenWhatsappLogoutWarning] =
    useState(false);

  const isMobileOrTablet = useMediaQuery("(max-width: 1024px)");

  // Detect if page is inside an iframe
  useEffect(() => {
    try {
      if (window.self !== window.parent) {
        setIsInsideIframe(true);
      }
    } catch (e) {
      // Cross-origin iframes can throw an error, so we assume we're in an iframe
      setIsInsideIframe(true);
    }
  }, []);

  const fetchTiles = async () => {
    let url = process.env.NEXT_PUBLIC_API_URL + "/tiles";
    try {
      const token = Cookies.get("token");
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let tileData = await response.json();
      // console.log({ tileData });
      // setTiles(tileData);
      const tileNames = tileData.map((tile) => tile.tile_id);

      // console.log({tileNames})
      setTiles(tileNames);

      // console.log({tileData})

      // const access = Cookies.get("access");
      // if (access) {
      //   try {
      //     const accessList = JSON.parse(access);
      //     const filteredTiles = tileData.filter((tile) => {
      //       const tileId = tile.tile_id.toLowerCase().trim();

      //       // Exclude "Job Card" and "Service Center" on mobile view
      //       if (
      //         isMobileView &&
      //         (tileId === "job card" || tileId === "service center​")
      //       ) {
      //         return false;
      //       }

      //       return accessList.some((accessItem) => {
      //         let accessName;
      //         if (typeof accessItem === "string") {
      //           accessName = accessItem.toLowerCase().trim();
      //         } else if (accessItem && typeof accessItem === "object") {
      //           accessName =
      //             accessItem.name?.toLowerCase().trim() ||
      //             accessItem.moduleName?.toLowerCase().trim() ||
      //             accessItem.module?.toLowerCase().trim() ||
      //             "";
      //         }

      //         return tileId.includes(accessName) || accessName.includes(tileId);
      //       });
      //     });

      //     let list = [];

      //     const orderedTiles = order.map((item) => {
      //       filteredTiles.map((tile) => {
      //         if (tile.tile_name == item) {
      //           list.push(tile);
      //         }
      //       });
      //     });

      //     console.log({ filteredTiles });

      //     setTilesToDisplay(list);
      //   } catch (error) {
      //     setTilesToDisplay([]);
      //   }
      // }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  useEffect(() => {
    fetchTiles();
  }, []);

  // State for reset confirmation modal
  const [openResetConfirmation, setOpenResetConfirmation] = useState(false);

  const handleNotificationClick = (event) => {
    setAnchorEl2(event.currentTarget);
    setOpen(true);
  };

  const handleNotificationClose = () => {
    setOpen(false);
  };

  const handleAvatarClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.clear();
    // Clear all cookies
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
    handleClose();
    //!logout the whatsapp if already Logged in
    if (checkWhatsappLoggedIn()) {
      performWhatsappLogout();
    }
    router.push("/");
  };
  const handleWhatsappLogout = () => {
    setOpenWhatsappLogoutWarning(true);
  };

  // fetch company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ss`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      const companyDetails = data.company_details && data.company_details[0];
        const isWhatsappEnabled =
      companyDetails?.whatsapp === "true" || companyDetails?.whatsapp === "1";
      setCompanyDetails(companyDetails);
      setIsWhatsappEnabled(isWhatsappEnabled);


      const response2 = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data2 = await response2.json();
      setUsers(data2);
    };

    fetchCompanyDetails();
    // fetchChats();
  }, []); // Empty dependency array means this runs once on mount

  // const fetchChats = async () => {
  //   const response1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`);
  //   const data1 = await response1.json();
  //   setChats(data1.chats);
  // };

  // get whatsapp status in local storage
  useEffect(() => {
    // Retrieve login status and phone number from cookies on component mount
    const storedStatus = Cookies.get("connection_status");
    const storedPhone = Cookies.get("phone");

    if (storedStatus === "active" && storedPhone) {
      setIsLoggedIn(true);
      setMobileNumber(storedPhone);
    }
  }, []);

  const clearAllNotifications = async (token, messages) => {
    let data = { userId, messages };
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/chat/clearAll/chatNotification`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      const dta = JSON.parse(response);
    } catch (error) {
      console.log("Error clearing notifications:", error);
    }
  };

  const updateSeenBy = async (userId, msgId, apmtId) => {
    try {
      let dta = {
        userId: userId,
        messageId: msgId,
        appointmentId: apmtId,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/chat/put/chatNotification`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(dta),
        }
      );

      const data = JSON.parse(response);
    } catch (error) {
      console.log("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    const storedToken = Cookies.get("token");
    const storedUserId = Cookies.get("userId");
    const storedRole = Cookies.get("role");
    const storedName = Cookies.get("userName");

    setToken(storedToken);
    setUserId(storedUserId);
    setUserName(storedName);
    setUserRole(storedRole);

    const getChatNotification = async (userId) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/chat/get/chatNotification/${storedUserId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status == 401 || response.status == 403) {
        localStorage.clear();
        router.push("/");
      }

      let newChatNotification = await response.json();

      setNotifications(newChatNotification.notifications);
    };
    getChatNotification(userId);
    const intervalId = setInterval(() => {
      getChatNotification(userId);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [userName, token]);

  //? Handle chat icon click
  const handleChatIconClick = () => {
    setIsChatBoxOpen(!isChatBoxOpen);
  };

  useEffect(() => {
    if (isChatBoxOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chats, isChatBoxOpen]);

  // Function to update seen status
  const markMessageAsSeen = (messageId) => {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === messageId) {
          const seenBy = JSON.parse(chat.seen_by);
          seenBy.seen = seenBy.seen.map((user) => {
            if (user[userId] !== undefined) {
              user[userId] = true;
            }
            return user;
          });
          return { ...chat, seen_by: JSON.stringify(seenBy) };
        }
        return chat;
      })
    );
  };

  const handleDone = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            number: mobileNumber,
            // api_key: apiKey,
          }),
        }
      );

      const result = await response.json();
      // console.log("Done API Response:", result); // Log the API response

      if (result.login_status === "Session already open") {
        setIsLoggedIn(true);
        // Set cookies with phone number and connection status
        Cookies.set("phone", mobileNumber);
        Cookies.set("connection_status", "active");
        showSnackbar("Device already connected!", "success");
        handleCloseLoginModal();
        // Window.location.reload();
        // reload after 2 seconds
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showSnackbar("Failed to confirm connection: " + result.msg, "error");
      }
    } catch (error) {
      showSnackbar("Error during confirmation: " + error.message, "error");
    }
  };
  const handleOpenLoginModal = () => {
    setLoginModalOpen(true);
  };

  const handleCloseLoginModal = () => {
    setLoginModalOpen(false);
    setMobileNumber("");
    setQrCode("");
  };

  const handleLogin = async () => {
    // console.log(mobileNumber);

    // Check if the mobileNumber is exactly 10 digits long
    if (!mobileNumber || mobileNumber.length !== 10) {
      showSnackbar("Please enter a valid 10-digit mobile number.", "error");
      return; // Exit early if validation fails
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            number: mobileNumber,
          }),
        }
      );

      const result = await response.json();
      if (result.qrCode) {
        setQrCode(result.qrCode);
        showSnackbar("Please scan the QR code.", "info");
      } else if (result.login_status === "Session already open") {
        setIsLoggedIn(true);
        Cookies.set("phone", mobileNumber, { expires: 7 });
        Cookies.set("connection_status", "active", { expires: 7 });
        showSnackbar("Device already connected!", "success");
        handleCloseLoginModal();
      } else {
        showSnackbar("Failed to login: " + result, "error");
      }
    } catch (error) {
      showSnackbar("Error during login: " + error.message, "error");
    }
  };
  const setnumbercookie = async () => {
    Cookies.set("qrnumber", mobileNumber);
  };

  const resetrequest = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/reset`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromNumber: Cookies.get("number"),
        }),
      }
    );
    // ! delteing the cookies
    // Cookies.remove("phone");
    Cookies.remove("connection_status");
    Cookies.remove("qrnumber");
    if (response.status == 200) {
      toast.success(`Reset Success!!`);
    } else if (response.status == 404) {
      toast.warn(`No Whatsapp Found `);
    } else {
      toast.error(`There's some issue with Resetting..`);
    }
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const confirmLogout = () => {
    Cookies.remove("phone");
    Cookies.remove("connection_status");
    Cookies.remove("qrnumber");
    setIsLoggedIn(false);
    setMobileNumber("");
    showSnackbar("Device disconnected successfully.", "success");
    handleClose();
    window.location.reload();
  };

  const confirmWhatsappLogout = async () => {
    await performWhatsappLogout();
    setOpenWhatsappLogoutWarning(false);
  };

  const performWhatsappLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/whatsapp/logout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            number: Cookies.get("phone"),
          }),
        }
      );

      const result = await response.text();
      // console.log("Logout API Response:", result); // Log the API response

      if (result === "Logged out and credentials deleted") {
        // Cookies.remove("phone");
        Cookies.remove("connection_status");
        Cookies.remove("qrnumber");
        setIsLoggedIn(false);
        setMobileNumber("");
        showSnackbar("Device disconnected successfully.", "success");
      } else {
        showSnackbar("Failed to disconnect device: " + result, "error");
      }
    } catch (error) {
      console.log("Error during logout:", error);
      showSnackbar("Error during logout: " + error.message, "error");
    }
  };

  // Function to handle reset button click
  const handleResetButtonClick = () => {
    setOpenResetConfirmation(true);
  };

  // Function to confirm reset
  const confirmReset = async () => {
    await resetrequest(); // Call your existing reset function
    setOpenResetConfirmation(false); // Close the modal after confirming
  };

  // Function to handle modal close
  const handleCloseResetModal = () => {
    setOpenResetConfirmation(false);
  };

  // const showBackButton = pageName !== "" || companyDetails?.page_type === "tab");

  return (
    <div style={{ display: isInsideIframe ? "none" : "block" }}>
      <ToastContainer />
      <Box sx={{ flexGrow: 1 }}>
        <Grid container spacing={2} marginX={2}>
          {/* //? Back Button & Page Name */}
          <Grid
            size={{ xs: 6, sm: 4, md: 4, lg: 4 }}
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              justifyItems: "center",
              order: { xs: 1, sm: 0, md: 0, lg: 0 },
            }}
          >
            <div style={{ display: "flex", flexDirection: "row" }}>
              {pathname !== "/views" && (
                <BackButton hasChanges={hasChanges} />
              )}

              <h1
                style={{
                  marginLeft: "10px",
                  color: "white",
                  fontSize: "2rem",
                }}
              >
                {pageName}
              </h1>
            </div>

          </Grid>

          {/* //? App Logo */}
          <Grid
            size={{ xs: 12, sm: 4, md: 4, lg: 4 }}
            sx={{
              display: "flex",
              justifyContent: "center",
              justifyItems: "center",
              order: { xs: 0, sm: 1, md: 1, lg: 1 },
            }}
          >
            <Button
              onClick={() => {
                router.push("/views")
                // window.location.reload();
              }
              }
              sx={{ color: "black", fontSize: 20, cursor: "pointer" }}
            >
              {companyDetails?.logo ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}/company/image/file/logo/${companyDetails.logo}`}
                  alt="logo"
                  width={150}
                  height={50}
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <Typography variant="h6" color="gray">
                  Loading...
                </Typography>
              )}
            </Button>
          </Grid>

          <Grid
            size={{ xs: 6, sm: 4, md: 4, lg: 4 }}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              justifyItems: "center",
              order: { xs: 2, sm: 2, md: 2, lg: 2 },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              {/* //? Notification section */}
              {!isMobileOrTablet && (
                <div>
                  <Badge badgeContent={notifications.length} color="primary">
                    <NotificationsActiveIcon
                      color="action"
                      sx={{ fontSize: 30, color: "#F7BF8B", cursor: "pointer" }}
                      onClick={handleNotificationClick}
                    />
                  </Badge>
                </div>
              )}

              {/* //? Chat Icon */}
              {!isMobileOrTablet && (
                <Tooltip title="Chat">
                  <IconButton
                    sx={{ fontSize: 30, color: "#F7BF8B", cursor: "pointer" }}
                    onClick={() => {
                      handleChatIconClick();
                      // fetchChats();
                      // handleChatStatus();
                    }}
                  >
                    <ChatIcon />
                  </IconButton>
                </Tooltip>
              )}

              {!isMobileOrTablet && isWhatsappEnabled &&  (
                <Tooltip title={isLoggedIn ? "Logout" : "Login to WhatsApp"}>
                  <IconButton
                    onClick={
                      isLoggedIn ? handleWhatsappLogout : handleOpenLoginModal
                    }
                  >
                    <WhatsAppIcon
                      sx={{ fontSize: 30, cursor: "pointer" }}
                      color={isLoggedIn ? "success" : "error"}
                    />
                  </IconButton>
                </Tooltip>
              )}

              {!isMobileOrTablet && isWhatsappEnabled &&  (
                <IconButton onClick={handleResetButtonClick}>
                  <LockReset
                    sx={{ fontSize: 30, cursor: "pointer" }}
                    color={"error"}
                  />
                </IconButton>
              )}
              {/* //? Chat Box */}
              <GeneralChat isChatOpen={isChatBoxOpen} />

              {/* //? Avatar section */}
              <Avatar
                sx={{ bgcolor: "#8BC3F7", cursor: "pointer" }}
                onClick={handleAvatarClick}
              >
                {userName ? userName.charAt(0).toUpperCase() : "?"}
              </Avatar>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                {/* Check if user is Admin, Power Admin, or has access to Software Settings */}
                {(userRole === "Admin" ||
                  userRole === "Power Admin" ||
                  Cookies.get("access")?.includes("Software Settings")) && (
                    <MenuItem component={Link} href="/views/softwareSettings">
                      Software Settings
                    </MenuItem>
                  )}
                {isMobileOrTablet && (
                  <div>
                    <MenuItem onClick={handleNotificationClick}>
                      <Badge
                        badgeContent={notifications.length}
                        color="primary"
                      >
                        <NotificationsActiveIcon
                          sx={{
                            fontSize: 30,
                            cursor: "pointer",
                            marginRight: 1,
                          }}
                          color="action"
                        />
                      </Badge>
                      Notifications
                    </MenuItem>

                    <MenuItem onClick={handleChatIconClick}>
                      <ChatIcon
                        sx={{ fontSize: 30, cursor: "pointer", marginRight: 1 }}
                        color="action"
                      />
                      Chat
                    </MenuItem>
                    <MenuItem
                      onClick={
                        isLoggedIn ? handleWhatsappLogout : handleOpenLoginModal
                      }
                    >
                      <WhatsAppIcon
                        sx={{ fontSize: 30, cursor: "pointer", marginRight: 1 }}
                        color={isLoggedIn ? "success" : "error"}
                      />
                      {isLoggedIn ? "Logout" : "Login to WhatsApp"}
                    </MenuItem>
                    <MenuItem onClick={handleResetButtonClick}>
                      <IconButton>
                        <LockReset
                          sx={{
                            fontSize: 30,
                            cursor: "pointer",
                            marginRight: 1,
                          }}
                          color={"error"}
                        />
                      </IconButton>
                      Reset
                    </MenuItem>
                  </div>
                )}
              </Menu>
            </Box>
          </Grid>
        </Grid>

        {/* Login Modal */}
        <Modal open={loginModalOpen} onClose={handleCloseLoginModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
            }}
          >
            {isLoggedIn ? (
              <h2>
                Already Connected 😊 <br />
                <p>{mobileNumber}</p>
              </h2>
            ) : (
              <>
                <h2>Login</h2>
                <TextField
                  label="Mobile Number"
                  variant="outlined"
                  fullWidth
                  value={Cookies.get("phone") || mobileNumber}
                  inputProps={{ maxLength: 10 }}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    handleLogin();
                    setnumbercookie();
                  }}
                >
                  Generate QR Code
                </Button>
                {qrCode && (
                  <Box sx={{ marginTop: "20px" }}>
                    <img src={qrCode} alt="QR Code" style={{ width: "100%" }} />
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleDone}
                      sx={{ mt: 2 }}
                    >
                      Done
                    </Button>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Modal>

        <Popover
          open={open}
          anchorEl={anchorEl2}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <div style={{ width: "300px", padding: "10px" }}>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              <Button
                onClick={() => clearAllNotifications(token, notifications)}
              >
                Clear All
              </Button>
            </Box>
            <Divider />
            {/* show */}
            <List>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      sx={{
                        padding: "5px",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#e0e0e0",
                        },
                      }}
                      onClick={() => {
                        let user = userId;
                        let msgId = notification.message_id;
                        let apmtId = notification.appointment_id;
                        updateSeenBy(user, msgId, apmtId);
                        // check if user has repective access to the using local storage
                        const userAccess = Cookies.get("access");
                        if (
                          userAccess.includes(
                            "Job Card",
                            "Service Inspection",
                            "Job Status",
                            "Service Center"
                          )
                        ) {
                          router.push(
                            `/views/jobCard/${notification.appointment_id}`
                          );
                        } else {
                          router.push(
                            `/views/jobCard/${notification.appointment_id}`
                          );
                        }
                      }}
                      primary={
                        notification.user_name +
                        ":" +
                        " " +
                        notification.appointment_id
                      }
                      secondary={notification.message}
                    />
                  </ListItem>
                ))
              ) : (
                <Typography
                  variant="subtitle1"
                  textAlign={"center"}
                  my={2}
                  color="gray"
                >
                  No New Notifications
                </Typography>
              )}
            </List>
          </div>
        </Popover>

        {/* Snackbar for Notifications */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={4000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        <Modal
          open={openWhatsappLogoutWarning}
          onClose={() => setOpenWhatsappLogoutWarning(false)}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%", // Use 90% width for smaller screens
              maxWidth: 400, // Max width to prevent it from getting too wide on large screens
              bgcolor: "#f8d7da", // Light red background for the warning effect
              borderRadius: 2,
              boxShadow: 3,
              p: 4,
              textAlign: "center",
              border: "2px solid #f5c6cb", // Red border for more contrast
            }}
          >
            <h3
              style={{
                color: "#721c24",
                fontWeight: "bold",
                marginBottom: "20px",
              }}
            >
              <span style={{ fontSize: "24px" }}>⚠️</span> Are you sure?
            </h3>
            <p
              style={{
                color: "#721c24",
                marginBottom: "30px",
                fontWeight: "500",
              }}
            >
              Logging out will remove your access to WhatsApp. Are you sure you
              want to continue?
            </p>
            <Button
              variant="contained"
              color="error" // Strong red color for confirmation
              onClick={confirmWhatsappLogout}
              sx={{
                mr: 2,
                width: "100%",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 1.5,
              }}
            >
              Yes, Log Out
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setOpenWhatsappLogoutWarning(false)}
              sx={{
                width: "100%",
                fontWeight: "bold",
                textTransform: "none",
                borderRadius: 1.5,
                marginTop: 2,
              }}
            >
              No, Keep me Logged In
            </Button>
          </Box>
        </Modal>

        {/* Reset Confirmation Modal */}
        <Modal open={openResetConfirmation} onClose={handleCloseResetModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "#f8d7da", // Light red background for warning
              borderRadius: 2,
              boxShadow: 24,
              p: 4,
              textAlign: "center",
            }}
          >
            <h3 style={{ color: "#721c24", fontWeight: "bold" }}>
              <span style={{ fontSize: "24px" }}>⚠️</span> Are you sure?
            </h3>
            <p style={{ color: "#721c24", marginBottom: "20px" }}>
              This action will reset your WhatsApp connection. Are you sure you
              want to continue?
            </p>
            <Button
              variant="contained"
              color="error"
              onClick={confirmReset}
              sx={{ mr: 2, width: "100%", marginBottom: 2 }}
            >
              Yes, Reset
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleCloseResetModal}
              sx={{ width: "100%" }}
            >
              No, Cancel
            </Button>
          </Box>
        </Modal>
      </Box>
    </div>
  );
}
