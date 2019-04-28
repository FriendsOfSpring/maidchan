var _ = Underscore.load();
function doPost(e) {


  //もどってきた
  /*
  e={"parameter":{"token":"vsxgQ4ZnbB9yohryEHy0Y05s",
  "channel_id":"bot_test",
  "text":"@maidchan hello",
  "team_domain":"progress-semi",
  "user_name":"jan"
  }
  };
  */


  //種々の変数
  var body="";
  var bodies=new Array();
  var input_number,index,input;
  var myRegExp;
  var start;


  //機能を表す単語の配列
  var ability_words=["weather","math","route","list",
                     "hello","wiki","taqbin","lanove",
                     "search", "alarm", "task","email",
                     "schedule","fx", "news","anime","moon"];

  //投稿者のメッセージを取得
  var text=e.parameter.text;

  //投稿者の名前を取得
  var username=e.parameter.user_name;

  //channel id,team domain,tokenを取得
  var channelId = e.parameter.channel_id;
  var team_domain=e.parameter.team_domain;
  var token = e.parameter.token;


  //outgoing webhooksのtokenを確認する

  // hoge(Verify_token(team_domain,token));

  if (Verify_token(team_domain,token)!=true) {throw new Error("invalid token.");}

  //どの処理をするかの判定
  for (index=0;index<ability_words.length;index++){
    start=text.indexOf(ability_words[index]);
    if(start!=-1){
      input_number=index;
      //text("@maidchan (ability words) ～")からinput("～")を取り出す
      input=text.slice(start+ability_words[index].length);

    }
  }

  //処理を行う

  body="@"+username+" さま \n "

  switch (input_number){

    case 0:
      body+=weather(input);
      break;
    case 1:
      body+=math(LanguageApp.translate(input, "ja", "en"));
      break;
    case 2:
      body+=root(input);
      break;
    case 3:
      body="ただいまご使用できるコマンドは、以下の通りです。 \n"
      for (var n in ability_words){
        body+=ability_words[n]+"\n"
      }
      body+="メイドちゃんより"
      break;
    case 4:
      body+="ハロー世界! \n 何なりと御用をお申し付けくださいませ! \n メイドちゃんより";
      break;
    case 5:
      body+=wikipedia(input);
      break;
    case 6:
      slackpost_team(team_domain,channelId,"承りました!少々お待ちくださいませ\n");
      body+=taqbin(input,username);
      break;
    case 7:
      body+=lanove(input,username);
      break;
    case 8:
      body+=google_search(input);
      break;
    case 9:
      body+=setTrigger(input, team_domain, channelId);
      break;
    case 10:
      body+=task(input, team_domain, channelId, username);
      break;
    case 11:
      body+=Email(input);
      break;
    case 12:
      body+=schedule(input, team_domain, channelId, username);
      break;
    case 13:
      body+=fx(input);
      break;
    case 14:
      body+=news(input, team_domain, channelId, username);
      break;
    case 15:
      body+=anime(input,username);
      break;
    case 16:
      body+=moon();
      break;
    default:
      body+="私は忙しいのです \n なので、ちゃんと入力しないとウイルスとか送っちゃうぞ(笑) \n ウィルスだって作れちゃうメイドちゃんより";
      break;
  }

  //投稿
  bodies=split_4kilobytes(body);
  for (var index =0;index<bodies.length;index++)
  {
    slackpost_team(team_domain,channelId,bodies[index]);
  }
}


/*-------------------------------------------------------------------------------------------------------------------------------------------------------------*/
//メイドちゃんの機能部分のプログラム



function weather(input) {

  cityID = get_cityid(input);

  if(cityID) {
    url = "http://weather.livedoor.com/forecast/webservice/json/v1?city=" + cityID;

    var response = UrlFetchApp.fetch(url);

    var json = JSON.parse(response.getContentText());

    answer = json["forecasts"][0]["date"] + "での" + json["title"] +"は" + json["forecasts"][0]["image"]["title"] + "。\n";
    if(json["forecasts"][0]["temperature"]["max"] != null) {
      answer += "最高気温は" + json["forecasts"][0]["temperature"]["max"]["celsius"] + "℃。";
    }
    if(json["forecasts"][0]["temperature"]["min"] != null) {
      answer += "最低気温は" + json["forecasts"][0]["temperature"]["min"]["celsius"] + "℃です。\n";
    }
    answer += json["description"]["text"] + "\n\n" + "メイドちゃんより";
  } else {
    answer = "その質問は答えられないぞ。\n\nメイドちゃんより";
  }

  return answer;
}

