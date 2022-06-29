const router = require("express").Router();
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const workData = require("../models/workData");
const employeeData = require("../models/employees");
const assetAvblty = require("../models/assetAvailability");
const logData = require("../models/logs");
const eqData = require("../models/equipments");
const moment = require("moment");
const e = require("express");
const { isNull } = require("lodash");
const MS_IN_A_DAY = 86400000;

router.get("/", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v2", async (req, res) => {
  try {
    let workList = await workData.model
      .find()
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);
    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
    res.status(200).send(workList);
  } catch (err) {
    res.send(err);
  }
});

router.get("/v3", async (req, res) => {
  try {
    let workList = await workData.model
      .find(
        {},
        {
          "project.createdOn": false,
          "equipment.__v": false,
          "equipment.createdOn": false,
          "dispatch.project": false,
          "dispatch.equipments": false,
          "driver.password": false,
          "driver.email": false,
          "driver.createdOn": false,
          "driver.__v": false,
          "driver._id": false,
        }
      )

      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone")
      .sort([["_id", "descending"]]);

    // res.status(200).send(workList.filter((w) => !isNull(w.driver)));
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
      // .populate("project")
      // .populate({
      //   path: "project",
      //   populate: {
      //     path: "customer",
      //     model: "customers",
      //   },
      // })
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("createdBy")
      .populate("workDone");

    res.status(200).send(work);
  } catch (err) {
    res.send(err);
  }
});

