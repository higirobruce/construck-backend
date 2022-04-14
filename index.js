const express = require("express");
const app = express();
const bodyParser = require("body-parser");

var mongoose = require("mongoose");
const equipments = require("./routes/equipments");
const users = require("./routes/users");
const customers = require("./routes/customers");
const vendors = require("./routes/vendors");
const projects = require("./routes/projects");
const works = require("./routes/workData");
//Set up default mongoose connection
var mongoDB =
  "mongodb://riskAdmin:risk%40CVL2020@localhost:27017/construck?authSource=admin";
mongoose.connect(mongoDB, { useNewUrlParser: true });
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.use("/equipments", equipments);
app.use("/customers", customers);
app.use("/users", users);
app.use("/vendors", vendors);
app.use("/projects", projects);
app.use("/works", works);

app.listen(9000, () => {
  console.log("listening on 9000");
});
