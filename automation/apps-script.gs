/**
 * Google Apps Script — САМОСТОЯТЕЛЬНЫЙ скрипт (без таблицы), который получает
 * данные об оплате от Cloudflare Worker и шлёт клиенту письмо о вступлении
 * в клуб. Работает от вашего Google-аккаунта - отдельных ключей не нужно.
 *
 * Установка (без Google Таблиц, только письмо):
 * 1. Откройте script.google.com → New project.
 * 2. Сотрите содержимое Code.gs, вставьте сюда весь этот файл целиком.
 * 3. Deploy → New deployment → тип "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Скопируйте выданный URL - это и есть APPS_SCRIPT_URL для Cloudflare Worker.
 * 4. При первом запуске Google попросит разрешение на отправку писем от
 *    вашего имени - подтвердите под своим аккаунтом.
 */

function doPost(e) {
  var data = JSON.parse(e.postData.contents);

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
