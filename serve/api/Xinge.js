/**
 * Created by hujinhua on 17-8-4.
 */
var crypto = require("crypto");
var request  = require("request");

function Xinge(opt) {
    opt = opt || {};
    if (!(this instanceof Xinge)) {
        return new Xinge(opt);
    }
    this._opt = {};
    // Params needed to be configured
    // access_id :
    // secretKey :
    for (var key in opt) {
        this._opt[key] = opt[key];
    }
}

Xinge.prototype._merge = function (object, source) {
    if (object === source) {
        return;
    }
    for (var p in source) {
        if (source.hasOwnProperty(p)) {
            object[p] = source[p];
        }
    }
    return object;
};

Xinge.prototype._sign = function (args) {
    args = this._merge(this._opt, args);
    args.access_id = this._opt.access_id;
    args.timestamp = Date.parse(new Date())/1000;
    var arr = Object.keys(args).sort();
    console.log(args);
    var requestStr = arr.map(function (key) {
        if (key === 'path' || key === 'secretKey'){
            return '';
        }
        else if (typeof args[key] === 'object'){
            args[key] = JSON.stringify(args[key]);
        }
        return key + '=' + args[key];
    }).join('');
    var signStr = 'POSTopenapi.xg.qq.com' + args.path + requestStr + this._opt.secretKey;
    var sign = crypto.createHash('MD5').update(signStr).digest().toString('hex');
    var requestUrl = arr.map(function (key) {
        if (key === 'path' || key === 'secretKey'){
            return '';
        }
        else if (typeof args[key] === 'object'){
            args[key] = JSON.stringify(args[key]);
        }
        return key + '=' + args[key] + '&';
    }).join('');
    var form = requestUrl + "sign=" + sign;
    return form;
};

Xinge.prototype._request = function (args, callback) {
    var form = this._sign(args);
    var options = {
        uri: "http://openapi.xg.qq.com" + args.path,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        },
        body: form
    };
    request.post(options, function (err, httpResponse, body) {
        if (err) {
            return callback && callback.call(this, err);
        }
        callback && callback.call(this, err, body);
    });
};

Xinge.prototype.send = function (args, callback) {
    args = args || {};
    this._request(args, callback);
};

exports = module.exports = Xinge;