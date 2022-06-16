const router = require("express").Router();
const assetAvblty = require("../models/assetAvailability");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

router.get("/", async (req, res) => {
  try {
    const avblties = await assetAvblty.model.find();
    res.status(200).send(avblties);
  } catch (err) {
    res.send(err);
  }
});

router.post("/getAnalytics", async (req, res) => {
  let { startDate, endDate, status, customer, project, equipment, owner } =
    req.body;
  try {
    const avblties = await assetAvblty.model.find({
      date: { $gte: startDate, $lte: endDate },
    });
    let totAssets = 0;
    let totAvailable = 0;
    let totUnavailable = 0;
    avblties.forEach((a) => {
      totAssets = totAssets + a.available + a.unavailable;
      totAvailable = totAvailable + a.available;
      totUnavailable = totUnavailable + a.unavailable;
    });

    if (totAssets === 0) totAssets = 1;

    res.send({
      assetAvailability: _.round((totAvailable / totAssets) * 100, 2),
    });
  } catch (err) {}
});

router.post("/", async (req, res) => {
  //if the day's record already exists, update the record
  let { date, available, unavailable } = req.body;

  try {
    const dateData = await assetAvblty.model.findOne({ date });

    if (dateData) {
      dateData.available = available;
      dateData.unavailable = unavailable;

      let dateDataUpdated = await dateData.save();
      res.send(dateDataUpdated).status(202);
    } else {
      let dateDataToSave = new assetAvblty.model(req.body);
      let dataSaved = await dateDataToSave.save();
      res.send(dataSaved).status(201);
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
