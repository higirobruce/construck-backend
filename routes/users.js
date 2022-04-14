const router = require("express").Router();
const bcrypt = require("bcryptjs");
const userData = require("../models/users");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    let users = await userData.model.find();
    res.status(200).send(users);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let user = await userData.model.findById(id);
    res.status(200).send(user);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let {
    fistName,
    lastName,
    username,
    password,
    email,
    phone,
    userType,
    company,
  } = req.body;

  try {
    let hashedPassword = await bcrypt.hash(password, 10);
    let userToCreate = new userData.model({
      fistName,
      lastName,
      username,
      password: hashedPassword,
      email,
      phone,
      userType,
      company,
    });

    let userCreated = await userToCreate.save();
    res.status(201).send(userCreated);
  } catch (err) {
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
    let user = await userData.model.find({ email: email });

    if (user.length === 0) {
      res.status(404).send({
        message: "Email not found",
        error: true,
      });
      return;
    }

    let allowed = await bcrypt.compare(password, user[0].password);

    if (allowed) {
      if (user[0].status === "active") {
        res.status(200).send(user[0]);
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
    let { user, status } = req.body;
    let { _id } = user;
    let userD = await userData.model.findById(_id);
    userD.status = status;
    let updatedUser = await userD.save();
    res.status(201).send(updatedUser);
  } catch (err) {
    res.status(500).send({
      message: `${err}`,
      error: true,
    });
  }
});

module.exports = router;
