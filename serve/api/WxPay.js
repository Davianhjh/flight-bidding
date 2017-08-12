/**
 * Created by hujinhua on 17-7-26.
 */
var crypto = require("crypto");
var request  = require("request");

function getNonceStr(){
    return Math.random().toString(36).substr(2,18);
}

function MD5Sign(signStr){
    var sign = crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
    return sign;
}

function WxPay(opt) {
    opt = opt || {};
    if (!(this instanceof WxPay)) {
        return new WxPay(opt);
    }
    this._opt = {};
    for (var key in opt) {
        if(key!=='key')
            this._opt[key] = opt[key];
        else this._key = opt[key];
    }
}

WxPay.prototype._merge = function (object, source) {
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

WxPay.prototype._sign = function (key, args) {
    args = this._merge(this._opt, args);
    args.nonce_str = getNonceStr();
    this._noncestr = args.nonce_str;
    var arr = Object.keys(args).sort();
    console.log(args);

    var tmpStr = arr.map(function (key) {
        if (typeof args[key] === 'object'){
            args[key] = JSON.stringify(args[key]);
        }
        return key + '=' + args[key];
    }).join('&');
    var signStr = tmpStr + '&key=' + this._key;
    console.log(signStr);
    var signature = MD5Sign(signStr);
    console.log(signature);
    return signature;
};

WxPay.prototype._request = function (args, callback) {
    this._opt.sign = this._sign(this._key, args);
    var formdata = "<xml>";
    formdata += "<appid>" + this._opt.appid + "</appid>";
    formdata += "<attach>" + this._opt.attach + "</attach>";
    formdata += "<body>" + this._opt.body + "</body>";
    formdata += "<mch_id>" + this._opt.mch_id + "</mch_id>";
    formdata += "<nonce_str>" + this._opt.nonce_str + "</nonce_str>";
    formdata += "<notify_url>" + this._opt.notify_url + "</notify_url>";
    formdata += "<out_trade_no>" + args.out_trade_no + "</out_trade_no>";
    formdata += "<spbill_create_ip>" + args.spbill_create_ip + "</spbill_create_ip>";
    formdata += "<total_fee>" + args.total_fee + "</total_fee>";
    formdata += "<trade_type>" + this._opt.trade_type + "</trade_type>";
    formdata += "<sign>" + this._opt.sign + "</sign>";
    formdata += "</xml>";

    console.log(formdata);
    request({
        url: "https://api.mch.weixin.qq.com/pay/unifiedorder",
        method: "POST",
        body: formdata
    },function (err, httpResponse, body) {
        if (err) {
            return callback && callback.call(this, err);
        }
        callback && callback.call(this, err, body);
    });
};

WxPay.prototype.requestPay = function (args, callback) {
    args = args || {};
    this._request(args, callback);
};

WxPay.prototype.WXsign = function (args) {
    args = args || {};
    var return_data = {
        sign: this._sign(this._key, args),
        noncestr: this._noncestr
    };
    return return_data
};
exports = module.exports = WxPay;