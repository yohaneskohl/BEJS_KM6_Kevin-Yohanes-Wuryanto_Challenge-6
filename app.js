require('dotenv').config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const router = require("./routes/v1");

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(router);

module.exports = app;
