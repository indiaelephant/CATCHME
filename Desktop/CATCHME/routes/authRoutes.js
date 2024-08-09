const express = require('express');
const { register, login, logout, requireLogin, updatePassword, deleteUser, forgotPassword} = require('../controllers/authController');
const router = express.Router();

router.route('/register').post(register); //회원가입post
router.route('/login').post(login);//로그인 post
router.route('/logout').get(requireLogin, logout); //로그인 검사후 로그아웃
router.route('/memberinfo/updatepassword').post(requireLogin, updatePassword);//로그인 검사후 패시워드 업데이트
router.route('/memberdelete').delete(requireLogin, deleteUser); //로그인 검사후 회원탈퇴
router.route('/forgot-password').post(forgotPassword);

module.exports = router;