function math(input){

  //input = "plot sin(x)"

  var prop = PropertiesService.getScriptProperties().getProperties();

  //apiを叩くために、inputの文章を整える
  input=encodeURIComponent(input);

  //wolfram alpha apiを叩く
  var result_xml=UrlFetchApp.fetch("http://api.wolframalpha.com/v2/query?input="+input+"&appid="+prop.waappid);

  //結果から必要な要素(計算結果)を抜き出す
  var result_text=result_xml.getContentText();
  var result=XmlService.parse(result_xml.getContentText());
  var src=[],plaintexts=[];
  var body="";


  var root_e=result.getRootElement();
  var pods=root_e.getChildren();
  var IsSuccessful = root_e.getAttribute("success").toString().replace(/\[success\=|\'|\]/ig,"");
  var subpod;
  var interpret_src;
  var interpret;

  if(IsSuccessful=="false"){
    body="申し訳ありませんが、別のキーワードをご入力ください\n\nメイドちゃんより";
    return body;
  }

  for (var i in pods){
    if(pods[i].getAttribute("id")=="[id='Input']"){
      subpod=pods[i].getChildren("subpod")[0];
      interpret_src=subpod.getChild("img").getAttribute("src").toString().replace(/\[src=\'|\'\]/ig,"");
      interpret=subpod.getChild("plaintext").getText();
    }else{
      for (var j in pods[i].getChildren("subpod")){
        subpod=pods[i].getChildren("subpod")[j];
        src.push(subpod.getChild("img").getAttribute("src").toString().replace(/\[src=\'|\'\]/ig,""));
        plaintexts.push(subpod.getChild("plaintext").getText());
      }
    }

  }

  //メイドちゃんのセリフを作る

  body+="『"+interpret+"』の計算結果は以下のとおりです!\n\n";//+interpret_src+"\n";

  for (var i in src){
    body+=plaintexts[i]+"\n"
    if(plaintexts[i].length==0){
      body+=src[i]+"\n";}
  }

  body+=" \n\n メイドちゃんより";

  return body;
}

function get_cityid(input) {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getActiveSheet();
  var values = sheet.getDataRange().getValues();
  var data = {};

  for (var i = 0, l = values.length; i < l; i++) {
    var key = values[i].shift();
    if (key.length > 0) {
      data[key] = values[i];
    }
  }

  for(var city_name in data) {
    //inputにcity_nameが含まれるかどうか確認する
    if (input.match(city_name))
      return String(data[city_name]);
  }
  return 0;
}

function get_latlng(address) {
  var response = Maps.newGeocoder().setLanguage('ja').geocode(address);
  if (response.status === 'ZERO_RESULTS')
    return 0;
  var result = response.results[0];
  return (result.geometry.location.lat + ',' + result.geometry.location.lng).split(",");
}

function root(input) {
  //inputの処理をする, startは出発地,endは到着地
  if (input.match(/.*から/ig) == null || input.match(/.*まで/ig) == null)
  return "〜から〜まで、の表記しか受け付けないぞ\nメイドちゃんより";

  start = input.split("から")[0];
  end = input.split("から")[1].split("まで")[0];

  //startとendの経度緯度を取得
  var startlatlng = get_latlng(start);
  var endlatlng = get_latlng(end);

  //地図の作成
  var map = Maps.newStaticMap().setSize(400, 300)
  .setLanguage('ja')
  .setMapType(Maps.StaticMap.Type.ROADMAP);

  //入力の確認
  if (startlatlng == 0 || endlatlng == 0)
    return "入力が間違っているぞ。\nメイドちゃんより";

  //二点を結ぶルートを検索
  var root = Maps.newDirectionFinder()
  .setOrigin(startlatlng[0], startlatlng[1])
  .setDestination(endlatlng[0], endlatlng[1])
  .getDirections();

  // パスの設定をし、パスの描画を開始
  map.setPathStyle(5, Maps.StaticMap.Color.GREEN, null);
  map.beginPath();
  for (var i in root.routes) {
    for (var j in root.routes[i].legs) {
      for (var k in root.routes[i].legs[j].steps) {
        var step = root.routes[i].legs[j].steps[k];
        var path = Maps.decodePolyline(step.polyline.points);
        map.addPath(path);
      }
    }
  }
  map.endPath();

  // ２点のマーカーを表示
  map.setMarkerStyle(Maps.StaticMap.MarkerSize.MID,Maps.StaticMap.Color.RED,"A");
  map.addMarker(start);
  map.setMarkerStyle(Maps.StaticMap.MarkerSize.MID,Maps.StaticMap.Color.BLUE,"B");
  map.addMarker(end);
  var url = map.getMapUrl();
  var answer = "検索結果が出ました。\n" + "地図はこちら↓\n" + url + "\n\nメイドちゃんより";
  return answer;
}

function hello() {

  var prop = PropertiesService.getScriptProperties().getProperties();

  //slackApp インスタンスの取得
  var slackApp = SlackApp.create(prop.token);

  //投稿
  slackApp.chatPostMessage("self", "ハロー世界! \n```\n 何なりと御用をお申し付けくださいませ! \n```\n メイドちゃんより", {
    username : "メイドちゃん"
    ,icon_emoji:":maid:"
  });

  SlackPost_dm("jan","ハロー世界!");
}

function wikipedia(input){

  var keyword = encodeURIComponent(input);
  var response =UrlFetchApp.fetch("https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&redirects=1&exchars=300&explaintext=1&titles="+keyword);
  var data = JSON.parse(response.getContentText());
  var pages=Object.keys(data["query"]["pages"]);
  var result=data["query"]["pages"][pages[0]]["extract"];
  var body="";
  if (result==null){body="Wikipediaで"+input+"についてお調べいたしましたが、見つかりませんでした。 \n 申し訳ありませんが、別のキーワードを入力してください \n\n メイドちゃんより"}
  else{ body="Wikipediaで"+input+"についてお調べいたしました! \n 結果は以下の通りです。 \n```\n "+result+" \n```\n メイドちゃんより";}

  return body;

}

function get_status(number){
  //  number=303675786503;
  var url="http://nanoappli.com/tracking/api/"+number+".xml";
  var response =XmlService.parse(UrlFetchApp.fetch(url).getContentText());
  var latest_status;
  var status =getElementsByTagName(response.getRootElement(),"status")[0].getText();
  var status_code=getElementsByTagName(response.getRootElement(),"result")[0].getText();

  if(status_code==0){
    latest_status=status;
  }else{
    latest_status="";
  }
  return latest_status;
}

/*

function get_status(number){
//number=304450786651;
var latest_status="";
var url = [//"http://tsuisekiapi.mydns.jp/yamato/?number=",
"http://tsuisekiapi.mydns.jp/sagawa/?number=","http://tsuisekiapi.mydns.jp/japanpost/?number="];

var url_y="http://nanoappli.com/tracking/api/"+number+".xml";
try{
var response =XmlService.parse(UrlFetchApp.fetch(url_y).getContentText());
var status=getElementsByTagName(response.getRootElement(),"status")[0].getText();
var status_code=getElementsByTagName(response.getRootElement(),"result")[0].getText();
//  Logger.log(status_code)
if(status_code==0){
latest_status=status;
}
}catch(e){}
if(!latest_status){
for (var i = 0; i < url.length; i++) {

try{
response =JSON.parse(UrlFetchApp.fetch(url[i]+number).getContentText());
latest_status=response["status"];
var latest_code=Number(response["code"]);
//Logger.log(latest_status);
//Logger.log(latest_code);
//if (latest_code <= 400)
if(latest_status!="桁数エラー"&&latest_status!="荷物データが登録されておりません"){
break;
}
}catch(e){continue;}

}
}
return latest_status;
}
*/


function taqbin(input,username){
  //input=""
  var body="";

  input=input.replace(/\-/ig,"");

  if(input.indexOf("reg")!=-1){
    body=taqbin_reg(input,username);
  }
  else if(input.indexOf("all")!=-1){
    body=taqbin_all(username);
  }
  else{
    body=get_taqbin_info(input,username);
  }

  return body;

}
function taqbin_reg(input,username){
  /*
  input="123456789123";
  username="jan";
  */

  var body="";
  var number=input.match(/\d{12}/ig)[0];
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("taqbin");
  var data = sheet.getDataRange().getValues();
  var number_of_data=data.length;
  var index=0;

  if(data[0][0]!=""){

    while(index<number_of_data&&data[index][0]!=number&&data[index][0]!=""){
      index++;
    }
    if(index==number_of_data||data[index][0]==""){

      data.push([number,get_status(number),username,0]);

      /*
      data[index][0]=number
      data[index][1]=get_status(number);
      data[index][2]=username;
      data[index][3]=0;
      sheet.getRange(index+1, 1).setValue(number);
      sheet.getRange(index+1, 2).setValue(get_status(number));
      sheet.getRange(index+1, 3).setValue(username);
      sheet.getRange(index+1, 4).setValue(0);
      */

      body="追跡番号"+number+"を登録いたしました \n 配達中か営業所に到着しましたらお知らせいたしますね! \n\n メイドちゃんより";

    }else{
      body="追跡番号"+number+"はすでに登録されています! \n\n メイドちゃんより";
    }
  }else{

    data[0][0]=number;
    data[0].push(get_status(number));
    data[0].push(username);
    data[0].push(0);

    /*
    data[0][0]=number
    data[0][1]=get_status(number);
    data[0][2]=username;
    data[0][3]=0;
    sheet.getRange(1, 1).setValue(number);
    sheet.getRange(1, 2).setValue(get_status(number));
    sheet.getRange(1, 3).setValue(username);
    sheet.getRange(1, 4).setValue(0);
    */
    body="追跡番号"+number+"を登録いたしました \n 配達中か納品が完了しましたらお知らせいたしますね! \n\n メイドちゃんより";
  }
  /*
  Logger.log(data);
  return;
  */
  DataWrite(sheet,data);

  return body;
}

function get_taqbin_info(input,username){


  if(!input.match(/\d{12}/ig)){
    return "正しい形式で追跡番号を入力してください!\n\nメイドちゃんより";
  }

  var body="荷物追跡情報の取得に失敗しました。 \n\n メイドちゃんより";
  var trace_number=input.match(/\d{12}/ig)[0];
  var latest_status=get_status(trace_number);
  if(latest_status!=null){
    body="お届予定の荷物の最新情報は、"+latest_status+"です。 \n\n メイドちゃんより";
  }
  return body;
}

function taqbin_all(username){
  //username="miya";

  var body="";

  //taqbinシートから配送情報を、更新して取得
  var data =taqbin_update();

  if(data==null){
    body="登録されている追跡番号はありません\n\n メイドちゃんより";
    return body;
  }

  //usernameがマッチするものだけをslackで通知する(ための文章を作る)

  for(var i=0;i<data.length;i++){

    if(data[i][2]==username){
      body+="追跡番号"+data[i][0]+"はただいま「"+data[i][1]+"」\n";
    }
  }

  body+="です!\n\n メイドちゃんより";

  return body;
}

function taqbin_update(){

  //配達状況を更新して、更新済みデータを返す関数

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("taqbin");
  var data = sheet.getDataRange().getValues();
  var number_of_data=data.length;
  var index=0;
  var status,trace_number;

  if(data[0][0]==""&&number_of_data==1){return null;}

  for(index=0;index<number_of_data;index++){
    try{
      trace_number=data[index][0];　
      status=data[index][1];
      if(trace_number!=""){
        data[index][1]=get_status(trace_number);
        //sheet.getRange(index+1, 1+1).setValue(get_status(trace_number));
      }
    }catch(e){
      continue;
    }
  }
  DataWrite(sheet,data);
  //data = sheet.getDataRange().getValues();

  return data;

}

function taqbin_notify(){

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("taqbin");

  //配達状況の更新
  var data =taqbin_update();//= sheet.getDataRange().getValues();
  if(data==null){return 0;}
  var number_of_data=data.length;
  var index=0;
  var status,username,trace_number,notified;
  var delete_row_list=[];

  if(data==null){return 0;}

  //配達状況に応じて、slackに通知する

  for(index=0;index<number_of_data;index++){

    trace_number=data[index][0];　
    status=data[index][1];
    username=data[index][2];
    notified=data[index][3];

    if(status.indexOf("配達中")!=-1&&notified==0){
      slackpost_dm_team(domain(username),username,"追跡番号"+trace_number+"は、ただいま配達中です!\n メイドちゃんより");
      // sheet.getRange(index+1, 3+1).setValue(1);
      data[index][3]=1;
    }
    else if(status.indexOf("納品完了")!=-1&&notified==0){
      slackpost_dm_team(domain(username),username,"追跡番号"+trace_number+"は、納品が完了しました!\n メイドちゃんより");
      data[index][3]=1;
    }
    else if(status.indexOf("ご来店予定")!=-1&&notified==0){
      slackpost_dm_team(domain(username),username,"追跡番号"+trace_number+"は、ご指定の営業所に到着しました!\n メイドちゃんより");
      data[index][3]=1;
    }
    else if(status.indexOf("不在")!=-1){
      data[index][3]=0;
    }
    else if(status.indexOf("配達完了")!=-1||status.indexOf("投函完了")!=-1||trace_number==""){
      delete_row_list.unshift(index+1);
      //sheet.getRange(index+1, 0+1,1,data[0].length+1).clear();
    }
  }

  sheet.getRange(1, 1,data.length,data[0].length).setValues(data)

  for(var i in delete_row_list){
    sheet.deleteRow(delete_row_list[i]);
  }
}



function taqbin_get(){

  var taqbin_threads=GmailApp.search("subject:(amazon の発送)　is:unread");
  var taqbin_threads_yamato=GmailApp.search("subject:宅急便お届けのお知らせ is:unread");

  /*taqbin_threads=GmailApp.search("subject:(amazon の発送)");
  taqbin_threads_yamato=GmailApp.search("subject:宅急便お届けのお知らせ");
  */
  var msgs=GmailApp.getMessagesForThreads(taqbin_threads);
  var regExp=/お問い合わせ伝票番号は(\d+)/ig;
  var regExpFrom=/\<(.+)\>/ig;
  var body="";
  var trace_number;
  var msg;
  var user_address="";
  var username;
  var m_adderess="maidchan.p@gmail.com";

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("usermailadress");
  var data = sheet.getDataRange().getValues();
  var sheet_taqbin=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("taqbin");
  var data_taqbin=sheet_taqbin.getDataRange().getValues();

  var RegedNums=[];
  var DealtNums=[0];

  for(var i=0;i<data_taqbin.length;i++){
    RegedNums.push(data_taqbin[i][0]);
  }

  if(msgs!=null){
    for(var i=0;i<msgs.length;i++){

      msg=msgs[i][0].getPlainBody();

      if(msgs[i][0].getTo().indexOf(m_adderess)!=-1){
        user_address=
          msgs[i][0].getFrom().match(regExpFrom)[0].replace(/\<|\>/ig,"");
      }
      else{
        user_address=msgs[i][0].getTo();
      }

      for(var index=0;index<data.length;index++){
        if(data[index][0]==user_address){username=data[index][1];}
      }

      if(msg.indexOf("ヤマト運輸")!=-1/*||msg.indexOf("日本郵便")!=-1||msg.indexOf("佐川急便")!=-1||msg.indexOf("ゆうパック")!=-1*/){
        msg=msg.match(regExp)[0];
        trace_number=parseFloat(msg.replace("お問い合わせ伝票番号は",""));

        if(RegedNums.indexOf(trace_number)==-1&&DealtNums.indexOf(trace_number)==-1){
          body=taqbin_reg("reg "+trace_number,username);
          Logger.log(body);
          slackpost_dm_team(domain(username),username,body);
          DealtNums.push(trace_number);
        }
      }

      GmailApp.markThreadRead(taqbin_threads[i]);
    }
  }

  msgs=GmailApp.getMessagesForThreads(taqbin_threads_yamato);
  if(msgs.length==0){return;}

  for(var i=0;i<msgs.length;i++){
    msg=msgs[i][0].getPlainBody();

    if(msgs[i][0].getTo().indexOf(m_adderess)!=-1){
      user_address=
        msgs[i][0].getFrom().match(regExpFrom)[0].replace(/\<|\>/ig,"");
    }else{
      user_address=msgs[i][0].getTo();
    }

    for(var index=0;index<data.length;index++){
      if(data[index][0]==user_address){username=data[index][1];}
    }

    msg=msg.match(/\d{4}\-\d{4}\-\d{4}/ig)[0];
    trace_number=parseFloat(msg.replace(/\-/ig,""));

    if(RegedNums.indexOf(trace_number)==-1&&DealtNums.indexOf(trace_number)==-1){
      Logger.log(RegedNums.indexOf(trace_number))
      body=taqbin_reg("reg "+trace_number,username);
      Logger.log(body);
      slackpost_dm_team(domain(username),username,body);
      DealtNums.push(trace_number);
    }

    GmailApp.markThreadRead(taqbin_threads_yamato[i]);
  }


}

function wunder(input){

  var input="regi メール返信 0630"
  input="list";

  var prop = PropertiesService.getScriptProperties().getProperties();
  var headers={
    "X-Client-ID": prop.wuclientid,
    "X-Access-Token": prop.wutoken,
    "Content-Type":"application/json"
  }

  var params={
    headers:headers,
  };

  var url = "https://a.wunderlist.com/api/v1/lists";
  var url_list="https://a.wunderlist.com/api/v1/tasks?list_id=";
  var tasks=[];
  var strRespons = UrlFetchApp.fetch(url, params);
  var json = JSON.parse(strRespons.getContentText("UTF-8"));
  var list_ids=[];
  var date,today,tenday,n_days;
  today=new Date();
  day=today.getDate();
  tenday=new Date();
  tenday.setDate(day+10);

  if(input.indexOf("list")!=-1){

    for (var i in json){
      list_ids[i]=json[i]["id"];

    };
    for (i in list_ids){
      strRespons = UrlFetchApp.fetch(url_list+list_ids[i], params);
      json = JSON.parse(strRespons.getContentText("UTF-8"));
      tasks[i]=json;
    }

    for (i in tasks){
      for (var j in tasks[i]){
        date = new Date(tasks[i][j]["due_date"].replace(/\-/ig,"\/"));
        n_day=diff_day(today,date);

        if(n_day<0)
        {
          Logger.log(tasks[i][j]["title"]+"は期限を"+(-1*n_day)+"日過ぎてるよ!");
        }
        else if(n_day==0){
          Logger.log(tasks[i][j]["title"]+"は今日が期限だよ!");
        }
        else {
          Logger.log(tasks[i][j]["title"]+"は"+Utilities.formatDate(date, 'Asia/Tokyo', 'M月d日')+"までです!");
        }
      }
    }
  }
}


function get_book_info(input) {
  //var input="http://ranobe-mori.net/label/gagaga-bunko/";
  var response = UrlFetchApp.fetch(input);
  var regexp_month = /<div class=\"entry\" id=\"entry\-\d+\">([\s\S]*?)<\/div>/ig;
  var regexp_td = /<td>([\s\S]*?)<\/td>|<td align=\"center\">\d+<\/td>/ig;
  var match = (response.getContentText("UTF-8")).match(regexp_month);
  //Logger.log(match[1])

  var books = {};
  var year;

  for(var i = 0; i < match.length; i++) {
    var month = match[i].match(/<h2 class=\"entry\-header\">([\s\S]*?)<\/h2>/ig);
    if (month[0].match(/刊行予定/ig))
      continue;
    year= parseInt(month[0].match(/\d{4}年/ig)[0],10);
    month = month[0].match(/(\d+)月/ig);
    month = parseInt(month[0], 10);

    var info = (match[i]).match(regexp_td);
    var month_book = [];
    for(var j = 0; j < info.length / 5; j++) {
      var book = {};
      try {
        var title = (info[j*5+1]).replace("<td>", "");
        title = title.replace("<\/td>", "");
        if (title.match(/<\/a>/ig)) {
          title = title.replace(/<a([\s\S]*?)>/ig, "");
          title = title.replace(/<\/a>/ig, "");
          title = title.replace(/\(\'(\d{2})(.+)延期\)/ig,"")
        }
        if (title.match(/<br \/>/ig))
          title = title.replace(/<br \/>/ig, " ");
        title = _.unescape(title);
        title = title.replace(/\(\'(\d{2})(.+)延期\)/ig,"")
        var day = parseInt((info[j*5]).match(/\d+/ig), 10);
      } catch(e) {
        Logger.log(e);
        continue;
      }
      if(title && day) {
        book["title"] = title;
        book["day"] = day;
        book["year"]= year
        month_book.push(book);
      }
    }
    books[month] = month_book;
  }
  //  Logger.log(Object.keys(books))
  return books;
}

function lanove(input,username){

  var body="";
  //username="jan";
  //input="";
  var command_list={
    "reg":"「lanove reg (登録したいライトノベルのタイトル(の一部)」と入力してください\n登録されたタイトルを含むライトノベルが発売予定になりましたらお知らせ致します",
    "all":"「lanove all」と入力してください\n登録されたタイトルの発売予定をお知らせ致します",
    "list":"「lanove list」と入力してください\n現在お使い頂けるコマンドを一覧できます",
    "default":"「lanove (知りたい月とレーベル名を含む文)」と入力してください\nその月の、入力されたレーベルの発売予定をお調べいたします"
  }

  if(input.indexOf("reg")!=-1){
    input=input.replace(/reg(\S*?)\s/ig,"");
    body=lanove_reg(input,username);
  }else if(input.indexOf("all")!=-1){
    lanove_notify();
    body="新刊発売予定を更新いたしました!\n";
    body+=lanove_all(username);
  }else if(input.indexOf("list")!=-1){
    body="現在お使い頂けるlanove機能でのコマンドは以下の通りです\n"
    for(var key in command_list){
      body+=key+":"+command_list[key]+"\n"
    }
    body+="メイドちゃんより"
  }
  else{
    body=get_lanove_info(input);
  }

  return body;
}

function lanove_notify(){

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("lanove");
  var data = sheet.getDataRange().getValues();
  var body="";
  var input=["http://ranobe-mori.net/label/dengeki-bunko/",
             "http://ranobe-mori.net/label/ga-bunko/",
             "http://ranobe-mori.net/label/gagaga-bunko/",
             "http://ranobe-mori.net/label/fantasia-bunko/",
             "http://ranobe-mori.net/label/mf-bunko-j/",
             "http://ranobe-mori.net/label/sneaker-bunko/"];
  var books=[];
  var titles=[];
  var array=[-1];
  var written_titles=[];
  var today=new Date(),now_month=today.getMonth()+1;
  var now_year=today.getFullYear();
  var body="";
  var null_column_list=[];
  var i,index,j,k;

  //スプレッドシートのlanove_regシートから知らせるタイトルと知らせる人を取得する

  var sheet_reg = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("lanove_reg");
  var data_reg = sheet_reg.getDataRange().getValues();
  if(!(data_reg.length==1&&data_reg[0][0]==="")){
    for(var j=0;j<data_reg.length;j++){
      titles.push({"title":data_reg[j][0],"person":data_reg[j][1]});
    }

  }

  //spreadsheetに記入済みのタイトルを配列に格納する

  for(j=0;j<data.length;j++){
    written_titles.push(data[j][0]);
  }


  //各レーベルについて、発売情報を更新する
  for(i=0;i<input.length;i++){
    k=0;
    do{
      try{
        books=get_book_info(input[i]);
        break;
      }catch(e){
        k++;
        continue;
      }
    }while(k<10)

      for(var month in books){
        for(j=0;j<books[month].length;j++){

          if(written_titles.indexOf(books[month][j]["title"])==-1||(data.length==1&&data[0][0]==="")){

            for (k=0;k<titles.length;k++){

              if(books[month][j]["title"].indexOf(titles[k]["title"])!=-1){

                index=0;
                while(array.indexOf(index)!=-1||(index<data.length&&data[index][0]!="")){index++;}
                sheet.getRange(index+1, 0+1).setValue(books[month][j]["title"]);
                sheet.getRange(index+1, 1+1).setValue(month);
                sheet.getRange(index+1, 2+1).setValue(books[month][j]["day"]);
                sheet.getRange(index+1, 3+1).setValue(0);
                sheet.getRange(index+1, 4+1).setValue(titles[k]["person"]);
                sheet.getRange(index+1, 5+1).setValue(books[month][j]["year"]);
                array.push(index);
              }
            }
          }
        }
      }
  }


  data = sheet.getDataRange().getValues();

  //  発売日が過去のものを削除する
  for(i=0;i<data.length;i++){
    if((data[i][1]<now_month&&data[i][5]<=now_year)||(data[i][0]==="")){
      null_column_list.unshift(i+1);
    }
  }
  if(null_column_list!=null){
    for(j=0;j<null_column_list.length;j++){
      sheet.deleteRow(null_column_list[j]);
    }
  }

  data = sheet.getDataRange().getValues();

  //発売日を通知していないものをslackで通知する。
  for(i=0;i<data.length;i++){

    if(data[i][3]===0){
      body=data[i][1]+"月"+data[i][2]+"日に『"+data[i][0]+"』が発売されます!\n";
      slackpost_dm_team(domain(data[i][4]),data[i][4],body);
      sheet.getRange(i+1, 3+1).setValue(1);
    }
  }

}

function lanove_reg(input,username){
  //input="reg やはり俺"
  //username="jan"
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("lanove_reg");
  var data = sheet.getDataRange().getValues();

  var number_of_data=data.length;
  var index=0;
  var title;
  var body="";
  //inputからタイトルを取り出す

  title=input.replace(/reg(\S+)\s|[\s　]/ig,"");

  //スプレッドシートにタイトル、知らせる対象の人の名前を書き込む
  if(data[0][0]!=""){

    while(index<number_of_data&&!(data[index][0]==title&&data[index][1]==username)&&data[index][0]!=""){
      index++;
    }
    if(index==number_of_data||data[index][0]===""){
      sheet.getRange(index+1, 1).setValue(title);
      sheet.getRange(index+1, 2).setValue(username);
      body="『"+title+"』を登録いたしました \n 新刊が発売予定のときにお知らせいたしますね! \n\n メイドちゃんより";
    }else{
      body="『"+title+"』はすでに登録されています! \n\n メイドちゃんより";
    }
  }
  else{   sheet.getRange(1, 1).setValue(title);
       sheet.getRange(1, 2).setValue(username);
       body="『"+title+"』を登録いたしました \n 新刊が発売予定のときにお知らせいたしますね! \n\n メイドちゃんより";
      }

  return body;

}

function lanove_all(username){
  //username="jan";
  var body="";

  //lanoveシートから新刊情報を取得
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("lanove");
  var data = sheet.getDataRange().getValues();

  //usernameにマッチするものだけをslackで通知する(ための文章を作る)
  for(var i=0;i<data.length;i++){

    if(data[i][4]==username){
      body+=data[i][1]+"月"+data[i][2]+"日に『"+data[i][0]+"』\n";
    }
  }
  if(body===""){
    body="新刊の発売予定はありません!\n\n メイドちゃんより";
  }else{
    body+="が発売予定です!\n\n メイドちゃんより";
  }

  return body;
}


function get_lanove_info(input){
  //input="来月のga"
  try{
    var label=["電撃","GA","ガガガ","ファンタジア","MF","スニーカー"];
    var label_url=["http://ranobe-mori.net/label/dengeki-bunko/",
                   "http://ranobe-mori.net/label/ga-bunko/",
                   "http://ranobe-mori.net/label/gagaga-bunko/",
                   "http://ranobe-mori.net/label/fantasia-bunko/",
                   "http://ranobe-mori.net/label/mf-bunko-j/",
                   "http://ranobe-mori.net/label/sneaker-bunko/"];

    var body  ="申し訳ありませんが、別のキーワードを入力してください。(\"来月の電撃文庫\"など。)\n現在お調べできるレーベルは、\n";
    for (var k=0;k<label.length;k++){
      body+=label[k]+"文庫\n";}
    body+="です!\n\n メイドちゃんより";

    var books=[];
    var month=["今月","来月"];
    var today=new Date(),now_month=today.getMonth()+1;
    var books_data={};
    var label_index=-1;
    var month_index=-1;
    var err_cnt=0;

    for(var i=0;i<label.length;i++){

      if(input.toUpperCase().indexOf(label[i])!=-1){
        label_index=i;
        err_cnt=0;
        do{
          books=get_book_info(label_url[i]);
          err_cnt++;}
        while(books==null&&err_cnt<10);
      }
    }

    for(i=0;i<month.length;i++){
      if(input.indexOf(month[i])!=-1){
        month_index=i;
      }
    }
    if(month_index==-1){
      month_index=0;}

    if(label_index!=-1){

      body=(now_month+month_index)+"月"+books[now_month+month_index][0]["day"]+"日に"+label[label_index]+"文庫から、\n";
      for(var j=0;j<books[now_month+month_index].length;j++){
        body+="『"+books[now_month+month_index][j]["title"]+"』\n";
      }
      body+="が発売されます!\n\nメイドちゃんより";
    }


    return body;
  }catch(e){
    return "エラーです!\n\nメイドちゃんより"
  }
  /*

  return ;*/
  //
}



function get_web_search(keyword) {

  keyword = encodeURIComponent(keyword);
  var response = UrlFetchApp.fetch('https://www.google.co.jp/search?q='+keyword);
  var regexp   = /<h3 class=\"r\">(<a href=\"\/url[\s\S]*?)<\/h3>/gi;
  var elements = response.getContentText().match(regexp)
  var result   = [];
  for (var i in elements) {
    var doc  = XmlService.parse(elements[i]);
    var root = doc.getRootElement();
    result.push({
      title: root.getValue(),
      link:  root.getChild('a').getAttribute('href').getValue().match(/^\/url\?q=(.+?)\&/)[1]
    })
  }
  return result;
}

function google_search(input){

  var body="検索結果は、\n";
  var search_result;
  var retryCount=0;
  do{
    try{search_result=get_web_search(input);
        break;
       }
    catch(e)
    {retryCount++;
     continue;}

  }while(retryCount<10);

  for(var i=0;i<4;i++){
    body+=(i+1)+" "+search_result[i]["title"]+" :\n "+decodeURIComponent(search_result[i]["link"])+"\n";
  }

  body+="です!\n\nメイドちゃんより";

  return body;
}

function setTrigger(input, team_domain, channelID) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alarm');
  var data = sheet.getDataRange().getValues();
  var time = 0;
  var now = new Date();
  var timer = new Date();
  if (input.match(/([\s\S]*?)後/ig)) {
    if (input.match(/(\d+)時間[\s\S]*?後/ig)) {
      var t = input.match(/(\d+)時間/ig);
      time += parseInt(t, 10) * 60 * 60 *1000;
    }
    if (input.match(/(\d+)分[\s\S]*?後/ig)) {
      var t = input.match(/(\d+)分/ig);
      time += parseInt(t, 10) * 60 * 1000;
    }
    if (input.match(/(\d+)秒後/ig)) {
      var t = input.match(/(\d+)秒/ig);
      time += parseInt(t, 10) * 1000;
    }
    timer = new Date(Date.parse(now) + time);
  } else if(input.match(/(\d+)時[(\d+)分]?/ig)) {
    var hours = input.match(/(\d+)時/ig);
    hours = parseInt(hours, 10);
    if (input.match(/(\d+)分/ig)) {
      var minutes = input.match(/(\d+)分/ig);
      minutes = parseInt(minutes, 10);
    }
    timer.setHours(hours)
    timer.setMinutes(0);
    timer.setSeconds(0);
    timer.setMilliseconds(0);
    if (minutes)
      timer.setMinutes(minutes);
  }
  if (timer == now) {
    Logger.log("無効");
    return '無効な値です。';
  }
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }
  var res_triggers = ScriptApp.getProjectTriggers();

  //トリガーの削除

  var trigger = ScriptApp.newTrigger('alarm').timeBased().at(timer).create();
  sheet.getRange(s_i+1, 0+1).setValue(trigger.getUniqueId());
  sheet.getRange(s_i+1, 1+1).setValue(team_domain);
  sheet.getRange(s_i+1, 2+1).setValue(channelID);
  sheet.getRange(s_i+1, 3+1).setValue(timer.getTime());
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  sheet.getRange(1, 1, lastRow, lastCol).sort([{column: 4, ascending: true}]);

  return 'アラームをセットしました。\n時間になったらお知らせいたします。\n\nメイドちゃんより';
}

function alarm() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('alarm');
  var data = sheet.getDataRange().getValues();
  var response = '時間です!\n\nメイドちゃんより';
  var team_domain = data[0][1];
  var channelId = data[0][2];

  slackpost_team(team_domain,channelId,response);

  var res_triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < res_triggers.length; i++) {
    if(res_triggers[i].getUniqueId() == data[0][0]) {
      ScriptApp.deleteTrigger(res_triggers[i]);
      break;
    }
  }
  sheet.deleteRow(0+1);
}

function deleteTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == "alarm") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function task(input, team_domain, channelID, user_name) {
  var body="";

  input=input.replace(/\-/ig,"");

  if(input.indexOf("set")!=-1){
    body=setTask(input,team_domain, channelID, user_name);
  }
  else if(input.indexOf("show")!=-1){
    body=showTask(user_name);
  }
  else if(input.indexOf("delete")!=-1){
    body=deleteTask(input,user_name);
  } else {
    body=task_format();
  }

  return body;
}

function task_format() {
  return 'task (set|show|delete) [input]\n' + 'set:タスクの登録,[input]はタスクの内容\n' + 'show:タスクの表示,[input]なし\n' + 'delete:タスクの消去,[input]は数字なので必ずshowをしてから行ってください\n';
}

function setTask(input, team_domain, channelID, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('task');
  var data = sheet.getDataRange().getValues();

  var date = new Date();
  var task;
  if (!input.match(/(\d+)月(\d+)日に([\s\S]*?)をセット/ig)) {
    //Logger.log('無効な入力');
    return '無効な入力です。';
  }
  if (input.match(/(\d+)月(\d+)日/ig)[0]) {
    var month = input.match(/(\d+)月/ig)[0].replace("月","");
    month = parseInt(month) - 1;
    var day = input.match(/(\d+)日/ig)[0].replace("日","");
    day = parseInt(day);
    date.setHours(7);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    date.setDate(day);
    date.setMonth(month);
    //Logger.log(date);
    //タスクをinputから取り出す
    task = input.match(/に([\s\S]*?)をセット/ig);
    task = task[0].replace("に", "");
    task = task.replace("をセット", "");
  }

  //var trigger = ScriptApp.newTrigger('task').timeBased().at(date).create();
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }
  sheet.getRange(s_i+1, 0+1).setValue(team_domain);
  sheet.getRange(s_i+1, 1+1).setValue(channelID);
  sheet.getRange(s_i+1, 2+1).setValue(user_name);
  sheet.getRange(s_i+1, 3+1).setValue(date);
  sheet.getRange(s_i+1, 4+1).setValue(task);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  //Logger.log('タスクをセットしました');
  return 'タスクをセットしました。';
}

function showTask(user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('task');
  var data = sheet.getDataRange().getValues();
  var u_task_num = 0;
  var a_task_num = sheet.getLastRow(); //全てのタスクの数
  var response = '';
  for (var i = 0; i < a_task_num; i++) {
    var user = data[i][2];
    if (user == user_name) {
      response += '['+ String(u_task_num)+ '] ' + data[i][4] + " 締切日" + String(data[i][3].getMonth()+1) + '/' + String(data[i][3].getDate()) + '\n';
      u_task_num++;
    }
  }
  if (u_task_num == 0)
    response = 'セットされているタスクはありません。';
  else
    response = 'セットされているタスクは以下の'+String(u_task_num)+'件です。\n\n'+response;

  //Logger.log(response);
  return response;
}

function deleteTask(input, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('task');
  var data = sheet.getDataRange().getValues();
  var delete_num = input.match(/\d+/ig)[0];
  var delete_row = 0;
  var u_task_num = 0;
  var a_task_num = sheet.getLastRow(); //全てのタスクの数
  var response = '';
  var flag = 0;
  //Logger.log(delete_num);
  slackpost_team('friendsofspring','C5MEGCUF5',input+user_name);
  for (var i = 0; i < a_task_num; i++) {
    var user = data[i][2];
    if (user == user_name && u_task_num == delete_num) {
      delete_row = i;
      flag = 1;
      break;
    } else if (user == user_name) {
      u_task_num++;
    }
  }
  if (flag) {
    sheet.deleteRow(delete_row+1);
  } else {
    //Logger.log('タスクを削除できない');
    return 'タスクを削除できません。';
  }
  //Logger.log('タスクを削除しました');
  return 'タスクを削除しました。';
}

function alartTask() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('task');
  var data = sheet.getDataRange().getValues();
  var date = new Date();
  var today_month = date.getMonth();
  var today_date = date.getDate();
  var response = new Array();
  var a_task_num = sheet.getLastRow();
  var u_task_num = 0;
  var name_list = new Array();
  var is_same_name = 0;
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  if (s_i) {
    name_list[0] = data[0][2];
    for (var i = 1; i < s_i; i++) {
      is_same_name = 0;
      for (var j = 0; j < name_list.length; j++) {
        //Logger.log('data:'+data[i][2] + ' namelist:'+name_list[j]);
        //Logger.log('is:' + (data[i][2] === name_list[j]));
        if (data[i][2] === name_list[j]) {
          is_same_name = 1;
        }
      }
      if (is_same_name == 0)
        name_list.push(data[i][2]);
    }
  } else {
    //s_iが0だと表示する必要ない
    return;
  }
  //Logger.log(s_i);
  //Logger.log(name_list);

  //一週間以内のタスクを表示
  for (var i = 0; i < name_list.length; i++) {
    response[i] = '';
    var user_name = name_list[i];
    //response[i] = '@'+ user_name + 'さま\n';
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][3];
      if (sheet_date.getTime() - date.getTime() <= (7*24*60*60*1000) && user_name ==data[j][2] && sheet_date.getTime() - date.getTime() > (24*60*60*1000)) {
        response[i] += '['+ String(u_task_num)+ '] ' + data[j][4] + " 締切日" + String(data[j][3].getMonth()+1) + '/' + String(data[j][3].getDate()) + '\n';
        u_task_num++;
      }
    }
    if (u_task_num == 0) {
      response[i] += '一週間以内のタスクはありません\n';
    } else {
      response[i] = '一週間以内のタスクは以下の通りです。\n\n' + response[i];
    }
    response[i] = '@' + user_name + 'さま\n' + response[i];
  }

  //今日締め切りのタスクを格納
  for (var i = 0; i < name_list.length; i++) {
    var user_name = name_list[i];
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][3];
      if (sheet_date.getMonth() == today_month && sheet_date.getDate() == today_date && user_name ==data[j][2] ) {
        if (u_task_num == 0)
          response[i] += '今日締め切りのタスクは以下の通りです。\n\n';
        response[i] += '['+ String(u_task_num)+ '] ' + data[j][4] + " 締切日" + String(data[j][3].getMonth()+1) + '/' + String(data[j][3].getDate()) +'\n';
        u_task_num++;
      }
    }
    if (u_task_num == 0) {
      response[i] += '今日締め切りのタスクはありません\n\n';
    }
  }

  //期限切れのタスクを表示
  for (var i = 0; i < name_list.length; i++) {
    var user_name = name_list[i];
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][3];
      if (sheet_date.getTime() - date.getTime() < 0 && user_name ==data[j][2] ) {
        if (u_task_num == 0)
          response[i] += '期限切れのタスクは以下の通りです。\n\n';
        response[i] += '['+ String(u_task_num)+ '] ' + data[j][4] + " 締切日" + String(data[j][3].getMonth()+1) + '/' + String(data[j][3].getDate()) +'\n';
        u_task_num++;
      }
    }
    if (u_task_num == 0) {
      response[i] += '期限切れのタスクはありません\n\n';
    }
  }

  /*
  for(var i = 0; i < name_list.length; i++) {
  Logger.log(response[i]);
  }
  */

  for(var i = 0; i < name_list.length; i++) {
    var team_domain;
    var channelId;
    for(var j = 0; j < s_i; j++) {
      if (data[j][2] === name_list[i]) {
        team_domain = data[j][0];
        channelId = data[j][1];
      }
    }
    slackpost_team(team_domain,channelId,response[i]);
  }
}

