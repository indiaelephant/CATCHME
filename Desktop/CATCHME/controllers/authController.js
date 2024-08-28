//인증관련 로직(로그인,회원가입,로그아웃,비밀번호 수정,회원탈퇴)
const bcrypt = require('bcrypt'); //패스워드 암호화
const crypto = require('crypto'); //임시 비밀번호 생성위함
const asyncHandler = require('express-async-handler'); //비동기 함수 오류 처리하기 위해 사용된다.
const User = require('../models/member');

const verifiedEmails = new Set(); //인증된 이메일 저장 셋

exports.register = asyncHandler(async (req, res) => {
    try {
        const email = req.body.email;

        if (!verifiedEmails.has(email)) { // 이메일 인증이 완료되지 않았을 때
            return res.status(400).send('이메일 인증이 완료되지 않았습니다.');
        }

        // 핸드폰 번호 중복 체크
        const existingUser = await User.findOne({ phoneNumber: req.body.phoneNumber });
        if (existingUser) {
            return res.status(400).send('이미 사용 중인 핸드폰번호입니다.');
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10); // 패스워드 암호화
        const user = new User({
            username: req.body.username,
            email: email,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber,
            gender: req.body.gender // 성별 필드 추가
        });

        await user.save(); // DB에 사용자 저장
        verifiedEmails.delete(email); // 인증된 이메일 세트에서 이메일 제거
        res.redirect("/"); // 홈 화면으로 리다이렉트

    } catch (error) {
        console.error('User registration error:', error); // 서버 콘솔에 오류 로그 기록
        res.status(500).send('사용자 등록 중 오류가 발생했습니다.'); // 클라이언트에게 오류 응답 전송
    }
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

exports.reissuePassword = asyncHandler(async (req, res) => {
    try {
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
    } catch (error) {
        res.status(500).json({ error: '비밀번호 재발급 중 오류가 발생했습니다.', details: error.message });
    }
});

exports.updatePassword = asyncHandler(async (req, res) => {
    try {
        const { old_password, password } = req.body;
        const user = await User.findById(req.session.userId); // DB 조회

        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }

        // 기존 비밀번호가 일치하는지 확인
        if (!(await bcrypt.compare(old_password, user.password))) {
            return res.status(400).send('기존 비밀번호가 일치하지 않습니다.');
        }

        // 새 비밀번호 암호화 및 저장
        user.password = await bcrypt.hash(password, 10);
        await user.save();

        res.send('비밀번호를 성공적으로 저장하였습니다.');
    } catch (error) {
        res.status(500).send('서버 오류가 발생했습니다. 다시 시도해 주세요.');
    }
});

exports.deleteUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.session.userId); // DB에서 사용자 삭제

        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }

        req.session.destroy((err) => { // 회원 탈퇴 후 세션 파괴하여 로그아웃 처리
            if (err) {
                return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
            }
            res.status(200).send('회원 탈퇴가 완료되었습니다.');
        });
    } catch (error) {
        res.status(500).send('회원 탈퇴 중 오류가 발생했습니다.');
    }
});

exports.verifyEmail = (email) => { //verifiedEmails에 저장위해 파일밖에서 사용
    verifiedEmails.add(email);
};

exports.isEmailVerified = (email) => { //밖에서도 사용하기 위해
    return verifiedEmails.has(email);
};