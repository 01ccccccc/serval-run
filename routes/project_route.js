const router = require('express').Router();
const { wrapAsync } = require('../util/util');
const {
  displayProject,
  projectInsertController,
  projectDeleteController,
  displayEnvironment,
  envInsertController,
  envDeleteController,
} = require('../controllers/project_cotroller');

router.route('/projects').get(wrapAsync(displayProject));
router.route('/editproject').post(wrapAsync(projectInsertController));
router.route('/editproject').delete(wrapAsync(projectDeleteController));

router.route('/environments').get(wrapAsync(displayEnvironment));
router.route('/editenv').post(wrapAsync(envInsertController));
router.route('/editenv').delete(wrapAsync(envDeleteController));

module.exports = router;
