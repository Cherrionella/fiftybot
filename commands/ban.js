var util = require('util'),
    _ = require('underscore'),
    config = require('../config');

var Command = {
    type: 'FUNC',
    command: 'voteban',
    delay: 0,
    textRequired: true,
    config: {
        banRights: ['broadcaster', 'subscriber'],
        maxPoints: 2,
        banTime: 3600,
        protectBanTime: 120,
        textTargetProtected: '%s, отдохни-ка, братишка',
        textTargetSelf: '%s назвал себя пидорахой, смотрите!',
        textTarget: 'Пошла инфа, что %s - пидор. Нужно больше инфы, чтобы я его забанил.',
        textSuccess: 'Похоже инфа верная, %s и правда пидор. Ебал его мамашу.',
        textAlreadyBanned: '%s уже запидорен'
    },
    aliases: ['pidor'],

    initialize: function() {
        var self = this;
        //Auto add bot to protected list
        this.addProtected(config.irc.username.toLowerCase());

        this.client.addListener('subscription', function(channel, username) {
            self.addProtected(username);
        });
    },

    addProtected: function(username) {
        var self = this;
        this.storage.findOne('ban','protected', {name: username.toLowerCase()}, function(doc) {
            if(!doc)
                self.storage.insert('ban','protected', {name: username.toLowerCase()});
        });
    },

    doBan: function(target, text, time) {
        time = time || this.config.protectBanTime;
        if(time == -1)
            this.ban(target);
        else
            this.timeout(target, time);
        return util.format(text, target);
    },

    changePoints: function(data, points) {
        data.points = data.points + points;
        data.banTill = Date.now() + this.config.banTime;
        this.storage.insertOrUpdate('ban', 'marked', data);
        if(data.points >= this.config.maxPoints) {
            return this.doBan.call(this, data.name, this.config.textSuccess, this.config.banTime);
        } else
            return util.format(this.config.textTarget, data.name);
    },

    f: function (from, text, cb) {
        if(!_.some(this.config.banRights, function(right) { return ~from.special.indexOf(right) }))
            return false;
        from = from.username.toLowerCase();
        text = text.toLowerCase();
        var self = this;
        if(text == from) {
            cb(util.format(this.config.textTargetSelf, from));
            return false;
        }
        this.storage.findOne('ban', 'protected', {name: text}, function(data) {
            if(data) {
                //Found protected user
                var doc = {
                    name: from,
                    points: self.config.maxPoints,
                    banTill: Date.now() + self.config.protectBanTime * 1000,
                    votes: [from]
                };
                self.storage.insertOrUpdate('ban', 'marked', doc);
                cb(self.doBan.call(self, from, self.config.textTargetProtected));
            } else {
                self.storage.findOne('ban', 'marked', {name: text}, function (data) {
                    data = data || {
                        name: text,
                        points: 0,
                        banTill: Date.now(),
                        votes: []
                    };
                    if(data.banTill <= Date.now() && data.points >= self.config.maxPoints) {
                        data.points = 0;
                        data.votes = [];
                    }
                    if (data.points < self.config.maxPoints) {
                        var stop = false;
                        data.votes.forEach(function (val) {
                            if (val == from)
                                stop = true;
                        });
                        if(!stop) {
                            data.votes.push(from);
                            cb(self.changePoints(data, 1));
                        }
                    } else
                        cb(util.format(self.config.textAlreadyBanned, text));
                });
            }
        });
    }
};

module.exports = Command;