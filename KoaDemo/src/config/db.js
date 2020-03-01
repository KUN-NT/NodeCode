/**
 * Mongo数据库连接配置
 */
const mongoose = require('mongoose');

module.exports = {
    init: () => {
        //连接数据库
        mongoose.connect('mongodb://kun:kun@119.45.21.130:27017/dumall', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const db = mongoose.connection;

        db.on('error', () => {
            console.log('***数据库连接失败***')
        })
        db.on('open', () => {
            console.log('***数据库连接成功***')
        })
    }
}