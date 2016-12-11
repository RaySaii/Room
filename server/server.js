'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

app.start = function() {
    // start the web server
    return app.listen(function() {
        app.emit('started');
        var baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            var explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
    if (err) throw err;

    app.use('/ping', function(req, res, next) {
        var request = require('request');
        var cheerio = require('cheerio');
        request('https://segmentfault.com/t/javascript/blogs', function(error, response, body) {
            if (!error && response.statusCode === 200) {
                var $ = cheerio.load(body);
                var length = $('.stream-list__item .summary').length;
                var data = [];
                for (var i = 0; i < length; i++) {
                    data[i] = {
                        title: $('.stream-list__item .summary .title').eq(i).text(),
                        descript: $('.stream-list__item .summary .excerpt.wordbreak.hidden-xs').eq(i).text(),
                        time: $('.stream-list__item .author.list-inline').eq(i).text(),
                        src: 'https://segmentfault.com' + $('.stream-list__item .summary .title a').attr('href')
                    }
                }
                res.json(data);
            }
        })

    });

    // start the server if `$ node server.js`
    if (require.main === module)
        app.io = require('socket.io')(app.start());
    app.io.on('connection', function(socket) {
        console.log('a user connected');
        var rooms = [];
        var i = 0;
        socket.on('info', function(id, name) {
            socket.userId = id;
            socket.username = name
            console.log('info', socket.userId, socket.username);
            app.io.emit('come', socket.userId);
        })
        socket.on('check', function() {
            app.io.emit('check');
        })
        socket.on('myId', function(userId) {
            app.io.emit('myId', userId);
        })
        socket.on('join', function(room) {
                console.log('joining room', room);
                socket.join(room);
                rooms[i++] = room
            })
            // socket.on('to',function (roomId,msg,userId) {
            //     app.io.to(roomId).emit('message',msg,userId)
            // })
        socket.on('message', function(roomId, msg, obj) {
            if (obj) {
                app.io.emit('message', {
                    room: {
                        id: roomId,
                        from: obj.from,
                        to: obj.to
                    },
                    msg: msg
                });
            } else {
                console.log('服务器收到信息并向这个', roomId, '发送信息');
                app.io.to(roomId).emit('message', msg);
            }
        })
        socket.on('disconnect', function() {
            console.log(socket.username, socket.userId);
            app.io.emit('leave', socket.userId);
            // app.models.ChatUser.findById(socket.userId,function (err,res) {
            //     res.online=false;
            //     // console.log(res.online);
            // })
            console.log('user disconnected');
        })
    })
});