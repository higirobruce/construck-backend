const router = require("express").Router();
const assetAvblty = require("../models/assetAvailability");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const moment = require("moment");

router.get("/", async (req, res) => {
  try {
    const avblties = await assetAvblty.model.find();
    res.status(200).send(avblties);
  } catch (err) {
    res.send(err);
  }
});

router.post("/getAnalytics", async (req, res) => {
  let { startDate, endDate } = req.body;
  try {
    let avblties = await assetAvblty.model.find({
      date: { $gte: startDate, $lte: endDate },
    });
    let totAssets = 0;
    let totAvailable = 0;
    let totUnavailable = 0;
    let totDispatched = 0;
    let totStandby = 0;
    if (avblties.length > 0) {
      avblties.forEach((a) => {
        totAssets =
          totAssets +
          (a.available ? a.available : 0) +
          (a.unavailable ? a.unavailable : 0);
        totAvailable = totAvailable + (a.available ? a.available : 0);
        totUnavailable = totUnavailable + (a.unavailable ? a.unavailable : 0);
        totDispatched = totDispatched + (a.dispatched ? a.dispatched : 0);
        totStandby = totStandby + (a.standby ? a.standby : 0);
      });
    } else {
      avblties = await assetAvblty.model.find({});

      avblties.forEach((a) => {
        totAssets =
          totAssets +
          ((a.available ? a.available : 0) +
            (a.unavailable ? a.unavailable : 0));
        totAvailable = totAvailable + (a.available ? a.available : 0);
        totUnavailable = totUnavailable + (a.unavailable ? a.unavailable : 0);
        totDispatched = totDispatched + (a.dispatched ? a.dispatched : 0);
        totStandby = totStandby + (a.standby ? a.standby : 0);
      });
    }

    if (totAssets === 0) totAssets = 1;
    if (totAvailable === 0) totAvailable = 1;

    res.send({
      assetAvailability: _.round((totAvailable / totAssets) * 100, 2),
      assetUtilization: _.round((totDispatched / totAvailable) * 100, 2),
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
