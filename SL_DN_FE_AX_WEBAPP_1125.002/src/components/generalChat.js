"use client";
// React and Next imports
import { useEffect, useState, useRef } from "react";

// Function imports - Alphabetical
import io from "socket.io-client";
import Cookies from "js-cookie";

// UI package imports - Alphabetical
import {
  Box,
  Button,
  Divider,
  Fab,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

// Images and icon imports - Alphabetical
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";

let socket;

export default function GeneralChat({ isChatOpen }) {
  let room = "General";
  // Frontend extracted data states
  const [username, setUsername] = useState();
  const [userId, setUserId] = useState();
  const [token, setToken] = useState();
  const [chatStatus, setChatStatus] = useState(false);

  // Refs
  // const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // UI state
  // const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Backend Data states
  const [newMessages, setNewMessages] = useState([]);
  const [messages, setMessages] = useState([]);

  // New state to manage users and tagged user
  const [users, setUsers] = useState([]); // Initialize users state
  const [taggedUser, setTaggedUser] = useState(null); // Initialize tagged user state

  useEffect(() => {
    const username = Cookies.get("userName");
    setUsername(username);
    const userId = Cookies.get("userId");
    setUserId(userId);
    const token = Cookies.get("token");
    setToken(token);
  }, []);

  // Functions that has to be in the same file
  const sendMessage = async () => {
    if (message.trim() !== "") {
      try {
        const msgData = {
          userId,
          name: username,
          text: message, // Send the message as is
          room,
          to: taggedUser // Add the tagged user to the message data
        };
        await socket.emit("chatMessage", msgData);
        setMessage(""); // Clear the message input
        setTaggedUser(null); // Reset tagged user after sending
      } catch (error) {
        console.log("Error sending message:", error);
      }
    }
  };

  // Function to handle tagging logic
  const handleTagging = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Check if the last character is '@' and reset taggedUser
    if (value.endsWith('@')) {
      setTaggedUser(null); // Reset tagged user when typing '@'
    }
  };

  async function fetchMessages() {
    const token = Cookies.get("token");
    try {
      const response1 = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response1.ok) {
        console.error(`Failed to fetch messages: ${response1.status} ${response1.statusText}`);
        return;
      }

      const data = await response1.json();
      setMessages(data.chats || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }
  // useEffect and other React Hooks
  useEffect(() => {
    // const storedUserId = Cookies.get("userId");

    fetchMessages();
  }, [room, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const ChatUrl = process.env.NEXT_PUBLIC_API_URL;
    socket = io(ChatUrl);
    socket.emit("joinRoom", { userId, username, room });

    const handleMessage = (msg) => {
      // console.log(`Received message from ${msg.username}: ${msg.text}`);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          userId: msg.userId,
          chat: msg.text,
          name: msg.username,
          Date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString(),
        },
      ]);

      if (msg.username !== "System" && msg.username === username) {
        async function postMessages() {
          const data = {
            userId: userId,
            name: msg.username,
            chat: msg.text,
            Date: new Date().toISOString().split("T")[0],
            time: new Date().toLocaleTimeString(),
            // seen_by: { seen },
          };

          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/chats`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
              }
            );

            if (!response.ok) {
              console.error(`Failed to send message: ${response.status} ${response.statusText}`);
              return;
            }
          } catch (error) {
            console.error("Error sending message:", error);
          }
        }

        postMessages();
      }
    };

    socket.on("chatMessage", handleMessage);

    return () => {
      socket.off("chatMessage", handleMessage);
      socket.disconnect();
    };
  }, [room, username, token, chatStatus]);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users`,{
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to fetch users: ${response.status} ${response.statusText}`);
          return;
        }

        const data = await response.json();
        setUsers(data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [token]);

  // UI Code
  return (
    <Box
      position="fixed"
      bottom={16}
      right={16}
      sx={{ overflow: "hidden", zIndex: 40 }}
    >
      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 10,
            right: 16,
            width: "22rem",
            maxHeight: 400,
            bgcolor: "background.paper",
            boxShadow: 3,
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Paper
            elevation={1}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 1,
            }}
          >
            <Typography variant="h6">
              <span style={{ fontWeight: "bold" }}>Chat </span> ({room})
            </Typography>
          </Paper>

          <Divider />

          <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1, height: "250px" }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: message.name === "System" ? 0 : 1,
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  justifyContent:
                    message.name === username
                      ? "flex-end"
                      : message.name === "System"
                      ? "center"
                      : "flex-start",
                  alignItems:
                    message.name === username
                      ? "flex-end"
                      : message.name === "System"
                      ? "center"
                      : "flex-start",
                }}
              >
                <Box
                  sx={{
                    minWidth: "50%",
                    maxWidth: "70%",
                    p: "3px 11px",
                    borderRadius: 3,
                    bgcolor:
                      message.name === username
                        ? "primary.main"
                        : message.name === "System"
                        ? ""
                        : "grey.300",
                    color: message.name === username ? "white" : "black",
                    boxShadow: message.name === "System" ? "" : 1,
                    wordBreak: "break-word",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "10px", fontWeight: "bold" }}
                    >
                      {message.name === "System" ? "" : message.name}
                    </Typography>
                    <Typography
                      sx={{ color: "white", mr: 1, fontSize: "10px" }}
                    >
                      {message.time}
                    </Typography>
                  </div>
                  <Typography variant="body2">{message.chat}</Typography>
                </Box>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ display: "flex", p: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Type a message"
              value={message}
              onChange={handleTagging}
              onKeyUp={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              sx={{ ml: 1 }}
            >
              Send
            </Button>
          </Box>

          {/* Dropdown to show users when "@" is detected */}
          {message.includes('@') && users.length > 0 && (
            <Box sx={{ position: 'absolute', backgroundColor: 'white', zIndex: 100, border: '1px solid grey', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto' }}>
              {users.map((user) => (
                <Typography
                  key={user.user_id}
                  onClick={() => {
                    setTaggedUser(user.username); // Set tagged user on click
                    setMessage(`@${user.username} `); // Update message with tagged user
                  }}
                  sx={{ padding: '5px', cursor: 'pointer', '&:hover': { backgroundColor: '#f0f0f0' } }}
                >
                  {user.username}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
