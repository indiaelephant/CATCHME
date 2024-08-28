const express = require('express');
const { sendVerificationCode, verifyCode } = require('../controllers/emailController');
const router = express.Router();

router.route('/send-verification-code').post(sendVerificationCode);
router.route('/verify-code').post(verifyCode);

module.exports = router;
