import { Server } from "socket.io";
import { getActiveTimezone, formatDateInTimezone } from "../utils/timezone.service.js";

async function getTzTimeString(includeDate = false) {
  const tz = await getActiveTimezone();
  const fmt = includeDate ? "YYYY-MM-DD HH:mm" : "HH:mm";
  return formatDateInTimezone(new Date(), tz, fmt);
}

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const users = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Store the username and room when the user joins a room
    socket.on("joinRoom", async ({ userId, username, room }) => {
      users[socket.id] = { userId, username, room };
      socket.join(room); // Join the specified room
      console.log(`${username} (ID: ${userId}) joined ${room}.`);

      // Broadcast to the room that a new user has joined
      const joinTime = await getTzTimeString(true);
      socket.to(room).emit("chatMessage", {
        userId: userId,
        username: "System",
        text: `${username} has joined the room.`,
        time: joinTime,
      });
    });

    // Listen for chat messages and broadcast them to the room
    socket.on("chatMessage", async (msg) => {
      const user = users[socket.id] || {
        username: "Anonymous",
        room: "General",
      };
      const room = user.room;

      console.log(
        `Message from ${user.username} ${user.userId} in ${room}: ${msg.text}`
      );

      const msgTime = await getTzTimeString();
      io.to(room).emit("chatMessage", {
        userId: user.userId,
        username: user.username,
        text: msg.text,
        time: msgTime,
      });
    });

    // Handle disconnection and clean up user data
    socket.on("disconnect", async () => {
      const user = users[socket.id];
      if (user) {
        const { username, room } = user;
        const leaveTime = await getTzTimeString();
        socket.to(room).emit("chatMessage", {
          username: "System",
          text: `${username} has left the room.`,
          time: leaveTime,
        });
        console.log(`${username} disconnected.`);
        delete users[socket.id];
      }
    });
  });

  return io;
};

export default initializeSocket;
