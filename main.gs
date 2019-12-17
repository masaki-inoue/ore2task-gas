var CW_API_BASE_URL = 'https://api.chatwork.com/v2';
var CW_API_TOKEN = 'YOUR_CHATWORK_TOKEN';
var CW_MY_ROOM_ID = 'YOUR_ROOM_ID';

var cwClient = ChatWorkClient.factory({token: CW_API_TOKEN});
var currentSheet = SpreadsheetApp.getActiveSheet();
var lastRow = currentSheet.getLastRow();
var lastColumn = currentSheet.getLastColumn();

function doPost(e) {
  var param = JSON.parse(e.postData.getDataAsString());
  
  //CWのWebhookとcurlでbodyにコマンド入力するのと両方対応する
  var body = param.webhook_event ? param.webhook_event.body : param.body;

  // bodyがない場合は実行終了
  if (!body) {
   return; 
  }
  
  var attrs = body.split(',');
  var command = attrs.shift();
  
  switch(command) {
    case '/一覧':
      showTasksList(attrs);
      break;
    case '/追加':
      addTask(attrs);
      break;
  }

  return ContentService.createTextOutput(JSON.stringify(param)).setMimeType(ContentService.MimeType.JSON);
}

function showTasksList(attrs) {
  var titleText = '';
  var data = currentSheet.getRange(1,1,lastRow, lastColumn).getValues();
  // ヘッダー行を除去する
  data.shift();

  // attrs[0]にPJ名が入っている場合には、そのPJのタスクだけを表示する
  if (attrs[0] && attrs[0].length > 0) {
    var pjName = attrs[0];
    titleText = pjName + 'のタスクを表示';
    
    // PJ名が条件に合うものだけを抽出
    var newData = [];
    for (var i=0; i<data.length; i++) {
      if (data[i][1] === pjName) {
        newData.push(data[i]);
      }
    }
    data = newData;
  } else {
    titleText = 'すべてのタスクを表示'; 
  }

  var msg = makeTaskListMessage(data, titleText);
  postMessage(msg);
}

function addTask(attrs) {
  var pjName = attrs[0];
  var body = attrs[1];
  
  //PJ名・タスク本文のどちらかが空白の場合はエラーとしてタスクを追加しない
  if (!pjName || !body) {
    return;
  }
  
  var newId = lastRow; // TODO: 既存のタスクのIDの最大値＋１するロジックを追加する
  var rows = [[newId, pjName, body]];
  
  currentSheet.getRange(lastRow+1, 1, 1, 3).setValues(rows);
}

function makeTaskListMessage(data, titleText) {
  var msgBody = title(titleText);

  for (var i=0; i<data.length; i++) {
    var v = data[i];
    msgBody += "#"+ v[0]+"【"+v[1]+"】 "+v[2]+"\n"; 
  }
  
  return wrapInfoBox(msgBody);
}

function title(text) {
  return "[title]"+text+"[/title]";
}

function wrapInfoBox(text) {
  return "[info]"+text+"[/info]"; 
}

function postMessage(message) {
  var params = {
    room_id: CW_MY_ROOM_ID,
    body: message
  };
  cwClient.sendMessage(params);
}  