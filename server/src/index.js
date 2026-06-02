require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth");
const projectRouter = require("./routes/project.routes");
const taskRouter = require("./routes/task.routes");
const uploadRouter = require("./routes/upload.routes");
const notificationRouter = require("./routes/notification.routes");
const { initSocket } = require("./lib/socket");

const app = express();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/notifications", notificationRouter);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
