require('dotenv').config(); // 환경 변수 설정
const express = require('express');
const session = require('express-session'); // 로그인 시 세션 필요
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); // 임시 비밀번호 생성용

const mongoose = require('mongoose');
const User = require('./models/member');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let verificationCodes = {};
let verifiedEmails = new Set();

// 세션 미들웨어 설정
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // HTTPS 사용 시 true로 설정
}));

//DB연결함수
async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

connectToDatabase(); // MongoDB 연결

app.listen(8080, function() {
    console.log('listening on 8080');
});

// 세션 확인 미들웨어
function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).send('로그인이 필요합니다.');
    }
    next();
}

// 홈
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

// 회원가입 get
app.get('/join', function(req, res) {
    res.sendFile(__dirname + '/views/join.html');
});

// 이메일 전송
app.post('/send-verification-code', function(req, res) {
    const email = req.body.email;
    const verificationCode = Math.floor(100000 + Math.random() * 900000); // 6자리 인증 코드 생성
    console.log(verificationCode);
    verificationCodes[email] = verificationCode;

    console.log(`Sending verification code ${verificationCode} to email ${email}`); // 디버그 로그

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

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.error('Error:', error);
            res.status(500).send('이메일 전송 실패: ' + error.message);
        } else {
            console.log('Email sent: ' + info.response);
            res.send('인증 코드가 이메일로 전송되었습니다.');
        }
    });
});

// 인증코드 검증
app.post('/verify-code', function(req, res) {
    const email = req.body.email;
    const code = req.body.code;

    console.log(`Verifying code ${code} for email ${email}`);

    if (verificationCodes[email] && (verificationCodes[email] == code)) {
        delete verificationCodes[email];
        verifiedEmails.add(email);
        res.send('인증이 완료되었습니다.');
    } else {
        res.status(400).send('인증 코드가 올바르지 않습니다.');
    }
});

// 회원가입 post
app.post('/register', async function(req, res) {
    console.log('POST /register request received');
    const email = req.body.email;

    if (!verifiedEmails.has(email)) {
        return res.status(400).send('이메일 인증이 완료되지 않았습니다.');
    }

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log('Password hashed');

        const user = new User({
            username: req.body.username,
            email: email,
            password: hashedPassword,
            phoneNumber: req.body.phoneNumber
        });

        await user.save();
        console.log('User saved to the database');

        verifiedEmails.delete(email);

        res.redirect("/");

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('회원가입 중 오류가 발생했습니다.');
    }
});

// 로그인 get
app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/views/login.html');
});

// 로그인 post
app.post('/login', async function(req, res){
    console.log('POST /login request received');
    console.log('Request body:', req.body); // 요청 본문 로그 추가
    const { email, password } = req.body; // 사용자 입력 추출
    try {
        const user = await User.findOne({email});
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.status(401).send('아이디 혹은 비밀번호가 잘못되었습니다.');
        }

        const match = await bcrypt.compare(password, user.password); // 비밀번호 확인
        if (!match) {
            return res.status(401).send('아이디 혹은 비밀번호가 잘못되었습니다.');
        }

        req.session.userId = user._id; // 세션에 사용자 ID 저장
        console.log('User logged in successfully');
        
        res.send('로그인 성공');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('로그인 중 오류가 발생했습니다.');
    }
});

// 로그인 상태 확인 엔드포인트
app.get('/login-status', (req, res) => {
    if (req.session.userId) {
      res.json({ loggedIn: true });
    } else {
      res.json({ loggedIn: false });
    }
  });

//비밀번호 발급 get
app.get('/forgot-password',async function(req,res){
    res.sendFile(__dirname+'/views/reissuePass.html');
});

