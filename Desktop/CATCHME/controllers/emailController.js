//이메일 인증코드 전송 및 검증
const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler'); //verifiedEmail에 email저장위해
const authController = require('./authController');
const User = require('../models/member'); // User 모델 불러오기

let verificationCodes = {};

exports.sendVerificationCode = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const requestType = req.body.type; // 'register' or 'passwordReset'
    // 이메일이 이미 데이터베이스에 존재하는지 확인
    const user = await User.findOne({ email });
    if (requestType === 'register') {
        // 회원가입일 경우
        if (user) {
            return res.status(400).send('이미 가입된 이메일입니다.');
        }
    } else if (requestType === 'passwordReset') {
        // 비밀번호 재발급일 경우
        if (!user) {
            return res.status(400).send('존재하지 않는 이메일입니다.');
        }
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000);//인증코드 난수생성
    console.log(verificationCode);
    verificationCodes[email] = verificationCode;//이메일을 키로 verificationCode저장하기

    const transporter = nodemailer.createTransport({
        host: 'smtp.naver.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.NAVER_USER,
            pass: process.env.NAVER_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: process.env.NAVER_USER,
        to: email,
        subject: '인증 코드',
        text: `인증 코드는 ${verificationCode} 입니다.`
    };

    transporter.sendMail(mailOptions, (error, info) => {//SMTP로 이메일 전송
        if (error) {
            res.status(500).send('이메일 전송 실패: ' + error.message);
        } else {
            res.send('인증 코드가 이메일로 전송되었습니다.');
        }
    });
});

exports.verifyCode = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const code = req.body.code;

    if (verificationCodes[email] && (verificationCodes[email] == code)) {
        delete verificationCodes[email]; //메모리에서 지우기
        authController.verifyEmail(email); //verifiedEmail셋에 email저장
        res.send('인증이 완료되었습니다.');
    } else {
        res.status(400).send('인증 코드가 올바르지 않습니다.');
    }
});
