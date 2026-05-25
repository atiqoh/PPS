"use strict";
const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").createServer(app);
var path = require("path");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve("./public")));

require("./routes")(app);

var server = http.listen(process.env.URL_PORT, () => {});