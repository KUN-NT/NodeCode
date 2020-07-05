/**
 * 公共方法
 */
module.exports = {
    //成功
    handleSuc(result = '', msg = '操作成功') {
        return {
            status: 0,
            msg,
            result
        }
    },
    //失败
    handleFail(msg = '操作失败', status = 10001) {
        return {
            status,
            msg,
            result: ''
        }
    }
}