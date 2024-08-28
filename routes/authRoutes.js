const express = require('express');
const { register, login, logout, requireLogin, updatePassword, deleteUser, reissuePassword} = require('../controllers/authController');
const router = express.Router();

router.route('/register').post(register); //회원가입post
router.route('/login').post(login);//로그인 post
router.route('/login/reissuepass').post(reissuePassword); //비밀번호 재발급시 post로 임시 비번 보낸다.
router.route('/logout').get(requireLogin, logout); //로그인 검사후 로그아웃

router.route('/memberinfo/more/updatepassword').post(requireLogin, updatePassword);//로그인 검사후 패시워드 업데이트
router.route('/memberinfo/more/memberdelete').delete(requireLogin, deleteUser); //로그인 검사후 회원탈퇴
module.exports = router;
