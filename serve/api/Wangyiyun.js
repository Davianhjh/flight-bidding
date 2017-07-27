/**
 * Created by hujinhua on 17-7-27.
 */
var crypto = require("crypto");
var request  = require("request");

function getSignatureNonce(){
    return Math.random().toString(36).substr(2,18);
}

function getTimeStamp() {
    var time = new Date;

    return (Date.parse(time)/1000);
}

function getHeader(option, checksum) {
    return {
        'Content-Type': 'application/x-www-form-urlencoded',
        'AppKey': option.AppKey,
        'CurTime': option.CurTime.toString(),
        'Nonce': option.Nonce,
        'CheckSum': checksum,
        'char-set': 'utf-8'
    }
}

function Wangyiyun(opt) {
    opt = opt || {};
    if (!(this instanceof Wangyiyun)) {
        return new Wangyiyun(opt);
    }
    this._opt = {};
    // Params needed to be configured
    // AppKey :
    // AppSecret :
    for (var key in opt) {
        this._opt[key] = opt[key];
    }
    console.log(this._opt.AppKey);
    console.log(this._opt.AppSecret);
}

Wangyiyun.prototype._merge = function (object, source) {
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

Wangyiyun.prototype._sign = function () {
    this._opt.CurTime = getTimeStamp();
    this._opt.Nonce = getSignatureNonce();

    console.log(this._opt.Nonce);
    console.log(this._opt.CurTime.toString());

    var signStr = this._opt.AppSecret + this._opt.Nonce + this._opt.CurTime.toString();
    console.log("signStr: " + signStr);
    var sign = crypto.createHash('sha1').update(signStr).digest().toString('hex');
    console.log("sign: " + sign);
    return sign;
};

Wangyiyun.prototype._request = function (args, callback) {
    var header = getHeader(this._opt, this._sign());
    var form = 'templateid='+args.templateid+'&mobiles=["'+args.mobiles+'"]&params=["'+args.name+'","'+args.flight+'","'+args.price+'"]';
    console.log("form: " + form);
    var option = {
        method: 'POST',
        uri: 'https://api.netease.im/sms/sendtemplate.action',
        headers: header,
        body: form
    };
    console.log(option);
    request.post(option, function (err, httpResponse, body) {
        if (err) {
            return callback && callback.call(this, err);
        }
        callback && callback.call(this, err, body);
    });
};

Wangyiyun.prototype.text = function (args, callback) {
    args = args || {};
    this._request(args, callback);
};

exports = module.exports = Wangyiyun;