var Vue = require('vue');
var cookie = require('cookie');
var request = require('superagent');
var store = require('store');

var token = cookie('token');

var repos = store.get('repos') || [];

var reposView = new Vue({
    el: '#repository-list',
    data: {
        repos: repos
    }
});

request
    .get('https://api.github.com/orgs/lrqdo/repos')
    .set('Accept', 'application/vnd.github.v3+json')
    .set('Authorization', 'token ' + token)
    .end(function (res) {
        var repos = res.body;
        store.set('repos', repos);
        reposView.repos = repos;
    });
