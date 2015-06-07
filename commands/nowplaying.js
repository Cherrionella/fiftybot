var fs = require('fs');

var Command = {
    type: 'FUNC',
    command: 'nowplaying',
    delay: 0,
    config: {
        file: ''
    },
    aliases: ['song'],
    f: function(from, text, cb) {
        fs.readFile(this.config.file, 'utf8', function(err, data) {
            if(err)
                console.log(err);
            else
                cb.call(null, data);
        });
    }
};

module.exports = Command;