function schedule(input, team_domain, channelID, user_name) {
  var body="";

  input=input.replace(/\-/ig,"");

  if(input.indexOf("set")!=-1){
    body=setSchedule(input,team_domain, channelID, user_name);
  }
  else if(input.indexOf("show")!=-1){
    body=showSchedule(user_name);
  }
  else if(input.indexOf("delete")!=-1){
    body=deleteSchedule(input,team_domain, channelID, user_name);
  } else {
    body=scheduleFormat();
  }

  return body;
}

function scheduleFormat() {
  return 'schedule (set|show|delete) [input]\n' + 'set:スケジュールの登録,[input]はスケジュールの内容\n' + 'show:スケジュールの表示,[input]なし\n' + 'delete:スケジュールの消去,[input]は数字なので必ずshowをしてから行ってください\n';
}

function setSchedule(input, team_domain, channelID, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('schedule');
  var data = sheet.getDataRange().getValues();

  var start = new Date();
  var end = new Date();
  var schedule;
  var is_everyweek;
  if (!(input.match(/(\d+)月(\d+)日の(\d+)時(\d+)分から(\d+)時(\d+)分まで([\s\S]*?)をセット/ig) || input.match(/毎週(\S+)曜日の(\d+)時(\d+)分から(\d+)時(\d+)分まで([\s\S]*?)をセット/ig))) {
    //Logger.log('無効な入力');
    return '無効な入力です。';
  }

  var start_hour = input.match(/(\d+)時/ig)[0].replace("時","");
  start.setHours(start_hour);
  var start_mini = input.match(/(\d+)分/ig)[0].replace("分","");
  start.setMinutes(start_mini);
  start.setSeconds(0);
  start.setMilliseconds(0);
  var end_hour = input.match(/(\d+)時/ig)[1].replace("時","");
  end.setHours(end_hour);
  var end_mini = input.match(/(\d+)分/ig)[1].replace("分","");
  end.setMinutes(end_mini);
  end.setSeconds(0);
  end.setMilliseconds(0);

  if (input.match(/(\d+)月(\d+)日/ig)) {
    var month = input.match(/(\d+)月/ig)[0].replace("月","");
    month = parseInt(month) - 1;
    var day = input.match(/(\d+)日/ig)[0].replace("日","");
    day = parseInt(day);
    start.setDate(day);
    start.setMonth(month);
    end.setDate(day);
    end.setMonth(month);
    //Logger.log(date);
    //タスクをinputから取り出す
    is_everyweek = 0;
  } else if (input.match(/毎週\S+曜日/ig)) {
    var day = {'日曜':0, '月曜':1, '火曜':2, '水曜':3, '木曜':4, '金曜':5, '土曜':6};
    var sche_day = input.match(/毎週\S+曜/ig)[0].replace("毎週", "");
    sche_day = day[sche_day];
    //Logger.log(sche_day);
    if (sche_day - start.getDay() >= 0){
      start.setTime(start.getTime() + (sche_day - start.getDay()) * 24 * 60 * 60 * 1000);
      end.setTime(end.getTime() + (sche_day - end.getDay()) * 24 * 60 * 60 * 1000);
    } else {
      start.setTime(start.getTime() + (7 - start.getDay() + sche_day) * 24 * 60 * 60 * 1000);
      end.setTime(end.getTime() + (7 - end.getDay() + sche_day) * 24 * 60 * 60 * 1000);
    }
    is_everyweek = 1;
  } else {
    //念のため
    return '無効な値です。';
  }

  schedule = input.match(/まで([\s\S]*?)をセット/ig);
  schedule = schedule[0].replace("まで", "");
  schedule = schedule.replace("をセット", "");

  //var trigger = ScriptApp.newTrigger('task').timeBased().at(date).create();
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  sheet.getRange(s_i+1, 0+1).setValue(team_domain);
  sheet.getRange(s_i+1, 1+1).setValue(channelID);
  sheet.getRange(s_i+1, 2+1).setValue(user_name);
  sheet.getRange(s_i+1, 3+1).setValue(schedule);
  sheet.getRange(s_i+1, 4+1).setValue(start);
  sheet.getRange(s_i+1, 5+1).setValue(end);
  sheet.getRange(s_i+1, 6+1).setValue(is_everyweek);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  //Logger.log('スケジュールをセットしました');
  return 'スケジュールをセットしました。';
}

