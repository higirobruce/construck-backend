const express = require("express");
var cors = require("cors");
const app = express();
const bodyParser = require("body-parser");

const PORT = process.env.PORT ? process.env.PORT : 9000;

var mongoose = require("mongoose");
const equipments = require("./routes/equipments");
const users = require("./routes/users");
const customers = require("./routes/customers");
const vendors = require("./routes/vendors");
const projects = require("./routes/projects");
const works = require("./routes/workData");
const activities = require("./routes/activities");
const dispatches = require("./routes/dispatches");
const jobTypes = require("./routes/jobTypes");
const reasons = require("./routes/reasons");
const employees = require("./routes/employees");
const avblty = require("./routes/assetAvailability");
//Set up default mongoose connection
// var mongoDB =
//   "mongodb://riskAdmin:risk%40CVL2020@localhost:27017/construck?authSource=admin";

var mongoDB =
  "mongodb+srv://mongo-admin:2tij6e0anAgKU6tb@myfreecluster.kxvgw.mongodb.net/construck-playground?retryWrites=true&w=majority";

// var mongoDB = "";
// mongoDB = process.env.CONS_MONGO_DB;

mongoose.connect(mongoDB, { useNewUrlParser: true });
//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("Welcome");
});

app.use("/equipments", equipments);
app.use("/customers", customers);
app.use("/users", users);
app.use("/vendors", vendors);
app.use("/projects", projects);
app.use("/works", works);
app.use("/activities", activities);
app.use("/reasons", reasons);
app.use("/dispatches", dispatches);
app.use("/jobtypes", jobTypes);
app.use("/employees", employees);
app.use("/assetAvailability", avblty);

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});
