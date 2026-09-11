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
    sheet.appendRow(['Дата', 'Email', 'Сумма', 'Тариф', 'TransactionId']);
  }
  sheet.appendRow([data.date, data.email, data.amount, data.plan, data.transactionId]);

  if (data.email) {
    MailApp.sendEmail({
      to: data.email,
      subject: 'Добро пожаловать в клуб «Внутренний путь»',
      htmlBody:
        '<p>Здравствуйте!</p>' +
        '<p>Спасибо за оплату — вы в клубе «Внутренний путь. Трансформация» (тариф: <b>' + data.plan + '</b>).</p>' +
        '<p>Доступ к материалам открывается вручную и появится у вас в Telegram-боте клуба ' +
        '<a href="https://t.me/AndreyVidhayaClub_bot">@AndreyVidhayaClub_bot</a> в течение ближайших дней ' +
        '(конкретная дата открытия доступа — на сайте клуба, раздел «Цена»).</p>' +
        '<p>Если у вас уже открыт диалог с ботом — просто напишите туда, чтобы мы вас узнали.</p>' +
        '<p>С теплом,<br>Андрей и Светлана</p>',
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
