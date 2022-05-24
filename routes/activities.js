const router = require("express").Router();
const activityData = require("../models/activities");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const activities = await activityData.model.find();
    res.status(200).send(activities);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    const activity = await activityData.model.findById(id);
    res.status(200).send(activity);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { activityDescription } = req.body;
  try {
    let activityToCreate = new activityData.model({
      activityDescription,
    });
    let activityCreated = await activityToCreate.save();

    res.status(201).send(activityCreated);
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
