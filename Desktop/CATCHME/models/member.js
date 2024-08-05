const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    account: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
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
    }

});

const User = mongoose.model('User', userSchema);

module.exports = User;
