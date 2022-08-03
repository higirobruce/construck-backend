const router = require("express").Router();
const downTimeData = require("../models/downtimes");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const moment = require("moment");

router.get("/", async (req, res) => {
  try {
    let downtimes = await downTimeData.model.find().populate("equipment");

    res.send(downtimes);
  } catch (err) {}
});

router.post("/getAnalytics", async (req, res) => {
  let { startDate, endDate } = req.body;
  let avgMoved = 0;
  let avgInWorkshop = 0;

  //   console.log(startDate);
  try {
    let downtimes = await downTimeData.model.find({
      $or: [
        {
          //   dateToWorkshop: { $gte: startDate },
          dateFromWorkshop: { $gte: startDate },
        },
        {
          dateFromWorkshop: null,
        },
      ],
    });

    let moveFromWorkshop = downtimes.filter((d) => {
      return d?.dateFromWorkshop;
    });

    let len_moveFromWorkshop =
      moveFromWorkshop?.length > 0 ? moveFromWorkshop?.length : 1;

    moveFromWorkshop?.map((r) => {
      avgMoved = avgMoved + r.durationInWorkshop;
    });

    let stillInWorkshop = downtimes.filter((d) => {
      return !d?.dateFromWorkshop;
    });

    let len_stillInWorkshop =
      stillInWorkshop.length > 0 ? stillInWorkshop.length : 1;

    stillInWorkshop?.forEach((r) => {
      avgInWorkshop =
        avgInWorkshop + moment().diff(moment(r.dateToWorkshop), "hours");
    });

    res.send({
      avgInWorkshop: avgInWorkshop / len_stillInWorkshop,
      avgMoved: _.round(avgMoved / len_moveFromWorkshop, 1),
      avgHours: _.round(
        _.mean([
          avgMoved / len_moveFromWorkshop,
          avgInWorkshop / len_stillInWorkshop,
        ]),
        1
      ),
    });
  } catch (err) {}
});

module.exports = router;
