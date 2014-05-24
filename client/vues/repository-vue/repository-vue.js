var cookie = require('cookie');
var request = require('superagent');
var Isomer = require('isomer');
var colorParser = require('color-parser');
var Color = require('color');
var _ = require('underscore');
var template = require('./repository-vue.html');

var token = cookie('token');

var Prism = Isomer.Shape.Prism;
var Point = Isomer.Point;
var white = new Isomer.Color(200, 200, 200);
var red = new Isomer.Color(160, 60, 50);
var green = new Isomer.Color(50, 160, 60);
var yellow = new Isomer.Color(250, 200, 30);

var repositoryVue = {
    template: template,
    created: function() {
        this.displayLabels = false;
        this.displayPullRequests = false;
        this.$data.issues = [];
        this.$data.pullRequests = [];
        this.fetchIssues();
        this.fetchPullRequests();
        this.$watch('issues', this.drawIssues);
        this.$on('toggle-labels', function () {
            this.displayLabels = !this.displayLabels;
            this.drawIssues();
        });
        this.$on('toggle-pull-requests', function () {
            this.displayPullRequets = !this.displayPullRequets;
            this.drawPullRequests();
        });
    },
    methods: {
        fetchIssues: function () {
            var _this = this;
            request
                .get('https://api.github.com/repos/' + _this.$data.full_name + '/issues?per_page=150')
                .set('Accept', 'application/vnd.github.v3+json')
                .set('Authorization', 'token ' + token)
                .end(function (res) {
                    _this.$data.issues = res.body.reverse();
                });
        },
        fetchPullRequests: function () {
            var _this = this;
            request
                .get('https://api.github.com/repos/' + _this.$data.full_name + '/pulls?per_page=150')
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
                                    _this.$data.averageBuildTime = totalBuildTime / succesfulBuildsCount;
                                }
                            });
                        _this.drawPullRequests();
                    });
                    _this.$data.pullRequests = pullRequests;
                    var fetch = _.bind(_this.fetchPullRequests, _this);
                    _.delay(fetch, 5000);
                });
        },
        drawIssues: function() {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            isomer.canvas.clear();
            var availablePlacements = [
                [2, 2],
                [1, 2],
                [2, 1],
                [1, 1],
                [0, 2],
                [2, 0],
                [0, 1],
                [1, 0],
                [0, 0],
            ];
            for (var i=0; i < this.$data.issues.length; i++) {
                z = Math.floor(i/9);
                var issue = this.$data.issues[i];
                color = this.getIssueColor(issue);
                var placement = availablePlacements[i % 9];
                this.drawSingleCube(placement[0], placement[1], z, 1, 0.5, color);
            }
        },
        drawPullRequests: function() {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            isomer.canvas.clear();
            var availablePlacements = [
                [2, 2],
                [1, 2],
                [2, 1],
                [1, 1],
                [0, 2],
                [2, 0],
                [0, 1],
                [1, 0],
                [0, 0],
            ];
            for (var i=0; i < this.$data.pullRequests.length; i++) {
                var pullRequest = this.$data.pullRequests[i];
                var z = Math.floor(i/9);
                var height = 1;
                var color = this.getPullRequestColor(pullRequest);
                var placement = availablePlacements[i % 9];
                if (pullRequest.status && pullRequest.status.state === 'pending' && pullRequest.status.description.indexOf('started') !== -1) {
                    var elapsedTime = new Date() - new Date(pullRequest.status.created_at);
                    height = Math.min(elapsedTime / this.$data.averageBuildTime, 1);
                }
                this.drawSingleCube(placement[0], placement[1], z, height, 1, color);
            }
        },
        drawSingleCube: function(x, y, z, height, scale, color) {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            isomer.add(Prism(new Point(x*1.15, y*1.15, z*1.15)).scale(Point.ORIGIN, scale, scale, scale * height), color);
        },
        computeLabelColor: function (label) {
            var rgba = colorParser('#' + label.color);
            rgba = Color.rgba(
                rgba.r,
                rgba.g,
                rgba.b,
                rgba.a
            );
            var hsla = rgba.toHSLA();
            hsla.s -= 40;
            rgba = Color.RGBA.fromHSLA(hsla);
            return new Isomer.Color(
                rgba.r,
                rgba.g,
                rgba.b
            );
        },
        getIssueColor: function (issue) {
            if (issue.pull_request) {
                return  green;
            }
            if (this.displayLabels === true && _.isArray(issue.labels) && issue.labels.length > 0) {
                return  this.computeLabelColor(issue.labels[0]);
            }

            return red;
        },
        getPullRequestColor: function (pullRequest) {
            if (pullRequest.status === undefined) {
                return  white;
            }
            if (pullRequest.status.state === 'pending') {
                return yellow;
            }
            if (pullRequest.status.state === 'failure') {
                return red;
            }
            if (pullRequest.status.state === 'success') {
                return green;
            }

        },
        computeBuildTime: function (statuses) {
            for (var i=0; i < statuses.length; i++) {
                var status = statuses[i];
                if (status.state === 'success') {
                    return new Date(status.created_at) - new Date(statuses[i+1].created_at);
                }
            }
        }
    }
};

module.exports = repositoryVue;
