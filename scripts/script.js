const socket = io();

const form = document.getElementById("form");
const input = document.getElementById("input");
const messages = document.getElementById("messages");

function createMessage(msg) {
  const item = document.createElement("li");
  item.textContent = `${msg.username}: ${msg.message}`;
  messages.appendChild(item);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit("chat message", { message: input.value });
    input.value = "";
    console.log();
  }
});

socket.on("chat message", (msg) => {
  createMessage(msg);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on("updateEvent", (msg) => {
  console.log(msg);

  messages.innerHTML = "";
  for (let message of msg) {
    console.log(message);
    createMessage(message);
  }
  window.scrollTo(0, document.body.scrollHeight);
});
