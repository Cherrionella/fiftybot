var util = require('util');

var Command = {
    type: 'AUTO',
    command: 'subscriber',
    config: {
        textNewSub: 'Приветствуем нового подписчика: %s'
    },
    initialize: function() {
        var self = this;
        this.client.addListener('subscription', function(channel, username) {
            self.say(util.format(Command.config.textNewSub, username));
        });
    }
};

module.exports = Command;