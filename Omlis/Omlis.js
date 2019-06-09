function Omlis(userid, password) {
  this.userid = userid;
  this.password = password;
  this.cookies = "";
};
// https://web.oml.city.osaka.lg.jp/webopac/nontopmnu.do メニュー
Omlis.URL.LOGIN = "https://web.oml.city.osaka.lg.jp/webopac/nonidf.do?cmd=login&next=mopmnu";
Omlis.URL.LOGOUT = "https://web.oml.city.osaka.lg.jp/webopac/nonoff.do?mode=logout&display=nonlogin";
Omlis.URL.USAGE_SITUATION = "https://web.oml.city.osaka.lg.jp/webopac/nonasklst.do";
Omlis.URL.RENTING_BOOKLIST = "https://web.oml.city.osaka.lg.jp/webopac/nonlenlst.do";
Omlis.URL.RESERVING_BOOKLIST = "https://web.oml.city.osaka.lg.jp/webopac/nonrsvlst.do";

Omlis.prototype.login = function () {
  var response = UrlFetchApp.fetch(
    Omlis.URL.LOGIN,
    {
      method: "post",
      followRedirects: false,
      contentType: "application/x-www-form-urlencoded",
      payload: {
        userid: this.userid,
        password: this.password
      }
    }
  );
  console.log(response.getContentText());
  this.cookies = this.getCookies(response);
  return response;
}
Omlis.prototype.logout = function () {
  this.moveSite(OMLIS.URL.LOGOUT);
};
Omlis.prototype.getRentingBooks = function () {
  var response = this.moveSite(Omlis.URL.RENTING_BOOKLIST);
  var booklist = this.parseContentBookList(response);
  return booklist;
}
Omlis.prototype.getReservingBooks = function () {
  var response = this.moveSite(Omlis.URL.RESERVING_BOOKLIST);
  var booklist = this.parseContentBookList(response);
  return booklist;

}
Omlis.prototype.moveSite = function (url) {
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    followRedirects: false,
    headers: {
      Cookie: this.cookies.join(';')
    }
  });
  return response;
}

Omlis.prototype.getCookies = function (response) {
  // レスポンスヘッダーからcookieを取得
  var headers = response.getAllHeaders();
  var cookies = [];
  if (typeof headers['Set-Cookie'] !== 'undefined') {
    // Set-Cookieヘッダーが2つ以上の場合はheaders['Set-Cookie']の中身は配列
    var cookies = typeof headers['Set-Cookie'] == 'string' ? [headers['Set-Cookie']] : headers['Set-Cookie'];
    for (var i = 0; i < cookies.length; i++) {
      // Set-Cookieヘッダーからname=valueだけ取り出し、セミコロン以降の属性は除外する
      cookies[i] = cookies[i].split(';')[0];
    };
  }
  return cookies;
}

Omlis.prototype.parseContentBookList = function (response) {
  var content = response.getContentText()
    .replace(/\s/g, "")
    .replace(/&nbsp;/g, "")
    .replace(/<\/?b>/g, "");
  var result = content.match(/<strong>([^<]+)<\/strong>：([^<]*)<br\/>/g);
  if (result == null) {
    return [];
  };
  var item_name_first = "";
  var first = true;
  var books = [];
  var bookitem = {};
  var bookcount = 0;
  for (var i = 0; i < result.length; ++i) {
    var result2 = result[i].match(/<strong>([^<]+)<\/strong>：([^<]*)<br\/>/);
    var item_name = result2[1];
    var item_value = result2[2];

    if (first) {
      // 最初に見つかった項目の名前を覚えておく
      item_name_first = item_name;
      first = false;
    }
    if (item_name === item_name_first) {
      bookitem = {};
      books[bookcount] = bookitem;
      bookcount += 1;
    }
    bookitem[item_name] = item_value;
  }
  return books;
}

// 利用イメージ
// var omlis = new Omlis("ゆーざーめい", "ぱすわーど");
// try {
//   omlis.login();
//   var rentingBooks = omlis.getRentingBooks();
//   var reservingBooks = omlis.getReservingBooks();
//   omlis.logout()
// } catch (error) {
//   console.log(error);
// }
