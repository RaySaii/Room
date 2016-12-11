'use strict';
var config = require('../../server/config.json');
var path = require('path');

module.exports = function (ChatUser) {
    ChatUser.joinroom = function (room_id, user_id, cb) {
        ChatUser.app.models.Room.findById(room_id, function (err, room) {
            ChatUser.findById(user_id, function (err, data) {
                data.joinedrooms.add(room, function (err, res) {
                    cb();
                })
            })
        })
    };
    ChatUser.checkused = function (email_name, cb) {
        ChatUser.findOne({where: {'username': email_name}}, function (err, res) {
                if (res === null) {
                    ChatUser.findOne({where: {'email': email_name}}, function (err, res) {
                        if (res) return cb(null, '邮箱已存在', false);
                        else return cb(null, '可使用', true);
                    });
                }
                else {
                    return cb(null, '用户名已存在', false)
                }
            }
        )
    }
    ChatUser.dologin = function (email_name, password, cb) {
        ChatUser.login({username: email_name, password: password}, function (err, token) {
            if (err) {
                ChatUser.login({email: email_name, password: password}, function (err, token) {
                    cb(err, token);
                })
            } else {
                cb(err, token)
            }
        })
    }
    ChatUser.remoteMethod('checkused', {
        accepts: [
            {arg: 'email_name', type: 'string'}
        ],
        returns: [
            {arg: 'success', type: 'string'},
            {arg: 'useable', type: 'boolean'}
        ],
        http: {path: '/checkused', verb: 'post'}
    })
    ChatUser.remoteMethod('dologin', {
        accepts: [
            {arg: 'email_name', type: 'string'},
            {arg: 'password', type: 'string'}
        ],
        returns: {arg: 'success', type: 'string'},
        http: {path: '/dologin', verb: 'post'}
    })
    ChatUser.remoteMethod('joinroom', {
        accepts: [
            {arg: 'room_id', type: 'string'},
            {arg: 'user_id', type: 'string'}
        ],
        returns: {arg: 'success', type: 'string'},
        http: {path: '/joinroom', verb: 'post'}
    });

    ChatUser.afterRemote('create', function (context, user, next) {
        console.log('> user.afterRemote triggered');

        var options = {
            type: 'email',
            to: user.email,
            from: '309406931@qq.com',
            subject: '邮箱认证',
            template: path.resolve(__dirname, '../../server/views/verify.ejs'),
            title: '感谢你的注册',
            redirect: 'http://localhost:4200/login',
            user: user
        };

        user.verify(options, function (err, response) {
            if (err) {
                ChatUser.deleteById(user.id);
                return next(err);
            }

            console.log('> verification email sent:', response);

        });
    });

    //send password reset link when requested
    ChatUser.on('resetPasswordRequest', function (info) {
        var url = 'http://' + config.host + ':' + config.port + '/reset-password';
        var html = 'Click <a href="' + url + '?access_token=' +
            info.accessToken.id + '">here</a> to reset your password';

        ChatUser.app.models.Email.send({
            to: info.email,
            from: info.email,
            subject: 'Password reset',
            html: html
        }, function (err) {
            if (err) return console.log('> error sending password reset email');
            console.log('> sending password reset email to:', info.email);
        });
    });
}