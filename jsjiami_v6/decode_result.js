var _0x14069f = function () {
  var _0x396fbe = !![];
  return function (_0x4dacae, _0x835b99) {
    var _0x13b885 = _0x396fbe ? function () {
      if (_0x835b99) {
        var _0x4e11fe = _0x835b99["apply"](_0x4dacae, arguments);
        _0x835b99 = null;
        return _0x4e11fe;
      }
    } : function () {};
    _0x396fbe = ![];
    return _0x13b885;
  };
}();
(function () {
  _0x14069f(this, function () {
    var _0x6137e9 = new RegExp("function *\\( *\\)");
    var _0x1f1238 = new RegExp('\x5c+\x5c+\x20*(?:(?:[a-z0-9A-Z_]){1,8}|(?:\x5cb|\x5cd)[a-z0-9_]{1,8}(?:\x5cb|\x5cd))', 'i');
    var _0x2c46b4 = _0x484082('init');
    if (!_0x6137e9["test"](_0x2c46b4 + 'chain') || !_0x1f1238["test"](_0x2c46b4 + "input")) {
      _0x2c46b4('0');
    } else {
      _0x484082();
    }
  })();
})();
var _0x2426fb = function () {
  var _0x376e0e = !![];
  return function (_0x56a24b, _0x5f561f) {
    var _0x46d96f = _0x376e0e ? function () {
      if (_0x5f561f) {
        var _0x4a0bde = _0x5f561f['apply'](_0x56a24b, arguments);
        _0x5f561f = null;
        return _0x4a0bde;
      }
    } : function () {};
    _0x376e0e = ![];
    return _0x46d96f;
  };
}();
var _0xa1145c = _0x2426fb(this, function () {
  var _0x55dcfc = function () {};
  var _0x3b9a8d = typeof window !== "undefined" ? window : typeof process === "object" && typeof require === "function" && typeof global === "object" ? global : this;
  if (!_0x3b9a8d["console"]) {
    _0x3b9a8d["console"] = function (_0x55dcfc) {
      var _0x303bb6 = {};
      _0x303bb6["log"] = _0x55dcfc;
      _0x303bb6["warn"] = _0x55dcfc;
      _0x303bb6["debug"] = _0x55dcfc;
      _0x303bb6['info'] = _0x55dcfc;
      _0x303bb6["error"] = _0x55dcfc;
      _0x303bb6['exception'] = _0x55dcfc;
      _0x303bb6['trace'] = _0x55dcfc;
      return _0x303bb6;
    }(_0x55dcfc);
  } else {
    _0x3b9a8d["console"]["log"] = _0x55dcfc;
    _0x3b9a8d["console"]['warn'] = _0x55dcfc;
    _0x3b9a8d['console']["debug"] = _0x55dcfc;
    _0x3b9a8d["console"]["info"] = _0x55dcfc;
    _0x3b9a8d["console"]["error"] = _0x55dcfc;
    _0x3b9a8d["console"]["exception"] = _0x55dcfc;
    _0x3b9a8d["console"]['trace'] = _0x55dcfc;
  }
});
_0xa1145c();
function getUrl(_0x2d7af2) {
  var _0x1ad9c8 = new RegExp("(^|&)" + _0x2d7af2 + "=([^&]*)(&|$)");
  var _0x45a67c = window["location"]["search"]["substr"](0x1)["match"](_0x1ad9c8);
  if (_0x45a67c != null) return _0x45a67c[0x2];
  return null;
}
function getUrlDecode(_0x3264b2) {
  var _0x438377 = Base64['decode'](getUrl("nmpa"));
  var _0x59e70f = new RegExp('(^|&)' + _0x3264b2 + "=([^&]*)(&|$)");
  var _0x511814 = _0x438377['match'](_0x59e70f);
  if (_0x511814 != null) return _0x511814[0x2];
  return null;
}
function setCookie(_0x31a103, _0x19c2af, _0xeccfde) {
  if (!_0xeccfde) _0xeccfde = 0x2710;
  var _0x578f02 = new Date();
  _0x578f02["setTime"](_0x578f02["getTime"]() + _0xeccfde * 0x18 * 0x3c * 0x3c * 0x3e8);
  var _0x25b1d4 = "expires=" + _0x578f02['toGMTString']();
  document["cookie"] = _0x31a103 + '=' + _0x19c2af + ';\x20' + _0x25b1d4;
}
function setCookieAuto(_0xc11d0e, _0x4d3289) {
  document["cookie"] = _0xc11d0e + '=' + _0x4d3289 + ";path=/";
}
function getCookie(_0x4ff938) {
  var _0x4da56d = _0x4ff938 + '=';
  var _0x511999 = document["cookie"]["split"](';');
  for (var _0x5c82cd = 0x0; _0x5c82cd < _0x511999['length']; _0x5c82cd++) {
    var _0x282514 = _0x511999[_0x5c82cd]['trim']();
    if (_0x282514["indexOf"](_0x4da56d) == 0x0) {
      return _0x282514['substring'](_0x4da56d['length'], _0x282514['length']);
    }
  }
  return '';
}
function clearCookie(_0x49ff8d) {
  var _0x2d7ada = new Date();
  _0x2d7ada["setTime"](_0x2d7ada["getTime"]() - 0x1);
  var _0x38d56b = getCookie(_0x49ff8d);
  if (_0x38d56b != null) {
    console["log"](document["cookie"]);
    document["cookie"] = _0x49ff8d + '=' + _0x38d56b + ";expires=" + _0x2d7ada['toGMTString']();
    console["log"](document['cookie']);
  }
}
function getHashName(_0x3fb761) {
  var _0x527428 = new RegExp("(^|&)" + _0x3fb761 + "=([^&]*)(&|$)");
  var _0x3578fd = window["location"]["hash"]["substr"](0x1)["match"](_0x527428);
  if (_0x3578fd != null) return _0x3578fd[0x2];
  return null;
}
function _0x484082(_0x401537) {
  function _0x2f1cc9(_0x110c8a) {
    if (typeof _0x110c8a === "string") {
      var _0x2fab6a = function () {
        (function (_0x5e084c) {
          return function (_0x5e084c) {
            return Function("Function(arguments[0]+\"" + _0x5e084c + "\")()");
          }(_0x5e084c);
        })("bugger")('de');
      };
      return _0x2fab6a();
    } else {
      if (('' + _0x110c8a / _0x110c8a)["length"] !== 0x1 || _0x110c8a % 0x14 === 0x0) {
        (function (_0x60ef7c) {
          return function (_0x60ef7c) {
            return Function("Function(arguments[0]+\"" + _0x60ef7c + '\x22)()');
          }(_0x60ef7c);
        })("bugger")('de');
        ;
      } else {
        (function (_0x111b40) {
          return function (_0x111b40) {
            return Function('Function(arguments[0]+\x22' + _0x111b40 + '\x22)()');
          }(_0x111b40);
        })("bugger")('de');
        ;
      }
    }
    _0x2f1cc9(++_0x110c8a);
  }
  try {
    if (_0x401537) {
      return _0x2f1cc9;
    } else {
      _0x2f1cc9(0x0);
    }
  } catch (_0x3574b9) {}
}
window["setInterval"](function () {
  var _0x525946 = "jsj" + "iam";
  if (typeof _0xods == "undefi" + "ned" || _0xods != _0x525946 + 'i.com.v' + _0x525946["length"]) {
    var _0x470caf = [];
    while (_0x470caf["length"] > -0x1) {
      _0x470caf["push"](_0x470caf["length"] ^ 0x2);
    }
  }
  (function (_0x2a24ea) {
    return _0x2a24ea();
  })(_0x484082);
}, 0x7d0);
;
_0xods = 'jsjiami.com.v6';