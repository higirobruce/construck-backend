const router = require("express").Router();
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy");

    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy");

    res.status(200).send(work);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let {
    project,
    equipment,
    workDone,
    startIndex,
    endIndex,
    startTime,
    endTime,
    rate,
    driver,
    status,
  } = req.body;
  try {
    let workToCreate = new workData.model({
      project,
      equipment,
      workDone,
      startIndex,
      endIndex,
      startTime,
      endTime,
      rate,
      driver,
      status,
    });
    let workCreated = await workToCreate.save();
    res.status(201).send(workCreated);
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
