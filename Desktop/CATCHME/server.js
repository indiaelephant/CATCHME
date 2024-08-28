require('dotenv').config(); // 환경 변수 설정 ->모든파일에서 환경변수 사용가능.
const express = require('express');
const session = require('express-session'); // 로그인 시 세션 필요
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 세션 미들웨어 설정
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // HTTPS 사용 시 true로 설정
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7일 동안 세션 유지
    }
}));

const connectToDatabase = require('./config/dbConnect'); // 데이터베이스 연결 함수 불러오기
const { requireLogin } = require('./controllers/authController');
connectToDatabase(); // MongoDB 연결

app.listen(8080, function() {
    console.log('listening on 8080');
});

app.use('/', require('./routes/authRoutes')); // '/'경로로 들어오는 곳에 대해서 라우트디렉 아래 파일을 모두 실행
app.use('/', require('./routes/emailRoutes'));
app.use('/', require('./routes/userRoutes'));

// 로그인 상태 확인 엔드포인트 ->프론트화면 동적으로 생성하기 위해.
app.get('/login-status', (req, res) => {
    if (req.session.userId) {
      res.json({ loggedIn: true });
    } else {
      res.json({ loggedIn: false });
    }
  });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/home.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/views/register.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/login.html');
});
app.get('/login/reissuepass', (req, res) => {
    res.sendFile(__dirname + '/views/reissuePass.html');
});

app.get('/memberinfo',requireLogin, (req, res) => {
    res.sendFile(__dirname + '/views/memberInfo.html');
});

app.get('/memberinfo/more',requireLogin,(req,res)=>{
    res.sendFile(__dirname + '/views/memberInfoMore.html');
});

app.get('/memberinfo/more/setting',requireLogin, (req, res) => {
    res.sendFile(__dirname + '/views/memberInfoMoreSetting.html');
});

app.get('/memberinfo/more/setting/update',requireLogin, (req, res) => {
    res.sendFile(__dirname + '/views/memberUpdate.html');
});

app.get('/memberinfo/more/setting/updatepassword',requireLogin, (req, res) => {
    res.sendFile(__dirname + '/views/updatePassword.html');
});

app.get('/memberinfo/more/setting/memberdelete',requireLogin, (req, res) => {
    res.sendFile(__dirname + '/views/memberDelete.html');
});