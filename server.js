import express from "express";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import cors from "cors";
import http from "http";
import connectToDB from "./mongoose/mongoose-config.js";
import { chatModel } from "./mongoose/chat.schema.js";

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = {};
const userImageUrl = {};
let typingUsers = {};

io.on("connection", (socket) => {
  console.log("connection eshtablished");

  socket.on("new-user-join", (data) => {
    const { userName, imageUrl } = data;
    // defult dp image
    const defaultImageUrl =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-UgKYtFgeRWBWMFkfmb04p7FenhiJJmUZJA&usqp=CAU";

    const connectedUsers = Object.values(users);
    io.emit("update-users", connectedUsers);
    users[socket.id] = userName;
    userImageUrl[socket.id] = imageUrl;
    socket.broadcast.emit("user-joined", {
      id: socket.id,
      name: userName,
      imageUrl: userImageUrl[socket.id],
    });
  });

  socket.on("send-message", (message) => {
    // storing in db
    const newChat = new chatModel({
      username: users[socket.id],
      message: message,
      imageUrl: userImageUrl[socket.id],
    });

    newChat.save();
    socket.broadcast.emit("received", {
      message: message,
      user: users[socket.id],
      imageUrl: userImageUrl[socket.id],
    });
  });

  socket.on("typing", () => {
    const userName = users[socket.id];
    typingUsers[socket.id] = userName;
    io.emit("user-typing", { name: userName });
  });

  socket.on("stop-typing", () => {
    delete typingUsers[socket.id];
    io.emit("user-typing", { name: null });
  });

  socket.on("disconnect", () => {
    const userName = users[socket.id];
    delete users[socket.id];
    const connectedUsers = Object.values(users);
    io.emit("update-users", connectedUsers);

    if (userName) {
      io.emit("leave", userName);
    }
    console.log("connection disconnected");
  });
});

server.listen(port, () => {
  console.log(`Listening on port ${port}`);
  connectToDB();
});
