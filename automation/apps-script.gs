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
    var firstName = (data.name || '').split(' ')[0] || 'здравствуйте';
    MailApp.sendEmail({
      to: data.email,
      subject: 'Добро пожаловать в клуб «Внутренний путь»',
      htmlBody: buildWelcomeEmail(firstName, data.plan),
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Красивое HTML-письмо в цветах сайта. Инлайн-стили - иначе почтовые
   клиенты (особенно Outlook/почта mail.ru) обрежут внешние стили.
   Шрифт Jost подключён через @import - его покажут Apple Mail и Gmail-веб,
   Outlook и часть мобильных клиентов всё равно откатятся на Arial (это
   ограничение самих почтовых клиентов, не наше - хуже от попытки не будет). */
function buildWelcomeEmail(firstName, plan) {
  var ink = '#2c2430', soft = '#463b45', gold = '#8c5a24', goldLight = '#d99b52',
      line = 'rgba(150,105,45,.18)', wash = '#f1e2c8';

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<style>@import url(\'https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&display=swap\');</style>' +
    '</head><body style="margin:0;">' +
    '<div style="background:#f7f1e5; padding:32px 16px; font-family:\'Jost\',Arial,Helvetica,sans-serif;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:18px; overflow:hidden; border:1px solid ' + line + ';">' +

        '<tr><td style="background:#211a24; padding:30px 40px; text-align:center;">' +
          '<div style="font-family:Georgia,serif; font-size:11px; letter-spacing:4px; text-transform:uppercase; color:' + goldLight + ';">Клуб</div>' +
          '<div style="font-family:Georgia,serif; font-style:italic; font-size:26px; color:#ffffff; margin-top:6px;">Внутренний путь</div>' +
        '</td></tr>' +

        '<tr><td style="padding:36px 40px 4px;">' +
          '<p style="font-size:17px; color:' + ink + '; margin:0 0 16px;">' + firstName + ', здравствуйте.</p>' +
          '<p style="font-size:15px; line-height:1.7; color:' + soft + '; margin:0;">Вы в закрытом клубе <b>«Внутренний путь. Трансформация»</b> - тариф «' + plan + '». Спасибо, что доверились.</p>' +
        '</td></tr>' +

        '<tr><td style="padding:26px 40px 0;"><div style="height:1px; background:' + line + ';"></div></td></tr>' +
        '<tr><td style="padding:24px 40px 4px;">' +
          '<div style="font-family:Georgia,serif; font-style:italic; font-size:15px; color:' + gold + '; margin-bottom:8px;">Что дальше</div>' +
          '<p style="font-size:14.5px; line-height:1.7; color:' + soft + '; margin:0;">Доступ мы открываем вручную - чтобы никого не потерять и лично познакомиться. Мы напишем вам в Telegram на номер, который вы оставили при оплате, в течение нескольких дней после закрытия окна набора (точные даты - на сайте клуба, раздел «Цена»). Если есть вопросы - пишите нам на vidhaya@mail.ru.</p>' +
        '</td></tr>' +

        '<tr><td style="padding:26px 40px 0;"><div style="height:1px; background:' + line + ';"></div></td></tr>' +
        '<tr><td style="padding:24px 40px 4px;">' +
          '<div style="font-family:Georgia,serif; font-style:italic; font-size:15px; color:' + gold + '; margin-bottom:8px;">Как с нами связаться</div>' +
          '<p style="font-size:14.5px; line-height:1.85; color:' + soft + '; margin:0;">' +
            'Канал Андрея - <a href="https://t.me/astrologvidhaya" style="color:' + gold + ';">t.me/astrologvidhaya</a><br>' +
            'Канал Светланы - <a href="https://t.me/astrolog_wife" style="color:' + gold + ';">t.me/astrolog_wife</a><br>' +
            'Если что-то срочно - напишите на <a href="mailto:vidhaya@mail.ru" style="color:' + gold + ';">vidhaya@mail.ru</a>, мы читаем этот ящик.' +
          '</p>' +
        '</td></tr>' +

        '<tr><td style="padding:28px 40px 36px;">' +
          '<div style="background:' + wash + '; border-radius:12px; padding:16px 20px;">' +
            '<p style="font-size:13.5px; line-height:1.6; color:' + soft + '; margin:0;">Цена, по которой вы вошли сейчас, зафиксирована за вами на все дальнейшие продления - даже когда вход для новых участниц подорожает.</p>' +
          '</div>' +
        '</td></tr>' +

        '<tr><td style="padding:0 40px 36px; text-align:center;">' +
          '<p style="font-family:Georgia,serif; font-style:italic; font-size:15px; color:' + ink + '; margin:0;">С теплом,<br>Андрей и Светлана</p>' +
        '</td></tr>' +

      '</table>' +
    '</div>' +
    '</body></html>'
  );
}