function showSchedule(user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('schedule');
  var data = sheet.getDataRange().getValues();
  var u_sche_num = 0;
  var a_sche_num = sheet.getLastRow(); //全てのスケジュールの数
  var response = '';
  for (var i = 0; i < a_sche_num; i++) {
    var user = data[i][2];
    if (user == user_name) {
      response += '['+ String(u_sche_num)+ '] ' + data[i][3] + "\n 予定日" + String(data[i][4].getMonth()+1) + '/' + String(data[i][4].getDate());
      response += ' 時間:' + String(data[i][4].getHours()) + ':' + String(data[i][4].getMinutes()) + ' ~ '+ String(data[i][5].getHours()) + ':' + String(data[i][5].getMinutes()) + '\n';
      u_sche_num++;
    }
  }
  if (u_sche_num == 0)
    response = 'セットされているスケジュールはありません。';
  else
    response = 'セットされているスケジュールは以下の'+String(u_sche_num)+'件です。\n\n'+response;

  //Logger.log(response);
  return response;
}

function deleteSchedule(input, team_domain, channelID, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('schedule');
  var data = sheet.getDataRange().getValues();
  var delete_num = parseInt(input.match(/\d+/ig)[0]);
  var delete_row = 0;
  var u_sche_num = 0;
  var a_sche_num = sheet.getLastRow(); //全てのスケジュールの数
  var response = '';
  var flag = 0;
  //Logger.log(delete_num);
  slackpost_team('friendsofspring','C5MEGCUF5', input+user_name);
  for (var i = 0; i < a_sche_num; i++) {
    var user = data[i][2];
    if (user == user_name && u_sche_num == delete_num) {
      delete_row = i;
      flag = 1;
      break;
    } else if (user == user_name) {
      u_sche_num++;
    }
  }
  if (flag) {
    if (data[delete_row][6]) {
      data[delete_row][4].setTime(data[delete_row][4].getTime() + 7 * 24 * 60 * 60 * 1000);
      data[delete_row][5].setTime(data[delete_row][5].getTime() + 7 * 24 * 60 * 60 * 1000);
      sheet.getRange(delete_row+1, 4+1).setValue(data[delete_row][4]);
      sheet.getRange(delete_row+1, 5+1).setValue(data[delete_row][5]);
    } else {
      sheet.deleteRow(delete_row+1);
    }
  } else {
    //Logger.log('スケジュールを削除できない');
    return 'スケジュールを削除できません。';
  }
  //Logger.log('スケジュールを削除しました');
  return 'スケジュールを削除しました。';
}

