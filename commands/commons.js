var MersenneTwister = require('mersennetwister');

var Commons = [
    {
        type: 'TEXT',
        command: 'report',
        delay: 30000,
        text: 'WHYYYYYYYYYYYYYYY NO BAN ELO BOOST TOTAL NOOB PLS BAN TRASH SUCK FEED TROLL PURPOSE FEED AFK FLAME DOWNER RUIN GAME ON PURPOSE EBAY IMBICLE PLS BAN EXTRA TOXIC'
    },
    {
        type: 'TEXT',
        command: 'playlist',
        delay: 30000,
        text: 'Плейлисты - http://goo.gl/JhfvXk'
    },
    {
        type: 'FUNC',
        command: 'clearchat',
        isCli: true,
        delay: 30000,
        f: function(from, text, cb) {
            this.clear(true);
            cb(null,null);
        }
    },
	{
		type: 'TEXT',
		command: 'elo',
		text: 'http://euw.op.gg/summoner/userName=the+brave+57'
	},
    {
        type: 'FUNC',
        command: 'infa',
        alias: ['инфа'],
        f: function(from, text, cb) {
            var mt = new MersenneTwister(Date.now());
            var chance = Math.round(mt.real()*100);
            cb('Инфа ' + text + ' ' + chance + '%');
        }
    }
];

module.exports = Commons;