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
                    _.each(res.body, function (pullRequest) {
                        request
                            .get(pullRequest._links.statuses.href)
                            .set('Accept', 'application/vnd.github.v3+json')
                            .set('Authorization', 'token ' + token)
                            .end(function (res) {
                                pullRequest.status = _.first(res.body);
                            });
                    });
                    _this.$data.pullRequests = res.body.reverse();
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
                this.drawSingleCube(placement[0], placement[1], z, 0.5, color);
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
                z = Math.floor(i/9);
                var pullRequest = this.$data.pullRequests[i];
                color = this.getPullRequestColor(pullRequest);
                var placement = availablePlacements[i % 9];
                this.drawSingleCube(placement[0], placement[1], z, 1, color);
            }
        },
        drawSingleCube: function(x, y, z, scale, color) {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            isomer.add(Prism(new Point(x*1.15, y*1.15, z*1.15)).scale(Point.ORIGIN, scale, scale, scale), color);
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
                console.log('blanc');
                return  white;
            }
            if (pullRequest.status.state === 'pending') {
                console.log('jaune');
                return yellow;
            }
            if (pullRequest.status.state === 'failure') {
                console.log('rouge');
                return red;
            }
            if (pullRequest.status.state === 'success') {
                console.log('vert');
                return green;
            }

        }
    }
};

module.exports = repositoryVue;
