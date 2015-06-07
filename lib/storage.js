var datastore = require('nedb'),
    _ = require('underscore');

var Storage = function(filename) {
    this._data = new datastore({filename: filename, autoload: true});
};

_.extend(Storage.prototype, {
    find: function(collection, type, param, cb) {
        if(Array.prototype.splice.call(arguments).length == 3) {
            cb = param;
            param = type;
            type = null;
        }
        if(!_.isFunction(cb))
            cb = _.noop;
        var doc = {};
        if(type)
            _.extend(doc, {collection: collection, type: type}, param);
        else
            _.extend(doc, {collection: collection}, param);
        this._data.find(doc, function(err, data) {
            if(err)
                console.log(err);
            else
                cb(data);
        });
    },
    findOne: function(collection, type, param, cb) {
        if(Array.prototype.splice.call(arguments).length == 3) {
            cb = param;
            param = type;
            type = null;
        }
        if(!_.isFunction(cb))
            cb = _.noop;
        var doc = {};
        if(type)
            _.extend(doc, {collection: collection, type: type}, param);
        else
            _.extend(doc, {collection: collection}, param);
        this._data.findOne(doc, function(err, data) {
            if(err)
                console.log(err);
            else
                cb(data);
        });
    },
    update: function(id, doc, cb) {
        if(!_.isFunction(cb))
            cb = _.noop;
        delete doc._id;
        this._data.update({_id: id}, doc, {}, function(err) {
            if(err)
                console.log(err);
            cb(err);
        });
    },
    insert: function(collection, type, doc, cb) {
        if(Array.prototype.splice.call(arguments).length == 3) {
            cb = doc;
            doc = type;
            type = null;
        }
        if(!_.isFunction(cb))
            cb = _.noop;
        if(type)
            _.extend(doc, {collection: collection, type: type});
        else
            _.extend(doc, {collection: collection});
        this._data.insert(doc, function(err) {
            if(err)
                console.log(err);
            cb(err);
        });
    },
    insertOrUpdate: function(collection, type, doc, cb) {
        if(Array.prototype.splice.call(arguments).length == 3) {
            cb = doc;
            doc = type;
            type = null;
        }
        if(!_.isFunction(cb))
            cb = _.noop;
        if(type)
            _.extend(doc, {collection: collection, type: type});
        else
            _.extend(doc, {collection: collection});
        if(doc._id)
            this.update(doc._id, doc, cb);
        else
            this.insert(collection, type, doc, cb);
    },
    count: function(q, cb) {
        if(!_.isFunction(cb))
            cb = _.noop;
        this._data.count(q, function(err, data) {
            if(err)
                console.log(err);
            cb(data);
        });
    },
    remove: function(q, cb) {
        if(!_.isFunction(cb))
            cb = _.noop;
        this._data.remove(q, {multi: true}, function(err, numRemoved) {
            if(err)
                console.log(err);
            cb(numRemoved);
        });
    },
    flushCollection: function(collection, cb) {
        if(!_.isFunction(cb))
            cb = _.noop;
        this.remove({collection: collection}, cb);
    }
});

module.exports = Storage;