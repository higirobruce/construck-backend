const router = require("express").Router();
const bcrypt = require("bcryptjs");
const logData = require("../models/logs");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    let logs = await (
      await logData.model.find().populate("doneBy")
    ).filter((l) => l.doneBy !== null);
    res.status(200).send(logs);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
