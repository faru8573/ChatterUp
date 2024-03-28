document.addEventListener("DOMContentLoaded", () => {
  const socket = io.connect("http://localhost:3000");

  socket.on("connect", () => {
    console.log("Connected to server");
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  // import DOM elements
  const allChat = document.querySelector(".all-chat");
  const header = document.querySelector(".header");
  const counter = document.getElementById("join-counter");

  const connectedList = document.getElementById("connected-list");
  const sendForm = document.getElementById("send-form");
  const messageInput = document.getElementById("messageInput");

  ///////////// script start///////////////
  const pictureUrl = [
    "https://img.freepik.com/free-photo/fashion-boy-with-yellow-jacket-blue-pants_71767-96.jpg?size=626&ext=jpg&ga=GA1.1.499724579.1711382223&semt=sph",
    "https://img.freepik.com/free-photo/androgynous-avatar-non-binary-queer-person_23-2151100226.jpg?size=626&ext=jpg&ga=GA1.1.499724579.1711382223&semt=sph",
    "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671120.jpg?size=626&ext=jpg&ga=GA1.1.499724579.1711382223&semt=sph",
  ];
  const userName = prompt("Enter your name to join");
  header.innerHTML = `<strong>Welcome ${userName}</strong>`;
  socket.emit("new-user-join", {
    userName: userName,
    imageUrl: pictureUrl[Math.floor(Math.random() * pictureUrl.length)],
  });

  /////------ update users and list -----//////
  socket.on("update-users", (connectedUsers) => {
    counter.textContent = `connected users ${connectedUsers.length}`;
    updateConnectedUsersList(connectedUsers);
  });

  // function for update user list
  function updateConnectedUsersList(usersArray) {
    connectedList.innerHTML = "";
    usersArray.forEach((userName) => {
      const userButton = document.createElement("div");
      userButton.classList.add(
        "list-group-item",
        "list-group-item-success",
        "active-user-dot"
      );

      userButton.textContent = userName;
      connectedList.appendChild(userButton);
    });
  }
  /////------ user joined ------/////
  socket.on("user-joined", (data) => {
    const joinText = document.createElement("div");
    joinText.textContent = `${userName} has joined`;
    allChat.appendChild(joinText);

    // update connected user list
    const userButton = document.createElement("div");
    userButton.classList.add(
      "list-group-item",
      "list-group-item-success",
      "active-user-dot"
    );
    userButton.textContent = data.name;
    connectedList.appendChild(userButton);
    const profilePic = document.createElement("img");
    profilePic.src = data.imageUrl;

    profilePic.classList.add("user-profile-picture");
    userButton.appendChild(profilePic);
    userButton.textContent = data.name;
    connectedList.appendChild(userButton);
  });

  /////-------- time formatting -----////
  const timeFormatting = () => {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    return formattedTime;
  };

  /////--------- chatting function ----////
  let messageContainer;
  function chatting(message, position, senderName, imageUrl) {
    const currentDate = timeFormatting();
    messageContainer = document.createElement("div");
    const profileImage = document.createElement("img");
    profileImage.src = imageUrl;
    profileImage.classList.add("user-profile-image");

    const messageText = document.createElement("span");

    if (position == "left") {
      messageContainer.classList.add("left-message", "bg-primary-subtle");
      messageText.textContent = `${senderName}:  ${message} (${currentDate})`;
    } else {
      messageContainer.classList.add("right-message", "bg-success-subtle");
      messageContainer.textContent = `You:  ${message} (${currentDate})`;
    }
    messageContainer.appendChild(profileImage);
    messageContainer.appendChild(messageText);
    allChat.appendChild(messageContainer);
  }

  /////------ on submit message -----/////
  sendForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const message = messageInput.value;

    // send message
    socket.emit("send-message", message);
    chatting(message, "right", userName);
    messageInput.value = "";
  });
  // receive message
  socket.on("received", (data) => {
    console.log("received", data);
    chatting(data.message, "left", data.user, data.imageUrl);
  });

  /////------ on leave -----////
  socket.on("leave", (userName) => {
    const leftMessage = document.createElement("div");
    leftMessage.textContent = `${userName} has left the chat`;
    allChat.appendChild(leftMessage);
  });

  /////---- User Typing Indicators -----/////
  let typingTimer;
  let typingIndicator = document.getElementById("typingIndicator");
  let typingUsers = {}; // Store users who are currently typing

  messageInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    if (messageInput.value.length > 0) {
      socket.emit("typing");
    } else {
      typingTimer = setTimeout(() => {
        socket.emit("stop-typing");
      }, 1000);
    }
  });

  socket.on("user-typing", (data) => {
    if (data.name) {
      typingUsers[data.name] = true; // Add user to typingUsers
    } else {
      delete typingUsers[data.name]; // Remove user from typingUsers
    }

    updateTypingIndicator();
  });

  // Function to update the typing indicator based on typingUsers
  function updateTypingIndicator() {
    const usersTyping = Object.keys(typingUsers);

    if (usersTyping.length > 0) {
      typingIndicator.textContent = `${usersTyping.join(", ")} ${
        usersTyping.length > 1 ? "are" : "is"
      } typing...`;
    } else {
      typingIndicator.textContent = "";
    }
  }
});
