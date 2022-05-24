const router = require("express").Router();
const prjData = require("../models/projects");
const custData = require("../models/customers");
const findError = require("../utils/errorCodes");
const _ = require("lodash");

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
