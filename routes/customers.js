const router = require("express").Router();
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const customers = await custData.model.find();
    res.status(200).send(customers);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const customer = await custData.model.findById(id);
    res.status(200).send(customer);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { fistName, lastName, tinNumber } = req.body;
  try {
    let customerToCreate = new custData.model({
      fistName,
      lastName,
      tinNumber,
    });
    let customerCreated = await customerToCreate.save();

    res.status(201).send(customerCreated);
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
