const router = require("express").Router();
const bcrypt = require("bcryptjs");
const employeeData = require("../models/employees");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    let employees = await employeeData.model.find();
    res.status(200).send(employees);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let employee = await employeeData.model.findById(id);
    res.status(200).send(employee);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    let employeeToCreate = new employeeData.model(req.body);

    let employeeCreated = await employeeToCreate.save();
    employeeCreated.password = hashedPassword;
    res.status(201).send(employeeCreated);
  } catch (err) {
    console.log(err);
    let error = findError(err.code);
    let keyPattern = err.keyPattern;
    let key = _.findKey(keyPattern, function (key) {
      return key === 1;
    });
    res.send({
      error,
      key,
    });
  }
});

router.post("/login", async (req, res) => {
  let { email, password } = req.body;
  try {
    let employee = await employeeData.model.findOne({ email: email });
    if (employee?.length === 0) {
      res.status(404).send({
        message: "Email not found",
        error: true,
      });
      return;
    }

    let allowed = await bcrypt.compare(password, employee.password);

    if (allowed) {
      if (employee.status === "active") {
        // employee.message = "Allowed";
        res.status(200).send({ employee, message: "Allowed" });
      } else {
        res.status(401).send({
          message: "Not activated!",
          error: true,
        });
      }
    } else {
      res.status(401).send({
        message: "Not allowed!",
        error: true,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

router.put("/status", async (req, res) => {
  try {
    let { employee, status } = req.body;
    let { _id } = employee;
    let employeeD = await employeeData.model.findById(_id);
    employeeD.status = status;
    let updatedEmployee = await employeeD.save();
    res.status(201).send(updatedEmployee);
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

module.exports = router;
