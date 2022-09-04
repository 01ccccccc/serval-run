const router = require('express').Router();

const { saveCase } = require('../controllers/testcase_controller');
const { createCase } = require('../controllers/createcase_controller');
const { showResult } = require('../controllers/showresult_controller');
const { wrapAsync } = require('../util/util');

router.route('/apitest').get(wrapAsync(createCase));
router.route('/addcase').post(wrapAsync(saveCase));
router.route('/testresult').get(wrapAsync(showResult));

module.exports = router;
