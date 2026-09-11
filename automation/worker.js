/**
 * Cloudflare Worker — принимает уведомление об оплате от CloudPayments (webhook "Pay"),
 * проверяет подпись и раскидывает данные: админу в Telegram + в Google Таблицу + письмо клиенту.
 *
 * Секреты (задаются через `wrangler secret put <имя>`, НИКОГДА не пишутся в код):
 *   CLOUDPAYMENTS_SECRET  — секретный ключ из личного кабинета CloudPayments (для проверки подписи)
 *   TELEGRAM_BOT_TOKEN    — токен бота-уведомителя от @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID— ID чата/канала, куда слать уведомления о новой оплате
 *   APPS_SCRIPT_URL       — адрес веб-приложения Google Apps Script (см. apps-script.gs)
 */
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Внутренний путь — приём оплаты', { status: 200 });
    }

    const bodyText = await request.text();
    const hmacHeader = request.headers.get('Content-HMAC') || '';

    const valid = await verifyHmac(bodyText, env.CLOUDPAYMENTS_SECRET, hmacHeader);
    if (!valid) {
      // CloudPayments ждёт JSON {"code":0} при успехе; при отклонении — не 0.
      return new Response(JSON.stringify({ code: 13 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const params = new URLSearchParams(bodyText);
    const data = Object.fromEntries(params.entries());
    // Ключевые поля от CloudPayments: Amount, Currency, Email, TransactionId, Data (наш JSON с plan/name/phone/zk)
    let plan = '-', clientName = '', clientPhone = '', zk = 'нет';
    try {
      const extra = JSON.parse(data.Data || '{}');
      plan = extra.plan || '-';
      clientName = extra.name || '';
      clientPhone = extra.phone || '';
      zk = extra.zk || 'нет';
    } catch (e) {}

    const tasks = [];

    if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_ADMIN_CHAT_ID) {
      const zkLine = zk === 'да' ? `\n⚠️ УЖЕ В ЗК/Астровкусе — зачесть остаток!` : '';
      const text =
        `💛 Новая оплата — клуб «Внутренний путь»\n` +
        `Имя: ${clientName || '—'}\n` +
        `Телефон: ${clientPhone || '—'}\n` +
        `Тариф: ${plan}\n` +
        `Сумма: ${data.Amount} ${data.Currency || 'RUB'}\n` +
        `Email: ${data.Email || '—'}\n` +
        `TransactionId: ${data.TransactionId}` +
        zkLine;
      tasks.push(
        fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ chat_id: env.TELEGRAM_ADMIN_CHAT_ID, text }),
        })
      );
    }

    if (env.APPS_SCRIPT_URL) {
      tasks.push(
        fetch(env.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            date: new Date().toISOString(),
            name: clientName,
            phone: clientPhone,
            email: data.Email || '',
            amount: data.Amount || '',
            plan,
            zk,
            transactionId: data.TransactionId || '',
          }),
        })
      );
    }

    await Promise.allSettled(tasks);

    return new Response(JSON.stringify({ code: 0 }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  },
};

/** Проверка подписи CloudPayments: Base64(HMAC-SHA256(тело_запроса, секретный_ключ)) */
async function verifyHmac(body, secret, hmacHeader) {
  if (!secret || !hmacHeader) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  const bytes = new Uint8Array(sig);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  return b64 === hmacHeader;
}