// 비밀번호 발급 post
app.post('/forgot-password', async function(req, res) {
    console.log('POST /forgot-password request received');
    const email = req.body.email;

    if (!verifiedEmails.has(email)) {
        return res.status(400).send('이메일 인증이 완료되지 않았습니다.');
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found for email: ${email}`);
            return res.status(401).send('존재하지 않는 계정입니다.');
        }

        const temporaryPassword = crypto.randomBytes(3).toString('hex'); // 6자리 임시 비밀번호
        console.log(`Temporary password generated: ${temporaryPassword}`);

        // 비밀번호 암호화 추가 (예: bcrypt 사용)
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);
        user.password = hashedPassword;

        await user.save();
        console.log(`Temporary password saved for user: ${email}`);

        res.json({ temporaryPassword: temporaryPassword }); // JSON 형식으로 응답

        verifiedEmails.delete(email);

    } catch (error) {
        console.error('Error during password reissue:', error);
        res.status(500).send('비밀번호 재발급 중 오류가 발생했습니다.');
    }
});

// 로그아웃 라우트
app.get('/logout', requireLogin,(req, res) => {
    req.session.destroy(err => { //세션 종료.
      if (err) {
        return res.status(500).send('로그아웃 중 오류가 발생했습니다.');
      }
      res.redirect('/');
      console.log('logout successfully');
    });
  });

//사용자 데이터 보기 -> 족압 데이터+사용자 정보 + 비밀번호 변경 페이지입니다
app.get('/memberinfo', requireLogin, function(req, res){
    console.log('사용자 족압 데이터 보기');
    res.sendFile(__dirname + '/views/memberInfo.html');
});

// 개인정보 수정 페이지 ->사용자 정보 수정 페이지. : 이건 전체 html틀을 보여줌. 아래 파일이 html내용을 채워넣음.
app.get('/memberinfo/memberupdate', requireLogin, async function(req, res){
    console.log('개인정보수정');
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
        res.sendFile(__dirname + '/views/memberUpdate.html');
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('서버 오류');
    }
});


// 사용자 정보 제공 -> 이게 필요한 이유는 사용자 정보 수정페이지에서 기존의 값들을 불러오기 위함임. 사용자에게 자신의 정보를 보여줌.
app.get('/userinfo', requireLogin, async function(req, res) {
    try {
        const user = await User.findById(req.session.userId).select('username email phoneNumber');
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('서버 오류');
    }
});

// 사용자 정보 업데이트 -> 사용자가 수정한 내용을 받아와서 DB에 저장함.
app.patch('/userinfo', requireLogin, async function(req, res) {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }

        // 이름과 전화번호만 업데이트
        user.username = req.body.username;
        user.phoneNumber = req.body.phoneNumber;

        await user.save();
        res.send('정보가 성공적으로 수정되었습니다.');
    } catch (error) {
        console.error('Error updating user data:', error);
        res.status(500).send('서버 오류');
    }
});

//비밀번호 변경하기 페이지get
app.get('/memberinfo/updatepassword',requireLogin,async function(req,res){
    res.sendFile(__dirname + '/views/updatePassword.html');
});

// 비밀번호 변경하기 페이지 POST
app.post('/memberinfo/updatepassword', requireLogin, async function (req, res) {
    const { old_password, password } = req.body;

    try {
        const user = await User.findById(req.session.userId); // 로그인된 사용자 ID로 사용자 검색

        // 기존 비밀번호가 일치하는지 확인
        const isMatch = await bcrypt.compare(old_password, user.password);

        if (!isMatch) {
            return res.status(400).send('기존 비밀번호가 일치하지 않습니다.');
        }

        // 새 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 데이터베이스에 새 비밀번호 저장
        user.password = hashedPassword;
        await user.save();
        res.redirect('/'); // 홈 화면으로 리디렉션
        
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send('비밀번호 변경 중 오류가 발생했습니다.');
    }
});


//회원 탈퇴 버튼 클릭시
app.get('/memberdelete',requireLogin,async function (req,res) {
    console.log('회원탈퇴');
    res.sendFile(__dirname+'/views/memberDelete.html');
})

//회원 DB에서 삭제하기
app.delete('/memberdelete', requireLogin, async function(req, res) {
    try {
        const user = await User.findByIdAndDelete(req.session.userId); //찾고 삭제함.
        if (!user) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }

        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('로그아웃 중 오류가 발생했습니다.'); //삭제한후 로그아웃 필요.
            }
            res.status(200).send('회원 탈퇴가 완료되었습니다.');
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('회원 탈퇴 중 오류가 발생했습니다.');
    }
});

