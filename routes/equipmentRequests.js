const router = require("express").Router();
const requestData = require("../models/equipmentRequest");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const requests = await requestData.model.find().populate('equipmentType');
    res.status(200).send(requests);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const jobType = await requestData.model.findById(id);
    res.status(200).send(jobType);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    let requestToCreate = new requestData.model(req.body);
    let requestCreated = await requestToCreate.save();

    res.status(201).send(requestCreated);
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
