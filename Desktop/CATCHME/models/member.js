const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^[가-힣]+$/.test(v); // 한글만 허용
            },
            message: props => `${props.value}는 한글만 입력 가능합니다.`
        }
    },
    email: {
        type: String,
        required: function() {
            return !this.kakaoId; // 카카오 로그인이 없을 때만 이메일 필수
        },
        unique: true
    },
    password: {
        type: String,
        required: function() {
            return !this.kakaoId; // 카카오 로그인이 없을 때만 비밀번호 필수
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^010\d{8}$/.test(v); // 010으로 시작하고 뒤에 8자리 숫자인지 확인
            },
            message: props => `${props.value}는 유효한 핸드폰 번호가 아닙니다.`
        }
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
        required: true
    },
    kakaoId: {
        type: String,
        unique: true, // 각 사용자는 고유한 카카오 ID를 가집니다.
        sparse: true // 이 필드는 비어 있을 수 있습니다.
    },
    kakaoAccessToken: {
        type: String
    },
    kakaoRefreshToken: {
        type: String
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
