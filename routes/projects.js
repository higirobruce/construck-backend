const router = require("express").Router();
const prjData = require("../models/projects");
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");

router.get("/", async (req, res) => {
  try {
    let projects = await prjData.model.find().populate("customer");
    res.status(200).send(projects);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    let customers = await custData.model.find();
    let projects = [];
    customers.forEach((c) => {
      let cProjects = c.projects;
      if (cProjects && cProjects?.length > 0) {
        cProjects.forEach((p) => {
          let _p = { ...p._doc };
          _p.customer = c?.name;
          _p.customerId = c?._id;
          projects.push(_p);
        });
      }
    });
    res.send(projects);
  } catch (err) {
    res.send(err);
  }
});

router.get("/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let project = await prjData.model.find(id).populate("customer");
    res.status(200).send(project);
  } catch (err) {
    res.send(err);
  }
});

router.get("/approvedRevenue/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    let aggr = [
      {
        $match: {
          "project.prjDescription": prjDescription,
        },
      },
      {
        $group: {
          _id: "$project.prjDescription",
          totalRevenue: {
            $sum: "$approvedRevenue",
          },
        },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);
    const result = await worksCursor;

    res.send(worksCursor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/rejectedRevenue/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    let aggr = [
      {
        $match: {
          "project.prjDescription": prjDescription,
        },
      },
      {
        $group: {
          _id: "$project.prjDescription",
          totalRevenue: {
            $sum: "$rejectedRevenue",
          },
        },
      },
    ];

    let worksCursor = await workData.model.aggregate(aggr);
    const result = await worksCursor;

    res.send(worksCursor);
  } catch (err) {
    res.send(err);
  }
});

router.get("/worksToBeValidated/:prjDescription", async (req, res) => {
  let { prjDescription } = req.params;

  try {
    /*
     * Requires the MongoDB Node.js Driver
     * https://mongodb.github.io/node-mongodb-native
     */

    const filter = {
      "project.prjDescription": prjDescription,
      $or: [
        {
          approvedRevenue: {
            $gt: 0,
          },
        },
        {
          rejectedRevenue: {
            $gt: 0,
          },
        },
      ],
    };
    const projection = {
      "project.prjDescription": 1,
      "dailyWork.totalRevenue": 1,
      "dailyWork.duration": 1,
      "dailyWork.totalExpenditure": 1,
      "dailyWork.rejectedReason": 1,
      "dailyWork.date": 1,
      "dailyWork.status": 1,
      "dailyWork.uom": 1,
      status: 1,
      approvedDuration: 1,
      approvedExpenditure: 1,
      approvedRevenue: 1,
      reasonForRejection: 1,
      rejectedDuration: 1,
      rejectedEpenditure: 1,
      rejectedReason: 1,
      rejectedRevenue: 1,
      siteWork: 1,
      workStartDate: 1,
      "dispatch.date": 1,
      "equipment.uom": 1,
    };

    let worksCursor = await workData.model.find(filter, projection);

    res.send(worksCursor);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  let { prjDescription, customer, startDate, endDate, status } = req.body;
  try {
    let prjToCreate = new prjData.model({
      prjDescription,
      customer,
      startDate,
      endDate,
      status,
    });
    let prjCreated = await prjToCreate.save();
    res.status(201).send(prjCreated);
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
