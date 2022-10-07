const router = require("express").Router();
const venData = require("../models/vendors");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
  try {
    const vendors = await venData.model.find();
    res.status(200).send(vendors);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let vendorToCreate = new venData.model(req.body);
    let hashedPassword = await bcrypt.hash(req.body.password, 10);
    vendorToCreate.password = hashedPassword;
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

router.put("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let vendor = await venData.model.findByIdAndUpdate(id, req.body);
    res.status(200).send(vendor);
  } catch (err) {
    res.send(err);
  }
});

module.exports = router;
