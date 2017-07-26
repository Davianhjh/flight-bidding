/**
 * Created by hujinhua on 17-7-24.
 */
var crypto = require("crypto");
var request  = require("request");

function getSignatureNonce(){
    return Math.random().toString(36).substr(2,18);
}

function getTimeStamp() {
    var time = new Date;
    time.setMinutes( time.getMinutes() + time.getTimezoneOffset() ); // 当前时间(分钟) + 时区偏移(分钟)

    var timestamp = time.getFullYear() + "-" +
        ("0" + (time.getMonth() + 1)).slice(-2) + "-" +
        ("0" + time.getDate()).slice(-2) + 'T' +
        ("0" + time.getHours()).slice(-2) + ":" +
        ("0" + time.getMinutes()).slice(-2) + ":" +
        ("0" + time.getSeconds()).slice(-2) + 'Z';

    return timestamp;
}

function AliDaYu(opt) {
    opt = opt || {};
    if (!(this instanceof AliDaYu)) {
        return new AliDaYu(opt);
    }
    this._host = 'http://dysmsapi.aliyuncs.com/';
    this._opt = {};
    this._opt.Action = 'SendSms';
    this._opt.RegionId = 'cn-hangzhou';
    this._opt.Format = 'json';
    this._opt.SignatureMethod = 'HMAC-SHA1';
    this._opt.SignatureVersion= '1.0';
    this._opt.Version = '2017-05-25';
    // Params needed to be configured
    // AccessKeyID :
    // AccessSecret :
    for (var key in opt) {
        if(key !== "AccessSecret")
            this._opt[key] = opt[key];
        else
            this._secret = opt[key];
    }
}

AliDaYu.prototype._merge = function (object, source) {
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

AliDaYu.prototype._sign = function (args) {
    args = this._merge(this._opt, args);
    args.Timestamp = getTimeStamp();
    args.SignatureNonce = getSignatureNonce();
    var arr = Object.keys(args).sort();
    console.log(args);
    var requestStr = arr.map(function (key) {
        if (typeof args[key] === 'object'){
            args[key] = JSON.stringify(args[key]);
        }
        return key + '=' + encodeURIComponent(args[key]);
    }).join('&');
    var signStr = "GET&" + encodeURIComponent('/') + '&' + encodeURIComponent(requestStr);
    var sign = crypto.createHmac('sha1',this._secret + '&').update(signStr).digest().toString('base64');
    //console.log(sign);
    var request_url = this._host + '?Signature=' + encodeURIComponent(sign) + '&' + requestStr;
    //console.log(request_url);
    return request_url;
};

AliDaYu.prototype._request = function (args, callback) {
    this._opt._restUrl = this._sign(args);
    request.get({ url: this._opt._restUrl}, function (err, httpResponse, body) {
        if (err) {
            return callback && callback.call(this, err);
        }
        callback && callback.call(this, err, body);
    });
};

AliDaYu.prototype.sms = function (args, callback) {
    args = args || {};
    this._request(args, callback);
};

exports = module.exports = AliDaYu;