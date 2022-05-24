const router = require("express").Router();
const reasonData = require("../models/reasons");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const reasons = await reasonData.model.find();
    res.status(200).send(reasons);
  } catch (err) {}
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const reason = await reasonData.model.findById(id);
    res.status(200).send(reason);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { description } = req.body;
  try {
    const reasonToCreate = new reasonData.model({
      description,
    });
    const reasonCreated = await reasonToCreate.save();
    res.status(201).send(reasonCreated);
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
