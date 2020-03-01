let router = require('koa-router')();
let User = require('./../models/user');
const utils = require('./../utils/utils');

/* GET users listing. */
router.get('/', function(ctx) {
    ctx.body = 'respond with a resource';
});

router.post("/login", async function(ctx) {
    let param = {
        userName: ctx.request.body.userName,
        userPwd: ctx.request.body.userPwd
    }
    let doc = await User.findOne(param);
    if (doc) {
        ctx.cookies.set("userId", doc.userId, {
            path: '/',
            maxAge: 1000 * 60 * 60
        });
        ctx.cookies.set("userName", doc.userName, {
            path: '/',
            maxAge: 1000 * 60 * 60
        });
        //req.session.user = doc;
        ctx.body = utils.handleSuc({ userName: doc.userName });
    } else {
        ctx.body = utils.handleFail('账号密码错误')
    }
});

//登出接口
router.post("/logout", function(ctx) {
    ctx.cookies.set("userId", "", {
        path: "/",
        maxAge: -1
    });
    ctx.cookies.set("userName", "", {
        path: "/",
        maxAge: -1
    });
    ctx.body = utils.handleSuc();
});

router.get("/checkLogin", function(ctx) {
    const cookies = ctx.cookies;
    if (cookies.get('userId')) {
        ctx.body = utils.handleSuc(cookies.get('userName') || '');
    } else {
        ctx.body = utils.handleFail('未登录', 10008);
    }
});

router.get("/getCartCount", async function(ctx) {
    const userId = ctx.cookies.get('userId');
    if (userId) {
        let doc = await User.findOne({ userId: userId });
        if (doc) {
            let cartList = doc.cartList;
            let cartCount = 0;
            cartList.map(function(item) {
                cartCount += parseInt(item.productNum);
            })
            ctx.body = utils.handleSuc(cartCount);
        } else {
            ctx.body = utils.handleFail('当前用户不存在');
        }
    }
});

//查询当前用户的购物车数据
router.get("/cartList", async function(ctx) {
    let userId = ctx.cookies.get('userId');
    let doc = await User.findOne({ userId: userId });
    if (doc) {
        ctx.body = utils.handleSuc(doc.cartList);
    } else {
        ctx.body = utils.handleFail('未找到购物车数据');
    }
});

//购物车删除
router.post("/cartDel", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        productId = ctx.request.body.productId;
    let res = await User.update({
        userId: userId
    }, {
        $pull: {
            'cartList': {
                'productId': productId
            }
        }
    });
    //nModified更新条数
    //{'ok':1,'nModified':1}
    if (res.nModified > 0) {
        ctx.body = utils.handleSuc();
    } else {
        ctx.body = utils.handleFail('删除失败');
    }
});

//修改商品数量
router.post("/cartEdit", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        productId = ctx.request.body.productId,
        productNum = ctx.request.body.productNum,
        checked = ctx.request.body.checked;
    let doc = await User.update({ "userId": userId, "cartList.productId": productId }, {
        "cartList.$.productNum": productNum,
        "cartList.$.checked": checked,
    });
    if (doc.nModified > 0) {
        ctx.body = utils.handleSuc();
    } else {
        ctx.body = utils.handleFail('修改失败');
    }
});

