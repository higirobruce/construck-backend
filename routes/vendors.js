const router = require("express").Router();
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const vendors = await venData.model.find();
    res.status(200).send(vendors);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { fistName, lastName, tinNumber } = req.body;
  try {
    let vendorToCreate = new venData.model({
      fistName,
      lastName,
      tinNumber,
    });
    let vendorCreated = await vendorToCreate.save();

    res.status(201).send(vendorCreated);
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

module.exports = router;
