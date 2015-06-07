#!/usr/bin/env node
var fs = require('fs'),
    config = require('../config'),
    commands = require('../lib/commands');

//Totally bad use case
process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
});

var walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        var pFile = file;
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) results = results.concat(walk(file));
        else results.push(pFile)
    });
    return results;
};

var Commands = new commands(config.irc.username, config.irc.password, config.irc.channel, '!');
var commandsList = walk('./commands');
commandsList.forEach(function(js) {
    Commands.loadCommand(js);
});