router.post("/editCheckAll", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        checkAll = ctx.request.body.checkAll ? '1' : '0';
    let user = await User.findOne({ userId: userId });
    if (user) {
        user.cartList.forEach((item) => {
            item.checked = checkAll;
        })
        let doc = await user.save();
        if (doc) {
            ctx.body = utils.handleSuc();
        } else {
            ctx.body = utils.handleFail('error');
        }
    } else {
        ctx.body = utils.handleFail('error');
    }
});
//查询用户地址接口
router.get("/addressList", async function(ctx) {
    let userId = ctx.cookies.get('userId');
    let doc = await User.findOne({ userId: userId });
    if (doc) {
        ctx.body = utils.handleSuc(doc.addressList);
    } else {
        ctx.body = utils.handleFail('获取地址列表失败');
    }
});
//设置默认地址接口
router.post("/setDefault", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        addressId = ctx.request.body.addressId;
    if (!addressId) {
        ctx.body = utils.handleFail('addressId is null', 1003);
    } else {
        let doc = await User.findOne({ userId: userId });
        if (doc) {
            let addressList = doc.addressList;
            addressList.forEach((item) => {
                if (item.addressId == addressId) {
                    item.isDefault = true;
                } else {
                    item.isDefault = false;
                }
            });

            let doc1 = doc.save();
            if (doc1) {
                ctx.body = utils.handleSuc();
            } else {
                ctx.body = utils.handleFail('设置失败');
            }
        } else {
            ctx.body = utils.handleFail('设置失败');
        }
    }
});

//删除地址接口
router.post("/delAddress", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        addressId = ctx.request.body.addressId;
    let doc = await User.update({
        userId: userId
    }, {
        $pull: {
            'addressList': {
                'addressId': addressId
            }
        }
    });
    if (doc.nModified > 0) {
        ctx.body = utils.handleSuc();
    } else {
        ctx.body = utils.handleFail('地址删除失败');
    }
});

router.post("/payMent", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        addressId = ctx.request.body.addressId,
        orderTotal = ctx.request.body.orderTotal;
    let doc = await User.findOne({ userId: userId });
    if (doc) {
        let address = '',
            goodsList = [];
        //获取当前用户的地址信息
        doc.addressList.forEach((item) => {
            if (addressId == item.addressId) {
                address = item;
            }
        });
        //获取用户购物车的购买商品
        doc.cartList.filter(async(item) => {
            if (item.checked == '1') {
                await goodsList.push(item);
            }
        });

        let platform = '622';
        let r1 = Math.floor(Math.random() * 10);
        let r2 = Math.floor(Math.random() * 10);

        Date.prototype.Format = function(fmt) { // author: meizz
            var o = {
                "M+": this.getMonth() + 1, // 月份
                "d+": this.getDate(), // 日
                "h+": this.getHours(), // 小时
                "m+": this.getMinutes(), // 分
                "s+": this.getSeconds(), // 秒
                "q+": Math.floor((this.getMonth() + 3) / 3), // 季度
                "S": this.getMilliseconds() // 毫秒
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
                if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }

        let sysDate = new Date().Format('yyyy-MM-dd');
        let createDate = new Date().Format('yyyy-MM-dd hh:mm:ss');
        let orderId = platform + r1 + sysDate + r2;
        let order = {
            orderId: orderId,
            orderTotal: orderTotal,
            addressInfo: address,
            goodsList: goodsList,
            orderStatus: '1',
            createDate: createDate
        };

        await doc.orderList.push(order);

        let doc1 = await doc.save();
        if (doc1) {
            ctx.body = utils.handleSuc({
                orderId: order.orderId,
                orderTotal: order.orderTotal
            });
        } else {
            ctx.body = utils.handleFail('error');
        }
    } else {
        ctx.body = utils.handleFail('付款失败');
    }
});
//根据订单Id查询订单信息
router.get("/orderDetail", async function(ctx) {
    let userId = ctx.cookies.get('userId'),
        orderId = ctx.request.query.orderId;
    let userInfo = await User.findOne({ userId: userId });
    if (userInfo) {
        let orderList = userInfo.orderList;
        if (orderList.length > 0) {
            let orderTotal = 0;
            orderList.forEach((item) => {
                if (item.orderId == orderId) {
                    orderTotal = item.orderTotal;
                }
            });
            if (orderTotal > 0) {
                ctx.body = utils.handleSuc({
                    orderId: orderId,
                    orderTotal: orderTotal
                });
            } else {
                ctx.body = ctx.handleFail('无此订单', 120002);
            }
        } else {
            ctx.body = ctx.handleFail('当前用户未创建订单', 120001);
        }
    } else {
        ctx.body = utils.handleFail('获取用户信息失败');
    }
});
module.exports = router;