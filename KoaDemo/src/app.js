/**
 * Koa2重写惹事商城后台
 * kun
 * 2020-07-04
 */
const Koa = require('koa');
const Router = require('koa-router');
const Logger = require('koa-logger');
const Json = require('koa-json');
const static = require('koa-static');
const views = require('koa-views');
const bodyparser = require('koa-bodyparser');

//创建Koa实例
const app = new Koa();
//创建路由实例 并添加路由前缀
const router = new Router({
    prefix: '/api'
})

//#region 自定义日志中间件
// // logger
// app.use(async(ctx, next) => {
//     await next();
//     const rt = ctx.response.get('X-Response-Time');
//     console.log(`${ctx.method} ${ctx.url} - ${rt}`);
// });

// // x-response-time
// app.use(async(ctx, next) => {
//     const start = Date.now();
//     await next();
//     const ms = Date.now() - start;
//     ctx.set('X-Response-Time', `${ms}ms`);
// });
//#endregion

//#region  注册中间件
//注册日志中间件
app.use(Logger());

//注册Json格式化中间件
app.use(Json());
//注册静态服务中间件
app.use(static(__dirname + '/public/stylesheets'));
//注册页面模板引擎中间件
app.use(views(__dirname + '/views'), {
    extension: 'ejs'
});
//应用于Post请求
app.use(bodyparser());

//设置路由
router.get('/test', async(ctx) => {
    ctx.body = 'Get /api/get';
});
router.get('/html', async(ctx) => {
    await ctx.render('index.ejs', {
        name: 'Koa-Views Ejs'
    });
});

//注册路由中间件
app.use(router.routes());

// response
app.use(async ctx => {
    ctx.body = 'Hello World';
});
//#endregion

//错误拦截
app.on('error', (err, ctx) => {
    console.error('server error', err);
})

app.listen(3000);