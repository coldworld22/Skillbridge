const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const testRoute = require("./routes/testRoute");

require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api", testRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