router.post("/", async (req, res) => {
  try {
    console.log(req.body);
    let workToCreate = new workData.model(req.body);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    equipment.eqStatus = "dispatched";
    equipment.assignedToSiteWork = req.body?.siteWork;
    equipment.assignedDate = req.body?.dispatch?.date;
    equipment.assignedShift = req.body?.dispatch?.shift;
    let driver = req.body?.driver === "NA" ? null : req.body?.driver;

    let employee = await employeeData.model.findById(driver);
    if (employee) employee.status = "dispatched";

    let rate = parseInt(equipment.rate);
    let uom = equipment.uom;
    let revenue = 0;
    let siteWork = req.body?.siteWork;
    let workDurationDays = req.body?.workDurationDays;

    await equipment.save();
    if (employee) await employee.save();

    workToCreate.equipment = equipment;
    if (uom === "hour") revenue = rate * 5;
    if (uom === "day") revenue = rate;

    // workToCreate.totalRevenue = revenue;
    workToCreate.projectedRevenue = siteWork
      ? revenue * workDurationDays
      : revenue;

    workToCreate.driver = driver;
    let workCreated = await workToCreate.save();

    //log saving
    let log = {
      action: "DISPATCH CREATED",
      doneBy: req.body.createdBy,
      payload: workToCreate,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();
    res.status(201).send(workCreated);
  } catch (err) {
    console.log(err);
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

router.post("/mobileData", async (req, res) => {
  try {
    let bodyData = {
      project: JSON.parse(req.body.project),
      equipment: JSON.parse(req.body.equipment),
      workDone: req.body.workDone,
      startIndex: req.body.startIndex,
      endIndex: req.body.endIndex,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      rate: req.body.rate,
      driver: req.body.driver,
      status: req.body.status,
      duration: req.body.duration,
      comment: req.body.comment,
      siteWork: req.body.siteWork === "yes" ? true : false,
    };
    let workToCreate = new workData.model(bodyData);
    console.log(req.body);

    let equipment = await eqData.model.findById(workToCreate?.equipment?._id);
    if (equipment.eqStatus === "available") {
      // Save data only when equipment is available
      equipment.eqStatus = "dispatched";
      equipment.assignedToSiteWork = true;
      equipment.assignedDate = req.body?.dispatch?.date;
      equipment.assignedShift = req.body?.dispatch?.shift;

      let driver = req.body?.driver === "NA" ? null : req.body?.driver;

      let employee = await employeeData.model.findById(driver);
      if (employee) employee.status = "dispatched";

      let rate = parseInt(equipment.rate);
      let uom = equipment.uom;
      let revenue = 0;
      let siteWork = bodyData?.siteWork;
      let workDurationDays =
        moment(bodyData.endTime).diff(moment(bodyData.startTime)) / MS_IN_A_DAY;

      await equipment.save();
      if (employee) await employee.save();

      workToCreate.equipment = equipment;
      workToCreate.workDurationDays = workDurationDays;
      if (uom === "hour") revenue = rate * 5;
      if (uom === "day") revenue = rate;

      // workToCreate.totalRevenue = revenue;
      workToCreate.projectedRevenue = siteWork
        ? revenue * workDurationDays
        : revenue;

      workToCreate.driver = driver;
      let workCreated = await workToCreate.save();

      //log saving
      let log = {
        action: "DISPATCH CREATED",
        doneBy: req.body.createdBy,
        payload: req.body,
      };
      console.log(log);
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(workCreated);
    } else {
      res.status(201).send(bodyData);
    }
  } catch (err) {
    console.log(err);
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

router.post("/getAnalytics", async (req, res) => {
  let { startDate, endDate, status, customer, project, equipment, owner } =
    req.body;
  let total = 0;
  let totalRevenue = 0;
  let projectedRevenue = 0;
  let totalDays = 0;
  try {
    let workList = await workData.model
      .find({
        status:
          status === "final"
            ? { $in: ["approved", "stopped"] }
            : { $in: ["created", "in progress", "rejected", "stopped"] },
      })
      .and([{ "dispatch.date": { $gte: startDate, $lte: endDate } }]);

    if (workList && workList.length > 0) {
      total = 0;

      let list = [];

      if (customer) {
        list = workList.filter((w) => {
          let nameLowerCase = w?.project?.customer?.toLowerCase();
          return nameLowerCase.includes(customer?.toLowerCase());
        });
      } else {
        list = workList;
      }

      if (project) {
        list = list.filter((w) => {
          let descLowerCase = w?.project?.prjDescription?.toLowerCase();
          return descLowerCase.includes(project.toLowerCase());
        });
      }

      if (equipment) {
        list = list.filter((w) => {
          let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
          return plateLowerCase.includes(equipment.toLowerCase());
        });
      }

      if (owner) {
        list = list.filter((w) => {
          let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
          if (owner.toLowerCase() === "construck")
            return ownerLowercase === "construck";
          else if (owner.toLowerCase() === "hired")
            return ownerLowercase !== "construck";
          else return true;
        });
      }

      list.map((w) => {
        totalRevenue = totalRevenue + w.totalRevenue;
        projectedRevenue = projectedRevenue + w.projectedRevenue;
      });
    }

    let workListByDay = await workData.model
      .find({ uom: "day" })
      .and([{ "dispatch.date": { $gte: startDate, $lte: endDate } }]);
    let listDays = [];
    if (customer) {
      listDays = workListByDay.filter((w) => {
        let nameLowerCase = w?.project?.customer?.toLowerCase();
        return nameLowerCase.includes(customer?.toLowerCase());
      });
    } else {
      listDays = workListByDay;
    }

    if (project) {
      listDays = listDays.filter((w) => {
        let descLowerCase = w?.project?.prjDescription?.toLowerCase();
        return descLowerCase.includes(project.toLowerCase());
      });
    }

    if (equipment) {
      listDays = listDays.filter((w) => {
        let plateLowerCase = w?.equipment?.plateNumber?.toLowerCase();
        return plateLowerCase.includes(equipment.toLowerCase());
      });
    }

    if (owner) {
      listDays = listDays.filter((w) => {
        let ownerLowercase = w?.equipment?.eqOwner?.toLowerCase();
        if (owner.toLowerCase() === "construck")
          return ownerLowercase === "construck";
        else if (owner.toLowerCase() === "hired")
          return ownerLowercase !== "construck";
        else return true;
      });
    }

    listDays.map((w) => {
      totalDays = totalDays + w.duration;
    });

    let dispatches = await workData.model.find({
      createdOn: { $gte: startDate, $lte: endDate },
    });

    let listDispaches = [];
    if (customer) {
      listDispaches = dispatches.filter((w) => {
        let nameLowerCase = w?.project?.customer?.toLowerCase();
        return nameLowerCase.includes(customer?.toLowerCase());
      });
    } else {
      listDispaches = dispatches;
    }

    res.status(200).send({
      totalRevenue,
      projectedRevenue,
      totalDays: _.round(totalDays, 1),
    });
  } catch (err) {
    console.log(err);
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

router.put("/approve/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    work.status = "approved";

    let savedRecord = await work.save();
    await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/recall/:id", async (req, res) => {
  let { id } = req.params;
  try {
    let work = await workData.model.findById(id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) employee.status = "active";

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    work.status = "recalled";
    work.equipment = equipment;
    work.projectedRevenue = 0;
    work.totalRevenue = 0;

    let savedRecord = await work.save();

    await equipment.save();
    if (employee) await employee.save();

    //log saving
    let log = {
      action: "DISPATCH RECALLED",
      doneBy: req.body.recalledBy,
      payload: work,
    };
    let logTobeSaved = new logData.model(log);
    await logTobeSaved.save();

    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/reject/:id", async (req, res) => {
  let { id } = req.params;
  let { reasonForRejection } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    work.status = "rejected";
    work.reasonForRejection = reasonForRejection;
    work.totalRevenue = 0;
    // work.projectedRevenue = 0;

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: { eqStatus: "available", assignedDate: null, assignedShift: "" },
      }
    );
    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "available";
    equipment.assignedDate = null;
    equipment.assignedShift = "";

    let savedRecord = await work.save();
    await equipment.save();
    res.status(201).send(savedRecord);
  } catch (err) {
    console.log(err);
  }
});

router.put("/start/:id", async (req, res) => {
  let { id } = req.params;
  let { startIndex } = req.body;
  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("dispatch")
      .populate("appovedBy")
      .populate("workDone");

    let eqId = work?.equipment?._id;
    await workData.model.updateMany(
      { "equipment._id": eqId },
      {
        $set: {
          eqStatus: "in progress",
          assignedDate: Date.now(),
        },
      }
    );

    let equipment = await eqData.model.findById(work?.equipment?._id);
    equipment.eqStatus = "assigned to job";
    equipment.assignedToSiteWork = true;

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) employee.status = "busy";

    if (work.siteWork) {
      let dailyWork = {
        day: moment().diff(moment(work.workStartDate), "days"),
        startTime: Date.now(),
        startIndex,
      };
      work.dailyWork.push(dailyWork);
      work.status = "in progress";
      work.startIndex = startIndex;
      let savedRecord = await work.save();
      if (employee) await employee.save();

      //log saving
      let log = {
        action: "DISPATCH STARTED",
        doneBy: req.body.startedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(savedRecord);
    } else {
      work.status = "in progress";
      work.startTime = Date.now();
      work.startIndex = startIndex;
      work.equipment = equipment;
      let savedRecord = await work.save();

      if (employee) await employee.save();
      await equipment.save();

      //log saving
      let log = {
        action: "DISPATCH STARTED",
        doneBy: req.body.startedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(savedRecord);
    }
  } catch (err) {
    console.log(err);
  }
});

router.put("/stop/:id", async (req, res) => {
  let { id } = req.params;
  let { duration, endIndex, tripsDone, comment } = req.body;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    let equipment = await eqData.model.findById(work?.equipment?._id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) employee.status = "active";

    if (work.siteWork) {
      let dailyWork = {};
      let currentTotalRevenue = work.totalRevenue;
      let currentDuration = work.duration;
      let currentTotalExpenditure = work.totalExpenditure;

      work.status = "created";

      let _duration = work.endTime - work.startTime;

      let startIndex = work.startIndex ? work.startIndex : 19999;
      dailyWork.endIndex = endIndex ? parseInt(endIndex) : parseInt(startIndex);
      dailyWork.startIndex = parseInt(startIndex);

      equipment.millage = endIndex ? parseInt(endIndex) : parseInt(startIndex);

      let uom = work?.equipment?.uom;
      let rate = work?.equipment?.rate;
      let supplierRate = work?.equipment?.supplierRate;
      let revenue = 0;
      let expenditure = 0;

      // if rate is per hour and we have target trips to be done
      if (uom === "hour") {
        if (comment !== "Ibibazo bya panne") {
          dailyWork.duration = duration ? duration * 3600000 : _duration;

          revenue = (rate * dailyWork.duration) / 3600000;
          expenditure = (supplierRate * dailyWork.duration) / 3600000;
        } else {
          dailyWork.duration = duration ? duration * 3600000 : _duration;
          revenue = (rate * dailyWork.duration) / 3600000;
          expenditure = (supplierRate * dailyWork.duration) / 3600000;
        }
      }

      //if rate is per day
      if (uom === "day") {
        // work.duration = duration;
        // revenue = rate * duration;
        if (comment !== "Ibibazo bya panne") {
          dailyWork.duration = duration / 24;
          revenue = rate;
          expenditure = supplierRate;
        } else {
          dailyWork.duration = duration / 24;

          let targetDuration = 5;
          let durationRation =
            duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
          dailyWork.duration = duration / 24;
          revenue = rate;
          expenditure = supplierRate;
        }
      }

      dailyWork.rate = rate;
      dailyWork.uom = uom;
      dailyWork.totalRevenue = revenue ? revenue : 0;
      dailyWork.totalExpenditure = expenditure ? expenditure : 0;
      dailyWork.comment = comment;

      let dailyWorks = [...work.dailyWork];

      let indexToUpdate = -1;
      let workToUpdate = dailyWorks.find((d, index) => {
        d.day == moment().diff(moment(work.workStartDate), "days");
        indexToUpdate = index;
      });

      dailyWorks[indexToUpdate] = dailyWork;

      work.startIndex = parseInt(endIndex);
      work.dailyWork = dailyWorks;
      work.duration = dailyWork.duration + currentDuration;
      work.totalRevenue = currentTotalRevenue + revenue;
      work.totalExpenditure = currentTotalExpenditure + expenditure;
      work.equipment = equipment;

      await equipment.save();
      if (employee) await employee.save();
      let savedRecord = await work.save();

      //log saving
      let log = {
        action: "DISPATCH STOPPED",
        doneBy: req.body.stoppedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(savedRecord);
    } else {
      let eqId = work?.equipment?._id;
      await workData.model.updateMany(
        { "equipment._id": eqId },
        {
          $set: {
            eqStatus: "available",
            assignedDate: null,
            assignedShift: "",
          },
        }
      );
      let equipment = await eqData.model.findById(work?.equipment?._id);
      equipment.eqStatus = "available";
      equipment.assignedDate = null;
      equipment.assignedShift = "";
      equipment.millage = endIndex ? parseInt(endIndex) : parseInt(startIndex);

      work.status = "stopped";
      work.endTime = Date.now();
      let _duration = work.endTime - work.startTime;

      let startIndex = work.startIndex ? work.startIndex : 19999;
      work.endIndex = endIndex ? parseInt(endIndex) : parseInt(startIndex);
      work.startIndex = parseInt(startIndex);
      work.tripsDone = parseInt(tripsDone);
      let uom = work?.equipment?.uom;

      let rate = work?.equipment?.rate;
      let supplierRate = work?.equipment?.supplierRate;
      let targetTrips = parseInt(work?.dispatch?.targetTrips); //TODO

      let tripsRatio = tripsDone / (targetTrips ? targetTrips : 1);
      let revenue = 0;
      let expenditure = 0;

      // if rate is per hour and we have target trips to be done
      if (uom === "hour") {
        if (comment !== "Ibibazo bya panne") {
          work.duration = duration ? duration * 3600000 : _duration;
          revenue = (rate * work.duration) / 3600000;
          expenditure = (supplierRate * work.duration) / 3600000;
        } else {
          work.duration = duration ? duration * 3600000 : _duration;
          revenue = (tripsRatio * (rate * work.duration)) / 3600000;
          expenditure = (tripsRatio * (supplierRate * work.duration)) / 3600000;
        }
      }

      //if rate is per day
      if (uom === "day") {
        // work.duration = duration;
        // revenue = rate * duration;
        if (comment !== "Ibibazo bya panne") {
          work.duration = duration / 24;
          revenue = rate;
          expenditure = supplierRate;
        } else {
          work.duration = duration / 24;
          let tripRatio = tripsDone / targetTrips;
          if (tripsDone && targetTrips) {
            if (tripRatio >= 1) {
              revenue = rate * targetTrips;
              expenditure = supplierRate * targetTrips;
              // revenue = rate;
            } else {
              revenue = rate * tripRatio;
              expenditure = supplierRate * tripRatio;
            }
          }
          if (!targetTrips || targetTrips == "0") {
            {
              let targetDuration = 5;
              let durationRation =
                duration >= 5 ? 1 : _.round(duration / targetDuration, 2);
              work.duration = duration / 24;
              revenue = rate;
              expenditure = supplierRate;
            }
          }
        }
      }

      work.rate = rate;
      work.uom = uom;
      work.totalRevenue = revenue ? revenue : 0;
      work.totalExpenditure = expenditure ? expenditure : 0;
      work.comment = comment;
      work.equipment = equipment;

      let savedRecord = await work.save();
      if (employee) await employee.save();
      await equipment.save();

      //log saving
      let log = {
        action: "DISPATCH STOPPED",
        doneBy: req.body.stoppedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();

      res.status(201).send(savedRecord);
    }
  } catch (err) {
    console.log(err);
  }
});

router.put("/end/:id", async (req, res) => {
  let { id } = req.params;

  try {
    let work = await workData.model
      .findById(id)
      .populate("project")
      .populate("equipment")
      .populate("driver")
      .populate("appovedBy")
      .populate("dispatch")
      .populate("workDone");

    let equipment = await eqData.model.findById(work?.equipment?._id);

    let employee = await employeeData.model.findById(work?.driver);
    if (employee) employee.status = "active";

    if (work.siteWork) {
      work.status = "stopped";
      equipment.eqStatus = "available";
      equipment.assignedDate = null;
      equipment.assignedShift = "";

      work.projectedRevenue = work.totalRevenue;
      work.equipment = equipment;

      await equipment.save();
      if (employee) await employee.save();
      let savedRecord = await work.save();

      //log saving
      let log = {
        action: "SITE WORK ENDED",
        doneBy: req.body.stoppedBy,
        payload: work,
      };
      let logTobeSaved = new logData.model(log);
      await logTobeSaved.save();
      res.status(201).send(savedRecord);
    }
  } catch (err) {
    console.log(err);
  }
});

module.exports = router;