function alartSchedule() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('schedule');
  var data = sheet.getDataRange().getValues();
  var date = new Date();
  var tomo = new Date();
  tomo.setDate(date.getDate()+1);
  var today_month = date.getMonth();
  var today_date = date.getDate();
  var tomo_date = tomo.getDate();
  var tomo_month= tomo.getMonth();
  var response = new Array();
  var a_task_num = sheet.getLastRow();
  var u_task_num = 0;
  var name_list = new Array();
  var is_same_name = 0;
  var s_i = 0;

  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  //全usernameを取得
  if (s_i) {
    name_list[0] = data[0][2];
    for (var i = 1; i < s_i; i++) {
      is_same_name = 0;
      for (var j = 0; j < name_list.length; j++) {
        if (data[i][2] === name_list[j]) {
          is_same_name = 1;
        }
      }
      if (is_same_name == 0)
        name_list.push(data[i][2]);
    }
  } else {
    //s_iが0だと表示する必要ない
    return;
  }

  //明日のタスクを表示
  for (var i = 0; i < name_list.length; i++) {
    response[i] = '';
    var user_name = name_list[i];
    //response[i] = '@'+ user_name + 'さま\n';
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][4];
      //Logger.log(sheet_date.getMonth()+"月"+sheet_date.getDate()+"日に対して、"+tomo_month+"月"+tomo_date+"日");
      if (sheet_date.getMonth() == tomo_month && sheet_date.getDate() == tomo_date && user_name ==data[j][2]) {
        response[i] += '['+ String(u_task_num)+ '] '+"["+Utilities.formatDate(data[j][4], "Asia/Tokyo", "hh時mm分から")+Utilities.formatDate(data[j][5], "Asia/Tokyo", "hh時mm分まで")+"] " + data[j][4] + '\n';
        u_task_num++;
      }
    }
    if (u_task_num == 0) {
      response[i] += '明日の予定はありません\n';
    } else {
      response[i] = '明日の予定は以下の通りです。\n' + response[i];
    }
    response[i] = '@' + user_name + 'さま\n' + response[i];
  }

  //今日締め切りのタスクを格納
  for (var i = 0; i < name_list.length; i++) {
    var user_name = name_list[i];
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][4];
      if (sheet_date.getMonth() == today_month && sheet_date.getDate() == today_date && user_name ==data[j][2] ) {
        if (u_task_num == 0)
          response[i] += '今日の予定は以下の通りです。\n';
        response[i] += '['+ String(u_task_num)+ '] '+"["+Utilities.formatDate(data[j][4], "Asia/Tokyo", "hh時mm分から")+Utilities.formatDate(data[j][5], "Asia/Tokyo", "hh時mm分まで")+"] " + data[j][4] + '\n';
        u_task_num++;
      }
    }
    if (u_task_num == 0) {
      response[i] += '今日の予定はありません\n\n';
    }
  }


  for(var i = 0; i < name_list.length; i++) {
    var team_domain;
    var channelId;
    for(var j = 0; j < s_i; j++) {
      if (data[j][2] === name_list[i]){
        team_domain = data[j][0];
        channelId = data[j][1];
      }
    }
    slackpost_team(team_domain,channelId,response[i]);
  }
}

