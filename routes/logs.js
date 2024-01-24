const router = require("express").Router();
const bcrypt = require("bcryptjs");
const logData = require("../models/logs");
const findError = require("../utils/errorCodes");
const _ = require("lodash");
const { Types } = require("mongoose");

router.get("/", async (req, res) => {
  try {
    let logs = await (
      await logData.model
        .find({
          "payload.equipment.plateNumber": "RAB 791 L",
          // action: "DISPATCH STOPPED",
        })
        .populate("doneBy")
    ).filter((l) => l.doneBy !== null);

    let newObjs = logs.map((l, i) => {
      return {
        action: l.action,
        id: l._id,
        doneby: l.doneBy?.firstName + " " + l.doneBy?.lastName,
        project: l.payload?.project?.prjDescription,
        platenumber: l.payload?.equipment?.platenumber,
        createdOn: l.createdOn,
        duration: l.payload?.duration / (1000 * 60 * 60) + "hours",
        totalRevenue: l.payload?.totalRevenue,
      };
    });
    res.status(200).send(newObjs);
  } catch (err) {
    res.send(err);
  }
});

router.get("/filtered", async (req, res) => {
  let pipeline = [];
  let { plateNumber, startDate, endDate, jobCardId, workId } = req.query;

  if (plateNumber)
    pipeline.push({
      $match:
        /**
         * query: The query in MQL.
         */
        {
          "payload.equipment.plateNumber": plateNumber,
        },
    });

  if (workId)
    pipeline.push({
      $match:
        /**
         * query: The query in MQL.
         */
        {
          "payload._id": new Types.ObjectId(workId),
          action: { $regex: "DISPATCH ", $options: "i" },
        },
    });

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "doneBy",
        foreignField: "_id",
        as: "doneByUser",
      },
    },
    {
      $unwind: {
        path: "$doneByUser",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "employees",
        localField: "doneBy",
        foreignField: "_id",
        as: "doneByEmployee",
      },
    },
    {
      $unwind: {
        path: "$doneByEmployee",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields:
        /**
         * newField: The new field name.
         * expression: The new field expression.
         */
        {
          equipment: "$payload.equipment.plateNumber",
        },
    },
    {
      $addFields: {
        doneBy: {
          $ifNull: ["$doneByUser", "$doneByEmployee"],
        },
      },
    },

    {
      $project:
        /**
         * specifications: The fields to
         *   include or exclude.
         */
        {
          action: 1,
          doneBy: 1,
          createdOn: 1,
          equipment: 1,
        },
    },
    {
      $sort:
        /**
         * Provide any number of field/order pairs.
         */
        {
          createdOn: 1,
        },
    }
  );

  let results = await logData.model.aggregate(pipeline);

  res.send(results);
});

module.exports = router;
