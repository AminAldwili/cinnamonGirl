window.requestAnimationFrame =
window.__requestAnimationFrame ||
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    (function () {
        return function (callback, element) {
            var lastTime = element.__lastTime;
            if (lastTime === undefined) {
                lastTime = 0;
            }
            var currTime = Date.now();
            var timeToCall = Math.max(1, 33 - (currTime - lastTime));
            window.setTimeout(callback, timeToCall);
            element.__lastTime = currTime + timeToCall;
        };
    })();
window.isDevice =
(/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent
    || navigator.vendor || window.opera)).toLowerCase()));
var loaded = false;
var init = function () {
if (loaded) return;
loaded = true;
var mobile = window.isDevice;
var canvas = document.getElementById('heart');
var ctx = canvas.getContext('2d');
var rand = Math.random;
var width;
var height;
var viewportWidth;
var viewportHeight;

var heartPosition = function (rad) {
    return [Math.pow(Math.sin(rad), 3),
        -(15 * Math.cos(rad) - 5 *
        Math.cos(2 * rad) - 2 *
        Math.cos(3 * rad) - Math.cos(4 * rad))];
};
var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
    return [dx + pos[0] * sx, dy + pos[1] * sy];
};

var buildHeartPoints = function () {
    viewportWidth = window.innerWidth;
    viewportHeight = window.innerHeight;

    var renderScale = mobile ? Math.min(window.devicePixelRatio || 1, 1.25) : 1;
    width = canvas.width = Math.max(320, Math.floor(viewportWidth * renderScale));
    height = canvas.height = Math.max(480, Math.floor(viewportHeight * renderScale));
    canvas.style.width = viewportWidth + 'px';
    canvas.style.height = viewportHeight + 'px';

    ctx.setTransform(width / viewportWidth, 0, 0, height / viewportHeight, 0, 0);
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);

    var compact = mobile || viewportWidth < 700;
    var baseX = compact ? Math.min(viewportWidth * 0.24, 108) : 210;
    var baseY = compact ? Math.min(viewportHeight * 0.014, 7.5) : 13;
    var density = compact ? 0.22 : 0.1;

    pointsOrigin = [];
    for (i = 0; i < Math.PI * 2; i += density) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), baseX, baseY, 0, 0));
    }
    for (i = 0; i < Math.PI * 2; i += density) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), baseX * 0.72, baseY * 0.7, 0, 0));
    }
    for (i = 0; i < Math.PI * 2; i += density) {
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), baseX * 0.44, baseY * 0.4, 0, 0));
    }

    heartPointsCount = pointsOrigin.length;
    traceCount = compact ? 14 : 42;
    targetPoints = new Array(heartPointsCount);
    e = [];

    for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * viewportWidth;
        var y = rand() * viewportHeight;
        e[i] = {
            vx: 0,
            vy: 0,
            speed: compact ? rand() * 0.8 + 2.6 : rand() + 5,
            q: ~~(rand() * heartPointsCount),
            D: 2 * (i % 2) - 1,
            force: compact ? 0.78 + rand() * 0.08 : 0.2 * rand() + 0.7,
            f: compact
                ? 'hsla(347,' + ~~(25 * rand() + 65) + '%,' + ~~(18 * rand() + 58) + '%,.22)'
                : 'hsla(0,' + ~~(40 * rand() + 60) + '%,' + ~~(60 * rand() + 20) + '%,.3)',
            trace: []
        };

        for (var k = 0; k < traceCount; k++) {
            e[i].trace[k] = { x: x, y: y };
        }
    }
}

window.addEventListener('resize', buildHeartPoints);

var traceCount = mobile ? 14 : 42;
var pointsOrigin = [];
var heartPointsCount = 0;
var targetPoints = [];
var e = [];
var i;

var pulse = function (kx, ky) {
    var centerX = viewportWidth / 2;
    var centerY = mobile ? viewportHeight * 0.42 : viewportHeight / 2;
    for (i = 0; i < pointsOrigin.length; i++) {
        targetPoints[i] = [];
        targetPoints[i][0] = kx * pointsOrigin[i][0] + centerX;
        targetPoints[i][1] = ky * pointsOrigin[i][1] + centerY;
    }
};

buildHeartPoints();

var config = {
    traceK: mobile ? 0.22 : 0.4,
    timeDelta: mobile ? 0.006 : 0.01
};

var time = 0;
var loop = function () {
    var n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;
    ctx.fillStyle = mobile ? 'rgba(255, 230, 235, 0.08)' : 'rgba(237, 217, 217, 0.01)';
    ctx.fillRect(0, 0, viewportWidth, viewportHeight);
    for (i = e.length; i--;) {
        var u = e[i];
        var q = targetPoints[u.q];
        var dx = u.trace[0].x - q[0];
        var dy = u.trace[0].y - q[1];
        var length = Math.sqrt(dx * dx + dy * dy) || 1;
        if (10 > length) {
            if (0.95 < rand()) {
                u.q = ~~(rand() * heartPointsCount);
            }
            else {
                if (0.99 < rand()) {
                    u.D *= -1;
                }
                u.q += u.D;
                u.q %= heartPointsCount;
                if (0 > u.q) {
                    u.q += heartPointsCount;
                }
            }
        }
        u.vx += -dx / length * u.speed;
        u.vy += -dy / length * u.speed;
        u.trace[0].x += u.vx;
        u.trace[0].y += u.vy;
        u.vx *= u.force;
        u.vy *= u.force;
        for (var k = 0; k < u.trace.length - 1;) {
            var T = u.trace[k];
            var N = u.trace[++k];
            N.x -= config.traceK * (N.x - T.x);
            N.y -= config.traceK * (N.y - T.y);
        }
        ctx.fillStyle = u.f;
        for (k = 0; k < u.trace.length; k++) {
            ctx.fillRect(u.trace[k].x, u.trace[k].y, 1.2, 1.2);
        }
    }

    window.requestAnimationFrame(loop, canvas);
};
loop();
};

var s = document.readyState;
if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
else document.addEventListener('DOMContentLoaded', init, false);
