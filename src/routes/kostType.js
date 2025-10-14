const express = require('express');
const router = express.Router();
const { getAllKostTypes, getKostTypeById } = require('../controllers/kostTypeController');

router.get('/', getAllKostTypes);
router.get('/:id', getKostTypeById);

module.exports = router;