function test() {
  var trigger = ScriptApp.newTrigger('alartSchedule').timeBased().after(10 * 1000).create();
}

function Email(input){
  //input="miyaに 野獣先輩より お前のことが好きだったんだよ! メイドちゃんより"
  var split =input.match(/(.*?)\s/ig);
  var recipient=split[0].replace(/に\s/ig,"");
  var mail_body=input.replace(split[0],"").replace(split[1],"");

  GmailApp.sendEmail(user_address(recipient), split[1], mail_body);
  var body=user_address(recipient)+"さまに、件名を"+split[1]+"として、\n\n"+mail_body+"\n\nと、お送りいたしました!\n\nメイドちゃんより";

  return body;
}

function fx(input){
  //  input="usd";
  input=input.toUpperCase();
  input=input.replace("ドル","USD");
  input=input.replace("円","JPY");
  input=input.replace("ユーロ","EUR");

  var body="";
  var CurrencyList=["USD","NZD","ZAR","JPY","CAD","GBP","EUR","AUD","CHF"]
  var currencies=input.match(/USD|NZD|ZAR|JPY|CAD|GBP|EUR|AUD|CHF/ig);

  if(currencies==null){
    body="ただいまお調べできる通貨は以下の通りです!\n"
    for (var i in CurrencyList){body+=CurrencyList[i]+"\n" }
    body+="fx [知りたい通貨] [換算する通貨] のように入力してください!\n"
    body+="\nメイドちゃんより";
    return body;
  }else if(currencies.length==1){
    return "fx [知りたい通貨] [換算する通貨] のように入力してください!\n\nメイドちゃんより";
  }

  var target=currencies[0];
  var unit=currencies[1];
  var rates=GetFXRate(target,unit);

  body="ただいま1 "+target+"は、"+(rates["isExact"]? "": "大まかな値ですが、")+"\n"+"askが"+rates["ask"].toPrecision(5)+" "+unit+"\n"+"bidが"+rates["bid"].toPrecision(5)+" "+unit+"です!\n";
  body+="\nメイドちゃんより"

  return body;
}

function GetFXRate(target,unit) {

  //target="USD";
  //target="EUR";
  //unit="JPY";
  //unit="USD";

  target=target.toUpperCase();
  unit=unit.toUpperCase();
  var CurrencyPairCode = target+unit;
  var rate_list={"JPY":{"ask":1.0,"bid":1.0}};
  var isExact=false;

  var response = UrlFetchApp.fetch("http://www.gaitameonline.com/rateaj/getrate");
  var result=JSON.parse(response.getContentText())["quotes"];
  var bid_rate=0,ask_rate=0;
  //Logger.log(result)

  for (var i in  result){

    var paircode=result[i]["currencyPairCode"]
    var target_r= paircode.slice(0,3);
    var unit_r=paircode.slice(3,6);
    var bid=result[i]["bid"];
    var ask=result[i]["ask"];
    if(unit_r=="JPY"){
      var rate_c={
        "ask":ask,"bid":bid
      }
      rate_list[target_r]=rate_c;
    }
    if(paircode==CurrencyPairCode){
      ask_rate=parseFloat(ask);
      bid_rate=parseFloat(bid);
      isExact=true;
    }
  }


  if(!ask_rate){
    ask_rate=rate_list[target]["ask"]/rate_list[unit]["ask"];
    bid_rate=rate_list[target]["bid"]/rate_list[unit]["bid"];
  }

  ask_rate=parseFloat(ask_rate.toPrecision(5));
  bid_rate=parseFloat(bid_rate.toPrecision(5));

  //Logger.log({"ask":ask_rate,"bid":bid_rate,"isExact":isExact})

  return {"ask":ask_rate,"bid":bid_rate,"isExact":isExact}
}

