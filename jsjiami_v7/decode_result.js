function tipstime(_0x2a4607) {
  $(".timemsg")["text"](_0x2a4607);
  _0x2a4607 == 15 ? ($('.tips')["hide"](), $('.timeout')["show"]()) : "lapWX" === "lapWX" ? (_0x2a4607 += 1, function (_0x409d5a, _0x5d54ef, _0x24daf3) {
    return _0x409d5a(_0x5d54ef, _0x24daf3);
  }(setTimeout, function () {
    tipstime(_0x2a4607);
  }, 1000)) : _0x463343["notice"]("全屏已开启");
}
tipstime(0);
$('#videoPause')['click'](function () {
  window['dp'] != null && ("ZlSup" === "tKrXS" ? _0x3d61da['dp'] != null && (_0x79ceb7['dp']["play"](), _0x3bff06(this)['hide']()) : (window['dp']["play"](), $(this)["hide"]()));
});
function showPauseBtn() {
  $("#videoPause")['show']();
}
function hidePauseBtn() {
  $("#videoPause")["hide"]();
}
function keyen(_0x49fdc1) {
  var _0x3cd950 = CryptoJS['enc']["Utf8"]['parse']("w7t3omcjsoajh1qq"),
    _0x35cc18 = CryptoJS['enc']['Utf8']["parse"](vkey),
    _0x104ba6 = CryptoJS["AES"]["encrypt"](_0x49fdc1, _0x3cd950, {
      'iv': _0x35cc18,
      'mode': CryptoJS["mode"]["CBC"],
      'padding': CryptoJS["pad"]['Pkcs7']
    });
  return _0x104ba6["toString"]();
}
function player() {
  var _0x594657 = navigator["userAgent"]["match"](/iPad|iPhone|Android|Linux|iPod/i) != null;
  $["post"]("/api.php", {
    'url': url,
    'time': time,
    'ua': ua,
    'key': sign(vkey),
    'vkey': keyen(vkey)
  }, function (_0x4217cc) {
    if (_0x4217cc['success'] == '1') {
      vurl = _0x4217cc["url"];
      if (_0x594657) "Satnv" !== "Satnv" ? (_0xb1f773(".timemsg")["text"](_0x97f47b), _0x50fdfe == 15 ? (_0x4b4525('.tips')["hide"](), _0x15e75d(".timeout")["show"]()) : (_0x55a675 += 1, function (_0x4d6133, _0xb5f388, _0xb03cb8) {
        return _0x4d6133(_0xb5f388, _0xb03cb8);
      }(_0x1eb2d4, function () {
        _0x2c81da(_0x3c45b5);
      }, 1000))) : $("#a1")["html"]("<video src=\"" + vurl + "\" controls=\"controls\"  preload=\"preload\" poster=\"https://alyroisvff-1783851359362771-static.oss-cn-zhangjiakou.aliyuncs.com/049edff7-8537-4798-8f3e-4ba0bac86ab5/loading_wap.gif\"  width=\"100%\" height=\"100%\"></video>");else {
        if (_0x4217cc['player'] == "dplayer") {
          window['dp'] = new DPlayer({
            'container': document['getElementById']('a1'),
            'theme': "#ffa631",
            'autoplay': !![],
            'video': {
              'quality': [{
                'name': '蓝光',
                'url': vurl,
                'type': _0x4217cc['type']
              }],
              'defaultQuality': 0,
              'pic': 'https://alyroisvff-1783851359362771-static.oss-cn-zhangjiakou.aliyuncs.com/049edff7-8537-4798-8f3e-4ba0bac86ab5/loading_wap.gif'
            },
            'hlsjsConfig': {
              'p2pConfig': {
                'logLevel': !![],
                'live': ![]
              }
            }
          });
          dp["seek"](function (_0x466879) {
            return window["sessionStorage"]["getItem"](_0x466879);
          }('dpplay' + url));
          (function (_0x4d6133, _0xb5f388, _0xb03cb8) {
            return _0x4d6133(_0xb5f388, _0xb03cb8);
          })(setInterval, function () {
            "DnpRO" === 'DnpRO' ? !dp["paused"] && function (_0x4c2756, _0x57d992) {
              window["sessionStorage"]["setItem"](_0x4c2756, _0x57d992);
            }('dpplay' + url, dp["video"]["currentTime"]) : (_0x3655a9(".tips")["hide"](), _0x492f6a(".timeout")["show"]());
          }, 1000);
          dp['on']("fullscreen", function () {
            dp["notice"]("全屏已开启");
          });
          dp['on']('fullscreen_cancel', function () {
            "edBAD" !== "EJWIq" ? dp["notice"]("全屏已关闭") : (_0x1c7c72('#a1')["html"]('<br><br>' + _0x3e5a27["msg"] + "<br><br><a href=\"javascript:location.reload(); \"class=\"up-file\" >点此刷新</a>"), _0x352f4d("#error")["hide"](), _0x396de7("#loading")["hide"](), _0x45f787('#a1')["show"]());
          });
          dp['on']("ended", function () {
            parent["MacPlayer"]["PlayLinkNext"] != '' && (top['location']["href"] = parent["MacPlayer"]["PlayLinkNext"]);
          });
          document["getElementsByClassName"]('dplayer-full-in-icon')[0]["remove"]();
          window['dp']['on']("pause", showPauseBtn);
          window['dp']['on']('play', hidePauseBtn);
        }
      }
      $("#loading")["hide"]();
      $("#a1")["show"]();
    } else 'vEMLt' !== "SEIjQ" ? ($("#a1")['html']('<br><br>' + _0x4217cc["msg"] + "<br><br><a href=\"javascript:location.reload(); \"class=\"up-file\" >点此刷新</a>"), $("#error")["hide"](), $("#loading")["hide"](), $("#a1")["show"]()) : !_0x3781ec["paused"] && _0x18db19["set"]("dpplay" + _0x17455f, _0xd3c454["video"]["currentTime"]);
  }, "json");
}
player();
var version_ = 'jsjiami.com.v7';