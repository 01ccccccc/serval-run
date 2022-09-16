const {
  scenarioGetModel,
  exampleGetModel,
} = require('../models/scenario_model');
const {
  collectionGetModel,
  apiGetModel,
  apiInfoGetModel,
} = require('../models/collection_model');
const {
  projectGetModel,
  projectNameGetModel,
  environmentGetModel,
  projectInfoGetModel,
} = require('../models/project_model');
const {
  exampleResponseInsertModel,
  apiResponseInsertModel,
  collectionResponseInsertModel,
  getReportModel,
  getReportResponseModel,
} = require('../models/report_model');
const { callHttpRequest } = require('../service/httpRequest_service');
const { calculateReport } = require('../service/reportStatistic_service');

const scenarioRunController = async (req, res) => {
  const apiId = req.body.apiId;
  const scenarioId = req.body.scenarioId;
  const domainName = req.body.domainName;
  const title = req.body.title;
  const reportInfo = req.body.report_info;
  const { collectionId, httpMethod, apiEndpoint } = await apiInfoGetModel(
    apiId
  );
  const { projectId, envId } = await projectInfoGetModel(domainName, title);
  const testData = await exampleGetModel(scenarioId);
  testData.api_id = apiId;
  console.log('testData in scenarioRunController: ', testData);

  // TODO: refactor

  // let testInfo = {
  //   apiId: apiId,
  //   scenarioId: scenarioId,
  //   collectionId: collectionId,
  //   projectId: projectId,
  //   envId: envId,
  // };

  let testConfig = {
    method: `${httpMethod}`,
    url: `${domainName}${apiEndpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let httpRequestResult = await callHttpRequest(testConfig, testData);
  console.log('httpRequestResult in report controller: ', httpRequestResult);

  let insertTestResult = await exampleResponseInsertModel(
    projectId,
    envId,
    collectionId,
    reportInfo,
    httpRequestResult
  );

  if (!insertTestResult) {
    return res.status(403).json({ message: 'run scenario test error' });
  }
  return res.status(200).json({ message: 'scenario test response inserted' });
};

const apiRunController = async (req, res) => {
  const apiId = req.body.apiId;
  const domainName = req.body.domainName;
  const title = req.body.title;
  const reportInfo = req.body.report_info;
  const { collectionId, httpMethod, apiEndpoint } = await apiInfoGetModel(
    apiId
  );
  const { projectId, envId } = await projectInfoGetModel(domainName, title);

  let scenarios = await scenarioGetModel(apiId);
  console.log('scenarios in apiRunController: ', scenarios);
  let testData = [];
  for (let i = 0; i < scenarios.length; i++) {
    let exampleArray = [];
    // console.log(scenarios[i].scenario.examples);
    for (let j = 0; j < scenarios[i].scenario.examples.length; j++) {
      exampleArray.push(scenarios[i].scenario.examples[j]);
    }
    testData.push({
      api_id: scenarios[i].scenario.api_id,
      scenario_id: scenarios[i].scenario._id,
      examples: exampleArray,
    });
  }
  // console.log('testData after push: ', testData);

  let testConfig = {
    method: `${httpMethod}`,
    url: `${domainName}${apiEndpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  let httpRequestResult = await callHttpRequest(testConfig, testData);
  // console.log('httpRequestResult in apiRunController: ', httpRequestResult);

  let insertTestResult = await apiResponseInsertModel(
    projectId,
    envId,
    collectionId,
    reportInfo,
    httpRequestResult
  );

  if (!insertTestResult) {
    return res.status(403).json({ message: 'run api test error' });
  }
  return res.status(200).json({ message: 'api test response inserted' });
};

const collectionRunController = async (req, res) => {
  const collectionId = req.body.collectionId;
  const domainName = req.body.domainName;
  const title = req.body.title;
  const reportInfo = req.body.report_info;
  // console.log('domainName, title: ', domainName, title);

  let apiArray = await apiGetModel(collectionId);
  let apiInfoArray = [];
  for (let i = 0; i < apiArray.length; i++) {
    let temp = await apiInfoGetModel(apiArray[i].api._id);
    temp.api_id = apiArray[i].api._id;
    apiInfoArray.push(temp);
  }
  // console.log('apiInfoArray in collectionRunController: ', apiInfoArray);

  const { projectId, envId } = await projectInfoGetModel(domainName, title);
  // console.log('projectId, envId: ', projectId, envId);

  // TODO: deal with different httpmethod and api endpoint
  let httpRequestResult = [];

  for (let l = 0; l < apiInfoArray.length; l++) {
    let testConfig = {
      method: `${apiInfoArray[l].httpMethod}`,
      url: `${domainName}${apiInfoArray[l].apiEndpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    let scenarios = [];
    let temp = await scenarioGetModel(apiInfoArray[l].api_id);
    for (let k = 0; k < temp.length; k++) {
      scenarios.push(temp[k]);
    }

    let testData = [];
    for (let i = 0; i < scenarios.length; i++) {
      let exampleArray = [];
      // console.log(scenarios[i].scenario.examples);
      for (let j = 0; j < scenarios[i].scenario.examples.length; j++) {
        exampleArray.push(scenarios[i].scenario.examples[j]);
      }
      testData.push({
        api_id: scenarios[i].scenario.api_id,
        scenario_id: scenarios[i].scenario._id,
        examples: exampleArray,
      });
    }

    let apiRequestResult = await callHttpRequest(testConfig, testData);
    for (let m = 0; m < apiRequestResult.length; m++) {
      httpRequestResult.push(apiRequestResult[m]);
    }
  }
  // console.log(
  //   'httpRequestResult in collectionRunController: ',
  //   httpRequestResult
  // );

  let insertTestResult = await collectionResponseInsertModel(
    projectId,
    envId,
    collectionId,
    reportInfo,
    httpRequestResult
  );

  if (!insertTestResult) {
    return res.status(403).json({ message: 'run collection test error' });
  }
  return res.status(200).json({ message: 'collection test response inserted' });
};

const displayAllReport = async (req, res) => {
  const projectId = req.query.projectid;
  let projectName = await projectNameGetModel(projectId);
  let reportData = await getReportModel(projectId);
  let reportCalculated = await calculateReport(reportData);
  // console.log('reportCalculated: ', reportCalculated);
  for (let i = 0; i < reportCalculated.length; i++) {
    reportCalculated[i].projectName = projectName;
  }

  if (reportCalculated.length !== 0) {
    res.render('reports', { reportsDetail: reportCalculated });
  } else {
    reportCalculated.push({ project_name: projectName });
    res.render('reports', { reportsDetail: reportCalculated });
  }
};

const getExampleReport = async (req, res) => {
  const projectId = req.body.projectId;
  const envId = req.body.envId;

  let testCaseReport = await getReportModel(projectId);
  // console.log('testCaseReport: ', testCaseReport.toString());
  if (testCaseReport.toString()) {
    res.status(200).json({ report_id: testCaseReport.toString() });
  } else {
    res.status(403).json({ msg: 'no report found' });
  }
};

const getReportResponseController = async (req, res) => {
  // const apiId = req.query.apiid;

  // let { collectionId } = await apiInfoGetModel(apiId);
  // let projectId = await collectionInfoGetModel(collectionId);
  // let envInfo = await envInfoGetModel(projectId);

  // const projectId = req.query.projectid;

  // let projectName = await projectNameGetModel(projectId);
  // let reportData = await getReportModel(projectId);
  // let reportCalculated = await calculateReport(reportData);
  // // console.log('reportCalculated: ', reportCalculated);
  // for (let i = 0; i < reportCalculated.length; i++) {
  //   reportCalculated[i].projectName = projectName;
  // }
  // console.log('req.query.reportid: ', req.query.reportid);
  const reportId = req.query.reportid;
  let reportResponse = await getReportResponseModel(reportId);
  // let reportCalculated = await calculateReport(reportResponse);
  console.log('reportResponse: ', reportResponse);
  // console.log('reportCalculated: ', reportCalculated);
  if (reportResponse) {
    res.render('reportdetail', {
      reportResponse: reportResponse,
      // reportCalculated: reportCalculated,
    });
  } else {
    reportResponse.push({ msg: 'no report found' });
    res.render('reportdetail', {
      reportResponse: reportResponse,
      // reportCalculated: reportCalculated,
    });
  }
};

module.exports = {
  scenarioRunController,
  apiRunController,
  collectionRunController,
  displayAllReport,
  getExampleReport,
  getReportResponseController,
};
