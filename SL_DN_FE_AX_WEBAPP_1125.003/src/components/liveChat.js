"use client";
// React and Next imports
import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";

// Function imports - Alphabetical
import io from "socket.io-client";

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

export default function LiveChat({ room }) {

  useEffect(() => {
    const username = Cookies.get("userName");
    setUsername(username);
    const userId = Cookies.get("userId");
    setUserId(userId);
    const token = Cookies.get("token");
    setToken(token);
  }, []);
  // Frontend extracted data states 
  const[username,setUsername] =useState();
  const[userId,setUserId] =useState();
  const[token,setToken] =useState();
  
  // Refs
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // UI state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  
  // Backend Data states
  const [newMessages, setNewMessages] = useState([]);
  const [messages, setMessages] = useState([]);

  // Functions that has to be in the same file
  const sendMessage = () => {
    if (message.trim()) {
      socket.emit("chatMessage", { userId, username, text: message, room });
      setMessage("");
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  // useEffect and other React Hooks
  useEffect(() => {
    async function fetchMessages() {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/chat/${room}`,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch entries");

      const data = await response.json();
      const messageData = JSON.parse(data.chat_data || "[]");
      setMessages(messageData);
    }

    fetchMessages();
  }, [room, token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // socket = io("http://192.168.29.62:9000/");
    const ChatUrl = process.env.NEXT_PUBLIC_API_URL; 
    socket = io(ChatUrl);
    socket.emit("joinRoom", { userId, username, room });

    const handleMessage = (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
      if (msg.username !== "System" && msg.username === username) {
        async function postMessages() {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/appointment/chat/${room}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(msg),
            }
          );

          if (!response.ok) throw new Error("Failed to Send Message");
        }

        postMessages();
      }
    };

    socket.on("chatMessage", handleMessage);

    return () => {
      socket.off("chatMessage", handleMessage);
      socket.disconnect();
    };
  }, [room, username, token]);

  // UI Code
  return (
    <Box position="fixed" bottom={16} right={16} zIndex={2}>
      <Fab color="primary" aria-label="chat" onClick={toggleChat}>
        <ChatIcon />
      </Fab>

      {isChatOpen && (
        <Box
          sx={{
            position: "fixed",
            bottom: 80,
            right: 16,
            width: 300,
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
            <IconButton size="small" onClick={toggleChat}>
              <CloseIcon />
            </IconButton>
          </Paper>

          <Divider />

          <Box sx={{ p: 2, overflowY: "auto", flexGrow: 1, height: "250px" }}>
            {messages.map((message, index) => (
              <Box
                key={index}
                sx={{
                  mb: message.username === "System" ? 0 : 1,
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  justifyContent:
                    message.username === username
                      ? "flex-end"
                      : message.username === "System"
                      ? "center"
                      : "flex-start",
                  alignItems:
                    message.username === username
                      ? "flex-end"
                      : message.username === "System"
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
                      message.username === username
                        ? "primary.main"
                        : message.username === "System"
                        ? ""
                        : "grey.300",
                    color: message.username === username ? "white" : "black",
                    boxShadow: message.username === "System" ? "" : 1,
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
                      {message.username === "System" ? "" : message.username}
                    </Typography>
                    <Typography sx={{ color: "white", mr: 1, fontSize: "10px" }}>
                      {message.time}
                    </Typography>
                  </div>
                  <Typography variant="body2">{message.text}</Typography>
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
              onChange={(e) => setMessage(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter") sendMessage();
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
        </Box>
      )}
    </Box>
  );
}
