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

var repositoryVue = {
    template: template,
    created: function() {
        this.displayLabels = false;
        this.$data.issues = [];
        this.fetchIssues();
        this.$watch('issues', this.drawCubes);
        this.$on('toggle-labels', function () {
            this.displayLabels = !this.displayLabels;
            this.drawCubes();
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
        drawCubes: function() {
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
                var color = red;
                z = Math.floor(i/9);
                var issue = this.$data.issues[i];
                if (issue.pull_request) {
                    color = green;
                }
                else if (this.displayLabels === true && _.isArray(issue.labels) && issue.labels.length > 0) {
                    color = this.computeLabelColor(issue.labels[0]);
                }
                var placement = availablePlacements[i % 9];
                this.drawSingleCube(placement[0], placement[1], z, color);
            }
        },
        drawSingleCube: function(x, y, z, color) {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            return isomer.add(Prism(new Point(x*1.15, y*1.15, z*1.15)).scale(Point.ORIGIN, 0.5, 0.5, 0.5), color);
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
        }
    }
};

module.exports = repositoryVue;
