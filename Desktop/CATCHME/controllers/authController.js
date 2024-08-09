//인증관련 로직(로그인,회원가입,로그아웃,비밀번호 수정,회원탈퇴)
const bcrypt = require('bcrypt'); //패스워드 암호화
const crypto = require('crypto'); //임시 비밀번호 생성위함
const asyncHandler = require('express-async-handler');
const User = require('../models/member');

const verifiedEmails = new Set(); //인증된 이메일 저장 셋

exports.register = asyncHandler(async (req, res) => { //register export
    const email = req.body.email;

    if (!verifiedEmails.has(email)) { //이메일 없으면 에러발생
        return res.status(400).send('이메일 인증이 완료되지 않았습니다.');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);//패스워드 암호화
    const user = new User({
        username: req.body.username,
        email: email,
        password: hashedPassword,
        phoneNumber: req.body.phoneNumber
    });

    await user.save(); //DB저장
    verifiedEmails.delete(email); //셋에서 이메일 지우기
    res.redirect("/"); //홈 화면으로 이동
});

exports.login = asyncHandler(async (req, res) => { //login export
    const { email, password } = req.body; 
    const user = await User.findOne({ email }); //DB에서 조회하기
    if (!user || !(await bcrypt.compare(password, user.password))) { //암호화된 패스워드 비교하기
        return res.status(401).send('아이디 혹은 비밀번호가 잘못되었습니다.');
    }
    req.session.userId = user._id; //세션 id저장하기
    res.send('로그인 성공');
});

exports.logout = asyncHandler((req, res) => { //logout export
    req.session.destroy(err => { //세션 destroy
        if (err) {
            return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
        }
        res.redirect('/'); //홈으로 redirect
    });
});

exports.requireLogin = (req, res, next) => {//미들웨어
    if (!req.session.userId) { //세션id검사
        return res.status(401).send('로그인이 필요합니다.');
    }
    next();
};

exports.updatePassword = asyncHandler(async (req, res) => {//updatePassword export
    const { old_password, password } = req.body;
    const user = await User.findById(req.session.userId); //DB조회
    if (!(await bcrypt.compare(old_password, user.password))) {
        return res.status(400).send('기존 비밀번호가 일치하지 않습니다.');//불일치시 오류
    }
    user.password = await bcrypt.hash(password, 10); //패스워드 암호화
    await user.save(); //DB저장하기
    res.redirect('/');
});

exports.forgotPassword = asyncHandler(async (req, res) => {
    const email = req.body.email;

    if (!verifiedEmails.has(email)) {
        return res.status(400).send('이메일 인증이 완료되지 않았습니다.');
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).send('존재하지 않는 계정입니다.');
    }

    const temporaryPassword = crypto.randomBytes(3).toString('hex'); // 6자리 임시 비밀번호
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
    user.password = hashedPassword;

    await user.save();
    res.json({ temporaryPassword }); // JSON 형식으로 응답
});

exports.deleteUser = asyncHandler(async (req, res) => {//deleteUser export
    const user = await User.findByIdAndDelete(req.session.userId); //DB에서 조회수 삭제
    if (!user) {
        return res.status(404).send('사용자를 찾을 수 없습니다.');
    }
    req.session.destroy(err => { //회원탈퇴후 로그아웃위해 session destroy
        if (err) {
            return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
        }
        res.status(200).send('회원 탈퇴가 완료되었습니다.');
    });
});



exports.verifyEmail = (email) => { //verifiedEmails에 저장위해 파일밖에서 사용
    verifiedEmails.add(email);
};

exports.isEmailVerified = (email) => { //밖에서도 사용하기 위해
    return verifiedEmails.has(email);
};


