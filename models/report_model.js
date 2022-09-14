const pool = require('./db');
const mongoose = require('mongoose');
const momentTimezone = require('moment-timezone');

const responseSchema = new mongoose.Schema({
  scenario_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'scenario',
  },
  example_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'scenario',
  },
  report_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'report',
  },
  response_data: {},
  response_status: Number,
  pass: Boolean,
  request_time: Date,
  request_time_length: Number,
});

const reportSchema = new mongoose.Schema({
  create_time: {
    type: Date,
    default: momentTimezone.tz(Date.now(), 'Asia/Taipei'),
  },
  report_info: {
    report_level: Number,
    report_type: String,
  },
  project_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'project',
  },
  environment_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'environment',
  },
  collection_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'collection',
  },
  api_id: {
    type: mongoose.Schema.ObjectId,
    ref: 'api',
  },
  responses: [
    {
      scenario_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'scenario',
      },
      example_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'scenario',
      },
      response_id: {
        type: mongoose.Schema.ObjectId,
        ref: 'response',
      },
    },
  ],
});

const responseModel = pool.model('response', responseSchema);
const reportModel = pool.model('report', reportSchema);

const exampleResponseInsertModel = async function (
  projectId,
  envId,
  collectionId,
  apiId,
  reportInfo,
  responseArray
) {
  const session = await responseModel.startSession();
  session.startTransaction();
  try {
    const opts = { session };
    console.log(responseArray);

    let reportId = await reportModel({
      project_id: projectId,
      environment_id: envId,
      collection_id: collectionId,
      api_id: apiId,
      report_info: reportInfo,
    }).save(opts);

    // let responseToInsert = [];
    for (let i = 0; i < responseArray.length; i++) {
      let objectToInsert = {
        report_id: reportId._id,
        response_data: responseArray[i].response_data,
        response_status: responseArray[i].response_status,
        pass: responseArray[i].pass,
        request_time: responseArray[i].request_time,
        request_time_length: responseArray[i].request_time_length,
      };

      let inserted = await responseModel(objectToInsert).save(opts);
      // responseToInsert.push(inserted._id);

      await reportModel.updateOne(
        { _id: reportId._id },
        {
          $push: {
            responses: [
              {
                scenario_id: responseArray[0].scenario_id,
                example_id: responseArray[i].example_id,
                response_id: inserted._id,
              },
            ],
          },
        },
        opts
      );
    }

    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (error) {
    // If an error occurred, abort the whole transaction and
    // undo any changes that might have happened
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const apiResponseInsertModel = async function (
  projectId,
  envId,
  collectionId,
  apiId,
  reportInfo,
  responseArray
) {
  const session = await responseModel.startSession();
  session.startTransaction();
  try {
    const opts = { session };
    console.log(responseArray);

    let reportId = await reportModel({
      project_id: projectId,
      environment_id: envId,
      collection_id: collectionId,
      api_id: apiId,
      report_info: reportInfo,
    }).save(opts);

    // let responseToInsert = [];
    for (let i = 0; i < responseArray.length; i++) {
      let objectToInsert = {
        report_id: reportId._id,
        response_data: responseArray[i].response_data,
        response_status: responseArray[i].response_status,
        pass: responseArray[i].pass,
        request_time: responseArray[i].request_time,
        request_time_length: responseArray[i].request_time_length,
      };

      let inserted = await responseModel(objectToInsert).save(opts);
      // responseToInsert.push(inserted._id);

      // FIXME: in db the responses is empty
      await reportModel.updateOne(
        { _id: reportId._id },
        {
          $push: {
            responses: [
              {
                scenario_id: responseArray[i].scenario_id,
                example_id: responseArray[i].example_id,
                response_id: inserted._id,
              },
            ],
          },
        },
        opts
      );
    }

    await session.commitTransaction();
    session.endSession();
    return true;
  } catch (error) {
    // If an error occurred, abort the whole transaction and
    // undo any changes that might have happened
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getExampleReportModel = async function (projectId, envId) {
  let [reportData] = await reportModel.find({
    project_id: projectId,
    environment_id: envId,
  });

  return reportData._id;
};

const getReportResponseModel = async function (reportId) {
  let responseData = await responseModel.find({
    report_id: reportId,
  });
  return responseData;
};

module.exports = {
  responseModel,
  reportModel,
  exampleResponseInsertModel,
  apiResponseInsertModel,
  getExampleReportModel,
  getReportResponseModel,
};
