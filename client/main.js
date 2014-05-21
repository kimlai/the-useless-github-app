var Vue = require('vue');
var cookie = require('cookie');
var request = require('superagent');
var store = require('store');
var _ = require('underscore');
var repositoryVue = require('repository-vue');

var token = cookie('token');

Vue.component('repository-vue', repositoryVue);

// var repos = store.get('repos') || [];
var repos = [];

var reposView = new Vue({
    el: '#repository-list',
    data: {
        repos: repos
    },
    created: function () {
        this.fetchRepos('lrqdo');
    },
    methods: {
        fetchRepos: function (org) {
            var _this = this;
            request
                .get('https://api.github.com/orgs/' + org + '/repos')
                .set('Accept', 'application/vnd.github.v3+json')
                .set('Authorization', 'token ' + token)
                .end(function (res) {
                    _this.repos = _.where(res.body, { has_issues: true }).sort(function (repo) {
                        return -repo.open_issues_count;
                    });
                });
        },
        toggleLabels: function () {
            this.$broadcast('toggle-labels');
        },
        togglePullRequests: function () {
            this.$broadcast('toggle-pull-requests');
        }
    }
});
