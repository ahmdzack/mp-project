const express = require('express');
const router = express.Router();
const { getAllFacilities } = require('../controllers/facilityController');

router.get('/', getAllFacilities);

module.exports = router;