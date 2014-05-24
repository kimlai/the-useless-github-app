var cookie = require('cookie');
var request = require('superagent');
var _ = require('underscore');

var token = cookie('token');

var Repository = function (data) {

    _.extend(this, data);
    this.issues = [];
    this.pullRequests = [];

    this.fetchIssues = function () {
        var _this = this;
        request
            .get('https://api.github.com/repos/' + this.full_name + '/issues?per_page=150')
            .set('Accept', 'application/vnd.github.v3+json')
            .set('Authorization', 'token ' + token)
            .end(function (res) {
                _this.issues = res.body.reverse();
            });
    };

    this.fetchPullRequests = function () {
        var _this = this;
        request
            .get('https://api.github.com/repos/' + this.full_name + '/pulls?per_page=150')
            .set('Accept', 'application/vnd.github.v3+json')
            .set('Authorization', 'token ' + token)
            .end(function (res) {
                var pullRequests = res.body.reverse();
                _.each(pullRequests, function (pullRequest) {
                    var totalBuildTime = 0;
                    var succesfulBuildsCount = 0;
                    request
                        .get(pullRequest._links.statuses.href)
                        .set('Accept', 'application/vnd.github.v3+json')
                        .set('Authorization', 'token ' + token)
                        .end(function (res) {
                            pullRequest.status = _.first(res.body);
                            if (pullRequest.status && pullRequest.status.state === 'success') {
                                succesfulBuildsCount++;
                                totalBuildTime += _this.computeBuildTime(res.body);
                                _this.averageBuildTime = totalBuildTime / succesfulBuildsCount;
                            }
                        });
                });
                _this.pullRequests = pullRequests;
            });
    };

    this.computeBuildTime = function (statuses) {
        for (var i=0; i < statuses.length; i++) {
            var status = statuses[i];
            if (status.state === 'success') {
                return new Date(status.created_at) - new Date(statuses[i+1].created_at);
            }
        }
    };
};

module.exports = Repository;
