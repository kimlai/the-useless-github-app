/* jshint esnext:true */
var route = require('koa-route');
var views = require('koa-views');
var request = require('co-request');
var serve = require('koa-static');
var koa = require('koa');
var app = koa();

var clientId = process.env.GITHUB_CLIENT_ID;
var clientSecret = process.env.GITHUB_CLIENT_SECRET;

/* setup views */
app.use(views('views', {
    default: 'jade'
}));

/* define routes */
app.use(route.get('/', index));
app.use(route.get('/connect', connect));
app.use(route.get('/github-callback', callback));

/* serve static files from ../build */
app.use(serve(__dirname + '/../build'));

function *index(next) {
    yield this.render('index');
    var token = this.cookies.get('token');
    if (!token) {
        this.redirect('/connect');
    }
}

function *connect() {
    yield this.render('connect', {
        client_id: clientId,
        scope: 'repo'
    });
}

function *callback(next) {
    yield next;
    var code = this.query.code;
    var result = yield request.post({
        uri: 'https://github.com/login/oauth/access_token',
        json: {
            client_id: clientId,
            client_secret: clientSecret,
            code: code
        }
    });

    this.cookies.set('token', result.body.access_token, { httpOnly: false });
    this.redirect('/');
}

app.listen(process.env.PORT || 3000);
