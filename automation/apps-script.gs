/**
 * Google Apps Script — веб-приложение, которое получает данные об оплате от
 * Cloudflare Worker и: 1) дописывает строку в Google Таблицу, 2) шлёт клиенту
 * письмо о вступлении в клуб. Работает от вашего Google-аккаунта — отдельных
 * ключей/сервисных аккаунтов не нужно.
 *
 * Установка:
 * 1. Создайте новую Google Таблицу (или откройте существующую для учёта оплат).
 * 2. В ней: Расширения → Apps Script. Вставьте сюда весь этот файл целиком,
 *    заменив содержимое Code.gs.
 * 3. Замените SHEET_NAME при необходимости.
 * 4. Разверните: Deploy → New deployment → тип "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Скопируйте выданный URL — это и есть APPS_SCRIPT_URL для Cloudflare Worker.
 * 5. При первом запуске Google попросит разрешения (доступ к таблице и Gmail) —
 *    это нормально, подтвердите под своим аккаунтом.
 */

var SHEET_NAME = 'Оплаты';

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Дата', 'Имя', 'Телефон', 'Email', 'Сумма', 'Тариф', 'Уже в ЗК?', 'TransactionId']);
  }
  var isZk = data.zk === 'да';
  sheet.appendRow([data.date, data.name || '', data.phone || '', data.email || '', data.amount, data.plan, isZk ? 'ДА - зачесть остаток' : '', data.transactionId]);

  // подсвечиваем строку жёлтым, если человек уже платит за ЗК/Астровкус жизни - чтобы не потерялось
  if (isZk) {
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).setBackground('#fff3d6');
  }

  if (data.email) {
    var firstName = (data.name || '').split(' ')[0] || 'дорогая гостья';
    MailApp.sendEmail({
      to: data.email,
      subject: 'Добро пожаловать в клуб «Внутренний путь» 🌙',
      htmlBody: buildWelcomeEmail(firstName, data.plan),
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildWelcomeEmail(firstName, plan) {
  return (
    '<div style="font-family:Georgia,serif; color:#2c2430; line-height:1.7; max-width:520px; margin:0 auto;">' +
    '<p style="font-size:18px;">' + firstName + ', здравствуйте.</p>' +
    '<p>Спасибо, что доверились и вошли в закрытый клуб <b>«Внутренний путь. Трансформация»</b> - тариф «' + plan + '».</p>' +
    '<p>Мы с Андреем читаем каждое такое письмо не рабочими глазами, а по-человечески - и правда рады, что вы здесь.</p>' +

    '<h3 style="font-family:Georgia,serif; font-weight:normal; margin-top:28px;">Что дальше</h3>' +
    '<p>Доступ мы открываем вручную, а не автоматически - чтобы никого не потерять и лично познакомиться. ' +
    'Мы напишем вам в Telegram на номер, который вы оставили при оплате, в течение нескольких дней после закрытия окна набора ' +
    '(точные даты - на сайте клуба, раздел «Цена»). Если за это время что-то поменяется - просто ответьте на это письмо.</p>' +

    '<h3 style="font-family:Georgia,serif; font-weight:normal; margin-top:28px;">Как с нами связаться</h3>' +
    '<p>' +
    'Канал Андрея: <a href="https://t.me/astrologvidhaya">t.me/astrologvidhaya</a><br>' +
    'Канал Светланы: <a href="https://t.me/astrolog_wife">t.me/astrolog_wife</a><br>' +
    'Если что-то срочное - отвечайте прямо на это письмо, мы читаем лично.' +
    '</p>' +

    '<h3 style="font-family:Georgia,serif; font-weight:normal; margin-top:28px;">На всякий случай напомним</h3>' +
    '<p>Цена, по которой вы вошли сейчас, зафиксирована за вами на все дальнейшие продления - даже когда вход для новых участниц подорожает.</p>' +

    '<p style="margin-top:32px;">С теплом,<br>Андрей и Светлана</p>' +
    '</div>'
  );
}
