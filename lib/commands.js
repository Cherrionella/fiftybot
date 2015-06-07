var _ = require('underscore'),
    irc = require('twitch-irc'),
    readline = require('readline'),
    storage = require('./storage'),
    config = require('../config');

if(typeof String.prototype.startsWith === 'undefined') {
    String.prototype.startsWith = function (needle) {
        return (this.indexOf(needle) == 0);
    };
}

var Commands = function(user, password, channel, globalCommandPrefix) {
    var self = this;
    this.globalCommandPrefix = globalCommandPrefix || '!';
    this.storage = new storage('./run/database.db');
    this.status = 0;
    this.middleware = {};
    this.aliases = {};
    this.channel = channel;
    this.client = new irc.client({
        options: {
            checkUpdates: false,
            debug: false,
            debugIgnore: ['ping', 'chat', 'action'],
            logging: false,
            tc: 3
        },
        identity: {
            username: user,
            password: password
        },
        channels: [channel]
    });
    this.client.addListener('error', function(message) {
        console.log('error: ', message);
    });
    this.client.addListener('connected', function() {
        self.status = 1;
        console.log('Registered to IRC');
        self.client.join('#'+channel + ' ' + password, function() {
            console.log('Joined #' + channel);
            self.status = 1;
        });
    });
    this.client.addListener('chat', function (channel, user, text) {
        var command = self.findSuitableCommand(text);
        if(command) {
            self.runCommand(command, user, text.split(' ').slice(1, text.split(' ').length).join(' '));
        }
        console.log(user.username + ' => ' + channel + ': ' + text);
    });

    this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    this.rl.on('line', function(cmd){
        var splitted = cmd.split(' '),
            command = splitted[0].split('.'),
            func = '';
        if(self.middleware[command[0]]) {
            func = command[1] || 'f';
            if(func == 'f') {
                self.runCommand(command[0], {}, splitted[1], 'cli', func);
            } else if(func == 'config') {
                if(splitted.length == 3) {
                    self.middleware[command[0]].config[splitted[1]] = splitted[2];
                    console.log('Set config: ' + command[0] + '.' + splitted[1] + ' = ' + splitted[2]);
                } else
                    console.log('Wrong params count');
            } else {
                var args = splitted.slice(1, splitted.length);
                self.middleware[command[0]][func].apply(_.extend({}, self, self.middleware[command[0]]), args);
            }
        } else
            console.log('Command does not exist');
    });

    this.client.connect();
};

_.extend(Commands.prototype, {
    say: function(to, text) {
        if (arguments.length == 1) {
            text = to;
            to = null;
        }

        if (to)
            text = '@' + to + ' ' + text;

        this.client.say('#'+this.channel, text);
    },
    timeout: function(user, time) {
        time = time || 300;
        if(!user)
            return;
        this.say('.timeout ' + user + ' '+ time);
    },
    ban: function(user) {
        if(!user)
            return;
        this.say('.ban ' + user);
    },
    unban: function(user) {
        if(!user)
            return;
        this.say('.unban ' + user);
    },
    clear: function() {
        this.say('.clear');
    },
    loadCommand: function(jsName) {
        var self = this;
        var middleware = {};
        if(typeof jsName == 'string') {
            var modulePath = '../commands/' + jsName;// path.join('.', 'commands', jsName);
            middleware = require(modulePath);
        } else if(typeof jsName == 'object') {
            middleware = jsName;
        }
        if(middleware instanceof Array) {
            middleware.forEach(function(middle) {
                self.loadCommand(middle);
            });
        } else {
            middleware.delay = middleware.delay || 0;
            middleware.runTime = 0;
            if(config.commands[middleware.command]) {
                middleware.config = _.defaults(config.commands[middleware.command], middleware.config);
            }
            this.middleware[middleware.command] = middleware;
            this.aliases[middleware.command] = middleware.command;
            if(this.middleware[middleware.command].aliases instanceof Array) {
                this.middleware[middleware.command].aliases.forEach(function(alias) {
                    self.aliases[alias] = middleware.command;
                });
            }
            if(typeof this.middleware[middleware.command].initialize == 'function') {
                this.middleware[middleware.command].initialize.call(_.extend({}, this, this.middleware[middleware.command]));
            }
            console.log('Loaded command `' + middleware.command + '`');
        }
    },
    findSuitableCommand: function(text) {
        if(this.globalCommandPrefix.length > 0) {
            if(text.startsWith(this.globalCommandPrefix))
                text = text.substr(this.globalCommandPrefix.length, text.length - this.globalCommandPrefix.length);
            else
                return false;
        }
        var cmd = text.split(' ')[0];
        return (this.aliases[cmd]) ? this.aliases[cmd] : false;
    },
    runCommand: function(command, from, text, caller) {
        caller = caller || 'chat';
        if(caller == 'cli')
            from = {
                username: config.irc.username.toLowerCase()
            };
        var self = this;
        if(this.middleware[command] && this.status == 1) {
            if(this.middleware[command].runTime <= (Date.now() - this.middleware[command].delay) || caller == 'cli') {
                this.middleware[command].runTime = Date.now();
                if(this.middleware[command].textRequired && !text)
                    return false;
                if(this.middleware[command].isCli && caller !== 'cli')
                    return false;
                switch (this.middleware[command].type) {
                    case 'TEXT':
                        this.say(this.middleware[command].text);
                        break;
                    case 'FUNC':
                        this.middleware[command].f.call(_.extend({}, this, this.middleware[command]), from, text, function (result) {
                            if (result)
                                self.say(result);
                        });
                        break;
                    default:
                        console.log('Unknown command type. Command `' + command + '`');
                        break;
                }
            }
        }
    }
});

module.exports = Commands;