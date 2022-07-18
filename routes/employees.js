const router = require("express").Router();
const bcrypt = require("bcryptjs");
const employeeData = require("../models/employees");
const venData = require("../models/vendors");
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

router.get("/:date/:shift", async (req, res) => {
  let { type, date, shift } = req.params;
  try {
    const employee = await employeeData.model.find({
      $or: [
        { status: "active" },
        {
          status: "busy",
          assignedShift: { $ne: shift },
          //assignedToSiteWork: { $ne: true },
        },
        {
          status: "busy",
          assignedDate: { $ne: date },
          //assignedToSiteWork: { $ne: true },
        },
        {
          status: "dispatched",
          assignedShift: { $ne: shift },
          //assignedToSiteWork: { $ne: true },
        },
        {
          status: "dispatched",
          assignedDate: { $ne: date },
          //assignedToSiteWork: { $ne: true },
        },
      ],
    });
    res.status(200).send(employee);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    let employeeToCreate = new employeeData.model(req.body);
    employeeToCreate.password = hashedPassword;
    let employeeCreated = await employeeToCreate.save();

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
  let { phone, password } = req.body;
  try {
    let employee = await employeeData.model.findOne({ phone: phone });
    let vendor = await venData.model.findOne({ phone: phone });
    let allowed = false;

    if (!employee) {
      if (!vendor) {
        res.status(404).send({
          message: "User not found",
          error: true,
        });
        return;
      } else {
        allowed = await bcrypt.compare(password, vendor.password);
      }
    } else {
      allowed = await bcrypt.compare(password, employee.password);
    }

    if ((await bcrypt.compare("password", vendor.password)) && employee) {
      employee.password = await bcrypt.hash(password, 10);
      allowed = true;
      await employee.save();
    }

    if ((await bcrypt.compare("password", vendor.password)) && vendor) {
      vendor.password = await bcrypt.hash(password, 10);
      allowed = true;
      await vendor.save();
    }

    if (allowed) {
      if (employee) {
        if (employee.status !== "inactive") {
          // employee.message = "Allowed";
          res.status(200).send({
            employee: {
              _id: employee._id,
              firstName: employee.firstName,
              lastName: employee.lastName,
            },
            message: "Allowed",
            vendor: false,
          });
        } else {
          res.status(401).send({
            message: "Not activated!",
            error: true,
          });
        }
      }

      if (vendor) {
        res.status(200).send({
          employee: {
            _id: vendor.name,
            firstName: vendor.name,
            lastName: "",
          },
          message: "Allowed",
          vendor: true,
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