function news(input, team_domain, channelID, user_name) {
  var url = ["https://news.yahoo.co.jp/pickup/rss.xml", "https://news.yahoo.co.jp/pickup/domestic/rss.xml", "https://news.yahoo.co.jp/pickup/world/rss.xml",
             "https://news.yahoo.co.jp/pickup/economy/rss.xml", "https://news.yahoo.co.jp/pickup/entertainment/rss.xml", "https://news.yahoo.co.jp/pickup/sports/rss.xml",
             "https://news.yahoo.co.jp/pickup/computer/rss.xml", "https://news.yahoo.co.jp/pickup/science/rss.xml", "https://news.yahoo.co.jp/pickup/local/rss.xml"];
  var topics = ["major", "domestic", "world", "economy", "entertainment", "sports", "computer", "science", "local", "setting", "delete"];
  try {
    input=input.replace(/\-/ig,"");
  } catch (e) {
    var response = 'newsのコマンドの一覧です。ご確認くださいませ。\n';
    for (var i = 0; i < topics.length; i++) {
      response = response + String(i) + ' ' + topics[i] + '\n';
    }
    return response;
  }
  var response = '';

  //ニュースを定期的に出力するかどうかの設定のコマンドの時
  if (input.indexOf('setting')!=-1) {
    response = news_setting(input, team_domain, channelID, user_name);
    return response;
  } else if (input.indexOf('delete')!=-1) {
    response = news_delete(team_domain, channelID, user_name);
  }

  //newsのコマンドを確認し、それにあった答えを出力
  for (var i = 0; i < topics.length-2; i++) {
    if(input.indexOf(topics[i])!=-1||input.indexOf(i)!=-1){
      var url_response = UrlFetchApp.fetch(url[i]);
      var xml = XmlService.parse(url_response.getContentText());
      var titles = getElementsByTagName(xml.getRootElement(), 'title');
      var links = getElementsByTagName(xml.getRootElement(), 'link');
      var num = titles.length - 1; //ニュースの数
      var response = topics[i]+'のニュースの一覧です。\n';
      for (var i = 1; i < titles.length; i++) {
        response = response + String(i) + ' ' +　titles[i].getText() + '\n' + links[i].getText() + '\n';
      }
    }
  }

  if (!response) {
    response = 'newsのコマンドの一覧です。ご確認くださいませ。\n';
    for (var i = 0; i < topics.length; i++) {
      response = response + String(i) + ' ' + topics[i] + '\n';
    }
  }
  return response;
}

function news_setting(input, team_domain, channelID, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('news');
  var data = sheet.getDataRange().getValues();
  var topics = ["major", "domestic", "world", "economy", "entertainment", "sports", "computer", "science", "local"];
  var user_topics = new Array();
  var position = -1;
  //dataにいくつのデータが入っているか確認する。
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  //user_nameがnewsのdataの中に入っているか確認する
  for (var i = 0; i < data.length; i++) {
    if (user_name == data[i][2]) {
      position = i;
    }
  }

  //topicsに入っているもので当てはまるものを取ってくる
  for (var i = 0; i < topics.length; i++) {
    if (input.match(topics[i])) {
      user_topics.push(topics[i]);
    }
  }

  if (position == -1 && user_topics.length != 0) {
    sheet.getRange(s_i+1, 0+1).setValue(team_domain);
    sheet.getRange(s_i+1, 1+1).setValue(channelID);
    sheet.getRange(s_i+1, 2+1).setValue(user_name);
    sheet.getRange(s_i+1, 3+1).setValue(user_topics);
    return '設定しました。\ndeleteでいつでも解除できます。\n\nメイドちゃんより';
  } else if (user_topics.length == 0){
    return '出力したいトピックをsettingの後に書きなさい。\n\nメイドちゃんより';
  } else {
    return 'もうすでに設定されています。\n\nメイドちゃんより';
  }
}

function news_delete(team_domain, channelID, user_name) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('news');
  var data = sheet.getDataRange().getValues();
  var position = -1;
  //dataにいくつのデータが入っているか確認する。
  var s_i = 0;
  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  //user_nameがnewsのdataの中に入っているか確認する
  for (var i = 0; i < data.length; i++) {
    if (user_name == data[i][2]) {
      position = i;
    }
  }

  if (position != -1) {
    sheet.deleteRow(position+1);
    return '削除完了しました。\n\nメイドちゃんより';
  } else {
    return 'データがないので削除できません。\n\nメイドちゃんより';
  }
}

function anime(input,username){

  //input=" search gintama"

  var body="";

  if(input.indexOf("reg")!=-1){
    input=input.replace(/reg(.*?)\s/ig,"");
    body+=anime_reg(input,username);
  }else if(input.indexOf("search")!=-1){
    input=input.replace(/search\s/ig,"");
    body+=anime_search(input);
  }else{
    body="anime search [検索したい単語]か\n anime reg [キーワード],[タイトル]\n と入力してください!"
  }

  //Logger.log(body)
  return body;
}

function anime_reg(text,username){

  //text = "anime reg gamers,ゲーマーズ! 二期";

  //種々の変数
  //  var myRegExp=/\s(\S+?)/ig;
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName("anime");
  var data= sheet.getDataRange().getValues();
  var keyword="",title="";

  text=text.replace(/anime\s|reg(\S*)\s|^\s+/ig,"").split(",");

  if(text.length!=2){
    Logger.log("error")
    return "正しい形式で入力してください\n\nメイドちゃんより"
  }

  keyword=text[0];
  title=text[1];

  if(data[0][0]===""&&data.length==1){
    sheet.getRange(1, 1).setValue(keyword);
    sheet.getRange(1, 2).setValue(title);
    sheet.getRange(1, 3).setValue(username);
  }else
  {
    data.push([keyword,title,username]);
  }

  sheet.getRange(1,1,data.length,data[0].length).setValues(data);

  return "キーワードが"+keyword+"、タイトルが"+title+"として登録しました!\n\nメイドちゃんより";

}

