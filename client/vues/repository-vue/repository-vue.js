var cookie = require('cookie');
var request = require('superagent');
var Isomer = require('isomer');
var template = require('./repository-vue.html');

var token = cookie('token');

var Prism = Isomer.Shape.Prism;
var Point = Isomer.Point;
var red = new Isomer.Color(160, 60, 50);
var green = new Isomer.Color(50, 160, 60);

var repositoryVue = {
    template: template,
    created: function() {
        this.$data.pulls = [];
        this.fetchPullRequests();
        this.$watch('pulls', this.drawCubes);
    },
    methods: {
        fetchPullRequests: function () {
            var _this = this;
            request
                .get('https://api.github.com/repos/' + _this.$data.full_name + '/pulls')
                .set('Accept', 'application/vnd.github.v3+json')
                .set('Authorization', 'token ' + token)
                .end(function (res) {
                    _this.$data.pulls = res.body;
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
            var color = red;
            for (var i=0; i < this.$data.open_issues_count; i++) {
                z = Math.floor(i/9);
                var placement = availablePlacements[i % 9];
                if (i > this.$data.open_issues_count - this.$data.pulls.length) {
                    color = green;
                }
                this.drawSingleCube(placement[0], placement[1], z, color);
            }
        },
        drawSingleCube: function(x, y, z, color) {
            var isomer = new Isomer(this.$el.getElementsByTagName('canvas')[0]);
            isomer.add(Prism(new Point(x*1.15, y*1.15, z*1.15)).scale(Point.ORIGIN, 0.5, 0.5, 0.5), color);
        }
    }
};

module.exports = repositoryVue;
