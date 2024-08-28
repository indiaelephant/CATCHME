const express = require('express');
const { requireLogin } = require('../controllers/authController');
const { getUserInfo, updateUserInfo } = require('../controllers/userController');
const router = express.Router();

router.route('/userinfo')
    .get(requireLogin, getUserInfo)
    .patch(requireLogin, updateUserInfo);

module.exports = router;