function anime_search(text){

  //text=" gintama";

  var anime=text.replace(/anime\s|search\s|^\s+/ig,"");

  var rss ="https://torrents.ohys.net/download/rss.php?dir=new"+"&q="+anime;
  try{
    var response = UrlFetchApp.fetch(rss);}
  catch(e){
    Logger.log("RSSにアクセスできませんでした。");
    return;
  }
  var feed =  response.getContentText();
  var xml = XmlService.parse(response.getContentText());
  var items = xml.getRootElement().getChildren('channel')[0].getChildren('item');
  var title,item,link,titles=[];
  var body="検索結果は";
  var myRegexp =/<td><a rel="nofollow" href="(.*)" target="_blank">(.*)<\/a><\/td>/ig;


  for(var i=0;i<items.length;i++){
    item=items[i];
    title=item.getChild('title').getText();
    title=title.replace(/\[Ohy(.+)\]|\-([^-]*?)\((.*?)torrent/ig,"");

    if(titles==null ||titles.indexOf(title)==-1){
      titles.push(title);
    }
    if(title.search(RegExp(anime,"ig"))!=-1 ){
      link=item.getChild('link').getText();
    }
  }

  if(titles.length==0){
    body+="ないよ";
  }else{
    for(var j=0;j<titles.length;j++){
      body+="\n"+titles[j];
    }
    body+="\nの"+titles.length+"件です!\n\nメイドちゃんより";
  }
  //Logger.log(body)
  return body;
}

function anime_notify() {

  var rss ="https://torrents.ohys.net/download/rss.php?dir=new";
  //var rss ="https://torrents.ohys.net/download/rss.php?dir=new"+"&q=umaru";

  try{
    var response = UrlFetchApp.fetch(rss);}
  catch(e){
    Logger.log("RSSにアクセスできませんでした。");
    return;
  }
  var feed =  response.getContentText();
  var xml = XmlService.parse(response.getContentText());
  var items = xml.getRootElement().getChildren('channel')[0].getChildren('item');
  var title,item,anime,link;
  var myRegexp =/<td><a rel="nofollow" href="(.*)" target="_blank">(.*)<\/a><\/td>/ig;

  var sheet= SpreadsheetApp.getActiveSpreadsheet().getSheetByName("anime");
  var data= sheet.getDataRange().getValues();

  var animes=[];
  var animes_j=[];
  var pubdate,date=new Date();
  var today=new Date(),pubdate_string;
  date.setMinutes(today.getMinutes()-6);
  //date.setHours(today.getHours()-1);

  for(var i = 0;i<data.length;i++){
    animes.push(data[i][0].toLowerCase());
  }

  for(var i=0;i<data.length;i++){
    animes_j.push(data[i][1].toLowerCase());
  }

  for(var i=0;i<items.length;i++){
    item=items[i];
    title=item.getChild('title').getText().toLowerCase();
    pubdate_string=item.getChild('pubDate').getText();
    pubdate_string=pubdate_string.replace(/KST/ig,"+0900");
    pubdate=new Date(pubdate_string);

    title=title.replace(/\[(.*?)\]|.mp4|.torrent|\((.*?)\)/ig,"")

    Logger.log(title)

    for(var index=0;index<animes.length;index++){
      anime=animes[index];
      var AnimeWords=anime.split(" ");
      var Included=true;
      for(var k=0;k<AnimeWords.length;k++){
        if(title.indexOf(AnimeWords[k])==-1){
          Included=false;
        }
      }
      /*
      Logger.log("anime:"+anime);
      Logger.log("Included:"+Included);
      Logger.log("date<=pubdate"+date<=pubdate);
      */

      if(Included &&date<=pubdate){
        //Logger.log("判定成功!");
        link=item.getChild('link').getText();
        title=title.replace(/(.*)\-/ig,animes_j[index]+"-");

        if(title.indexOf("-")==-1)
        {
          title=animes_j[index]+" 全話";
        }

        try{var volume=title.match(/\d+/ig);
            volume = volume[volume.length-1];
            title=title.replace(/-(.*?)\d+/ig,volume+"話");
           }catch(e){
           }
        title=title.replace("end","(最終話)");

        slackpost_dm_team(domain(data[index][2]),data[index][2],title+"がアップロードされました!\nダウンロードリンク:"+link+"\n\nメイドちゃんより");
      }
    }
  }
}

function ScheduleNotify(){
  var now = new Date();
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('schedule');
  var data = sheet.getDataRange().getValues();
  var response = new Array();
  var team_domain = new Array();
  var channelId = new Array();
  var is_same_name = 0;
  var name_list = new Array();
  var a_task_num;
  var u_task_num;
  var s_i = 0;

  if(data.length == 1) {
    if(data[0][0])
      s_i = 1;
  } else {
    s_i = data.length;
  }

  a_task_num = s_i;
  //全usernameを取得
  if (s_i) {
    name_list[0] = data[0][2];
    for (var i = 1; i < s_i; i++) {
      is_same_name = 0;
      for (var j = 0; j < name_list.length; j++) {
        if (data[i][2] === name_list[j]) {
          is_same_name = 1;
        }
      }
      if (is_same_name == 0)
        name_list.push(data[i][2]);
    }
  } else {
    //s_iが0だと表示する必要ない
    return;
  }

  for (var i = 0; i < name_list.length; i++) {
    response[i] = '';
    var user_name = name_list[i];
    //response[i] = '@'+ user_name + 'さま\n';
    u_task_num = 0;
    for (var j = 0; j < a_task_num; j++) {
      var sheet_date = data[j][4];
      if (sheet_date.getTime() - now.getTime() <= 5 * 60 * 1000 && sheet_date.getTime() - now.getTime() >= 0 && user_name ==data[j][2]) {
        response[i] += data[j][3] + 'は間も無くです。\n';
        u_task_num++;
        team_domain[i] = data[j][0];
        channelId[i] = data[j][1];
      }
    }
    if (u_task_num) {
      response[i] = '@' + user_name + 'さま\n' + response[i];
      response[i] = response[i] + '\nメイドちゃんより\n';
    }
    //Logger.log(response[i]);
  }

  for (var i = 0; i < response.length; i++) {
    if (response[i])
      slackpost_team(team_domain[i],channelId[i], response[i]);
  }
  //slackpost_team(team_domain,channelId,response);

  /*
  var res_triggers = ScriptApp.getProjectTriggers();
  for(var i=0; i < res_triggers.length; i++) {
  if(res_triggers[i].getUniqueId() == data[0][0]) {
  ScriptApp.deleteTrigger(res_triggers[i]);
  break;
  }
  }
  sheet.deleteRow(0+1);
  */
}

function notify(){

  try{anime_notify();
     }catch(e_ignored){};

  try{
    taqbin_get();
  }catch(e_ignored){};

  try{
    taqbin_notify();
  }catch(e_ignored){};

}

function moon(){

  var date=new  Date();
  //date.setMonth(date.getMonth()+1);
  //date.setDate(31);
  var body="";
  var phases=GetMoonPhaseinMonth(date.getMonth()+1);
  var FMDs=GFMDiMfromPhases(phases);
  arraysort(FMDs);
  var today=date.getDate();
  var FMD;

  if(today<FMDs[0]){
    FMD=FMDs[0];
  }else if(FMDs.length==2&&today<FMDs[1]){
    FMD=FMDs[1];
  }else{
    FMDs=GetFullMoonDayinMonth(date.getMonth()+2);
    date.setMonth(date.getMonth()+1);
    arraysort(FMDs);
    FMD=FMDs[0];
  }

  body="次の満月は"+(date.getMonth()+1)+"月"+FMD+"日です!";

  return body;

}

function GetMoonPhaseinMonth(Month){

  var date=new Date();
  //Month=4;
  var url="";
  var result;
  var parsed;
  var moon_phases;
  var phases={};
  var FullMoonDay=[];

  for(var i=1;i<29;i+=14){
    url ="http://labs.bitmeister.jp/ohakon/api/?mode=moon_phase&year="+date.getFullYear()+"&month="+Month+"&day="+i+"&hour=19&days=14";
    result = UrlFetchApp.fetch(url);
    parsed = XmlService.parse(result);
    moon_phases = parsed.getRootElement().getChildren("moon_phase");
    for(var key in moon_phases){
      phases[parseInt(key)+i]=parseFloat(moon_phases[key].getText());
    }
  }

  for(var i=29;i<=31;i++){
    url ="http://labs.bitmeister.jp/ohakon/api/?mode=moon_phase&year="+date.getFullYear()+"&month="+Month+"&day="+i+"&hour=19";
    result = UrlFetchApp.fetch(url);
    parsed = XmlService.parse(result);
    moon_phases = parsed.getRootElement().getChildren("moon_phase");
    if(!moon_phases.length){
      break;
    }else{
      phases[i]=parseFloat(parsed.getRootElement().getChild("moon_phase").getText());
    }
  }

  return phases;

}

function GetFullMoonDayinMonth(Month){
  var phases = GetMoonPhaseinMonth(Month);
  var FullMoonDay=[];

  for(var i in phases){
    if(Math.abs(phases[i]-180)<7){FullMoonDay.push(i);}
  }
  return FullMoonDay;

}

function GFMDiMfromPhases(phases){

  var FullMoonDay=[];

  for(var i in phases){
    if(Math.abs(phases[i]-180)<7){FullMoonDay.push(i);}
  }
  return FullMoonDay;

}





/*-----------------------------------------------------------------------------------------------------------------------------------------------------*/




//種々の便利な関数




function slackpost(channelId,body) {

  var prop = PropertiesService.getScriptProperties().getProperties();

  //slackApp インスタンスの取得
  var slackApp = SlackApp.create(prop.token);

  //投稿
  slackApp.chatPostMessage(channelId, body, {
    username : "メイドちゃん"
    ,icon_emoji:":maid:"
    ,link_names:"true"
  });
}

function SlackPost_dm(user_name,body){

  var prop = PropertiesService.getScriptProperties().getProperties();
  body=encodeURIComponent(body);

  var url="https://slack.com/api/chat.postMessage?token="+encodeURIComponent(prop.token)+
    "&channel="+"%40"+user_name+"&username=maidchan&text="+body+"&link_names=true&as_user=true";
  UrlFetchApp.fetch(url);

}

function slackpost_team(team_domain,channelId,body) {

  var prop = PropertiesService.getScriptProperties().getProperties();

  //slackApp インスタンスの取得
  var slackApp = SlackApp.create(prop["token"+team_domain]);

  //投稿
  slackApp.chatPostMessage(channelId, body, {
    username : "メイドちゃん"
    ,icon_emoji:":maid:"
    ,link_names:"true"
  });
}

function slackpost_dm_team(team_domain,user_name,body){

  var prop = PropertiesService.getScriptProperties().getProperties();
  body=encodeURIComponent(body);

  var url="https://slack.com/api/chat.postMessage?token="+encodeURIComponent(prop["token"+team_domain])+
    "&channel="+"%40"+user_name+"&username=maidchan&text="+body+"&link_names=true&as_user=true";
  UrlFetchApp.fetch(url);

  return "success!";

}

function Verify_token(team_domain,token){

  var prop = PropertiesService.getScriptProperties().getProperties();

  if(prop["verifytoken"+team_domain]==token){
    return true;
  }
  else{
    return false;
  }
}


function getElementById(element, idToFind) {
  var descendants = element.getDescendants();
  for (var i in descendants) {
    var elem = descendants[i].asElement();
    if ( elem != null) {
      var id = elem.getAttribute('id');
      if ( id != null && id.getValue() == idToFind) return elem;
    }
  }
}

function getElementsByClassName(element, classToFind) {
  var data = [], descendants = element.getDescendants();
  descendants.push(element);
  for (var i in descendants) {
    var elem = descendants[i].asElement();
    if (elem != null) {
      var classes = elem.getAttribute('class');
      if (classes != null) {
        classes = classes.getValue();
        if (classes == classToFind) {
          data.push(elem);
        } else {
          classes = classes.split(' ');
          for (var j in classes) {
            if (classes[j] == classToFind) {
              data.push(elem);
              break;
            }
          }
        }
      }
    }
  }
  return data;
}

function getElementsByTagName(element, tagName) {
  var data = [], descendants = element.getDescendants();
  for(var i in descendants) {
    var elem = descendants[i].asElement();
    if ( elem != null && elem.getName() == tagName) data.push(elem);
  }
  return data;
}

function get_appdata(url) {
  //データを取得
  var response = UrlFetchApp.fetch(url);
  //jsonデータを配列に格納
  var json = JSON.parse(response.getContentText());

  return json;
}

function diff_day(today,target){

  var diff=target.getTime()-today.getTime();

  var diff_days=Math.floor(diff/(24*60*60*1000));

  return diff_days+1;
}

function getBytes(strSrc){
  var len = 0;
  strSrc = escape(strSrc);
  for(i = 0; i < strSrc.length; i++, len++){
    if(strSrc.charAt(i) == "%"){
      if(strSrc.charAt(++i) == "u"){
        i += 3;
        len++;
      }
      i++;
    }
  }
  return len;
}

function split_4kilobytes(string) {
  var bytes = getBytes(string);
  var offset = 0;
  var chunk = 3000;

  var result = new Array();
  var str_array = string.split('\n');
  while(offset < str_array.length) {
    var str = "";
    for(var i = offset; getBytes(str + str_array[i] + '\n') < chunk && i < str_array.length ;i++) {
      str += str_array[i];
      str += '\n';
      offset = i;
      if (i == str_array.length - 1)
        offset = str_array.length;
    }
    result.push(str);
  }
  return result;
}

function domain(username){
  var team_domains={friendsofspring:["miya","night","tsuchi.anddot"],nameofspring:["leus","jan","rilichy"]};
  var included=0;
  for (var domain in team_domains){
    if((team_domains[domain].indexOf(username))!=-1){
      included=1;
      return domain;}
  }

  if(included=0){return 0;}

}

function user_address(username){

  var addresses={
    jan:"wasedakaisei@gmail.com",
    miya:"ka380npe41@gmail.com"
  }
  if(username in addresses){
    return addresses[username];
  }
  else{
    return username;
  }
}

function string_array_search(string,array){
  //stringに含まれる配列の要素の、最初の番号を返す関数

  //string="abcd";
  //array=["1","2","a"];

  for(var i=0;i<array.length;i++){
    if(string.indexOf(array[i])!=-1){
      return i;
    }
  }
  return -1;

}


function DataWrite(sheet,data){

  sheet.getRange(1, 1,data.length,data[0].length).setValues(data);
}

function arraysort(array,number){
  if(number==0){
    array.sort(function(a,b){
      if( a < b ) return -1;
      if( a > b ) return 1;
      return 0;
    });
  }else{
    array.sort(function(a,b){
      if( a > b ) return -1;
      if( a < b ) return 1;
      return 0;
    });
  }
}


function hoge(body){


}
