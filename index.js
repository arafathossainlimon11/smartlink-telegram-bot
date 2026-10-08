const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// সেটিংস ও নতুন বিজ্ঞাপন কনফিগারেশন
const BOT_TOKEN = "8716261561:AAEQFS3jR8VHI3hqvNQgEQxMUl09wMDObZM";
const DIRECT_AD_URL = "https://uplcm.com/4/11982477";
const MONETAG_META = `<meta name="monetag" content="62063d92d2fdd50e32bf63db7759324b">`;
const POPUNDER_SCRIPT = `<script>(function(s){s.dataset.zone='11982471',s.src='https://al5sm.com/tag.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>`;

// টেলিগ্রাম API কল করার ফাংশন
async function callTelegram(method, body) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error("Telegram API Error:", e);
    return null;
  }
}

// ১. টেলিগ্রাম বট ওয়েবহুক
app.post('/api/telegram', async (req, res) => {
  try {
    const message = req.body.message;
    if (!message || !message.text) return res.sendStatus(200);

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text === '/start') {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: "👋 **স্বাগতম!**\n\nঅনুগ্রহ করে আপনার **ইমেজ হোস্ট লিংক** (Image URL) এখানে পাঠান। আমি এটি শর্ট করে ফেসবুকে পোস্ট করার জন্য রেডি লিংক বানিয়ে দেব।",
        parse_mode: 'Markdown'
      });
      return res.sendStatus(200);
    }

    if (text.startsWith('http://') || text.startsWith('https://')) {
      const waitMsg = await callTelegram('sendMessage', {
        chat_id: chatId,
        text: "⏳ **অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, লিংক তৈরি হচ্ছে...**",
        parse_mode: 'Markdown'
      });

      // ইমেজের মূল লিংক মাস্কিং (Hide)
      const encodedCode = Buffer.from(text).toString('base64url');
      const host = req.get('host');
      const shortUrl = `https://${host}/v/${encodedCode}`;

      const finalReply = `✅ **আপনার লিংক সফলভাবে তৈরি হয়েছে!**\n\n🔗 **ফেসবুক পোস্ট লিংক:**\n\`${shortUrl}\` \n\n📌 এটি ফেসবুকে পোস্ট করলে ছবির বড় প্রিভিউ দেখাবে। ভিজিটর ক্লিক করলে ৩ সেকেন্ড পর বিজ্ঞাপনে নিয়ে যাবে।`;

      if (waitMsg && waitMsg.result) {
        await callTelegram('editMessageText', {
          chat_id: chatId,
          message_id: waitMsg.result.message_id,
          text: finalReply,
          parse_mode: 'Markdown'
        });
      } else {
        await callTelegram('sendMessage', {
          chat_id: chatId,
          text: finalReply,
          parse_mode: 'Markdown'
        });
      }
    } else {
      await callTelegram('sendMessage', {
        chat_id: chatId,
        text: "⚠️ **ভুল ইনপুট!** সঠিক ইমেজের লিংক (`https://...`) পাঠান।",
        parse_mode: 'Markdown'
      });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(200);
  }
});

// ২. ভিজিটর ল্যান্ডিং পেজ (ফেসবুক কার্ড, মেটা ট্যাগ, অন-ক্লিক অ্যাড ও ৩ সেকেন্ড রিডাইরেক্ট)
app.get('/v/:code', (req, res) => {
  try {
    const code = req.params.code;
    const imageUrl = Buffer.from(code, 'base64url').toString('utf-8');
    const currentUrl = `${req.protocol}://${req.get('host')}/v/${code}`;

    res.send(`
      <!DOCTYPE html>
      <html lang="bn">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${MONETAG_META}
        
        <!-- ফেসবুক ওপেন গ্রাফ মেটা ট্যাগ -->
        <meta property="og:title" content="Click to view full image">
        <meta property="og:description" content="Click the image to expand and view full content.">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:url" content="${currentUrl}">
        <meta property="og:type" content="website">

        <title>Loading...</title>
        
        <!-- Monetag OnClick (Popunder) নতুন বিজ্ঞাপন কোড -->
        ${POPUNDER_SCRIPT}

        <style>
          body { font-family: Arial, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
          .timer-box { font-size: 20px; font-weight: bold; background: rgba(255,255,255,0.1); padding: 15px 25px; border-radius: 30px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.2); }
          .count { color: #38bdf8; font-size: 26px; }
          img { max-width: 90%; max-height: 60vh; border-radius: 10px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); object-fit: contain; cursor: pointer; }
        </style>
      </head>
      <body>

        <div class="timer-box">
          অপেক্ষা করুন, রিডাইরেক্ট হচ্ছে... <span class="count" id="timer">3</span> সেকেন্ড
        </div>

        <div>
          <a href="${DIRECT_AD_URL}">
            <img src="${imageUrl}" alt="Content Preview">
          </a>
        </div>

        <script>
          let timeLeft = 3;
          const timerElem = document.getElementById('timer');
          const targetUrl = "${DIRECT_AD_URL}";

          const countdown = setInterval(() => {
            timeLeft--;
            timerElem.innerText = timeLeft;
            if (timeLeft <= 0) {
              clearInterval(countdown);
              window.location.href = targetUrl;
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Invalid link!");
  }
});

// হোম পেজ (Monetag মেটা ট্যাগ সহ)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="bn">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      ${MONETAG_META}
      <title>Smart Link Engine</title>
      <style>
        body { font-family: Arial, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: white; text-align: center; }
        .card { background: rgba(255,255,255,0.05); padding: 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
        h1 { font-size: 22px; color: #38bdf8; margin-bottom: 10px; }
        p { color: #94a3b8; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🚀 Smart Link Engine Active!</h1>
        <p>This server processes Telegram Bot requests and smart links dynamically.</p>
      </div>
    </body>
    </html>
  `);
});

module.exports = app;
