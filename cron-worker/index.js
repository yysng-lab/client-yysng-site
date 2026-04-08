async function sendEmail(env, payload) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  console.log("Resend response:", JSON.stringify(data));

  if (!res.ok) {
    throw new Error(`Resend failed: ${res.status} ${JSON.stringify(data)}`);
  }

  return data;
}

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
}

function dateKey(daysAgo) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function sumViews(env, slug, days) {
  let total = 0;
  for (let i = 0; i < days; i++) {
    const key = `metrics:open:${slug}:${dateKey(i)}`;
    total += Number(await env.CONTACTS_KV.get(key)) || 0;
  }
  return total;
}

function firstName(fullName = "") {
  return String(fullName).trim().split(/\s+/)[0] || "there";
}

async function maybeSendNudge(env, contact, slug, stage, subject, text, testMode) {
  const sentKey = `nudge:sent:${slug}:${stage}`;
  const alreadySent = await env.CONTACTS_KV.get(sentKey);

  if (alreadySent) return false;

  const toEmail = testMode ? "yy@moolahabits.com" : contact.email;
  if (!toEmail) return false;

  await sendEmail(env, {
    from: env.FROM_EMAIL,
    to: [toEmail],
    subject,
    text,
  });

  await env.CONTACTS_KV.put(sentKey, "1");
  return true;
}

const TEST_MODE = true;

async function runDailySummary(env) {
  const today = todayKeyPart();

  const indexRaw = await env.CONTACTS_KV.get("contacts:index");
  const slugs = JSON.parse(indexRaw || "[]");

  const active = [];

  for (const slug of slugs) {
    const contactRaw = await env.CONTACTS_KV.get(`contact:${slug}`);
    if (!contactRaw) continue;

    const contact = JSON.parse(contactRaw);
    const views = Number(await env.CONTACTS_KV.get(`metrics:open:${slug}:${today}`)) || 0;

    if (views <= 0) continue;

    active.push({
      slug,
      fullName: contact.fullName,
      email: contact.email,
      views,
    });

    const toEmail = TEST_MODE ? "yy@moolahabits.com" : contact.email;
    if (!toEmail) continue;

    const countText =
      views === 1
        ? "1 person viewed your contact page today"
        : `${views} people viewed your contact page today`;

    await sendEmail(env, {
      from: env.FROM_EMAIL,
      to: [toEmail],
      subject: countText,
      text: `Hi ${firstName(contact.fullName)},

${countText}.

If you're actively connecting with people, you can keep sharing it here:
${env.SITE_BASE_URL}/card/${slug}

– YY`,
    });
  }

  if (active.length > 0) {
    const lines = active.map(
      (x) => `${x.fullName} (${x.slug}) — ${x.views} view${x.views === 1 ? "" : "s"}`
    );

    const adminTo = TEST_MODE ? "yy@moolahabits.com" : env.ADMIN_REPORT_EMAIL;

    if (adminTo) {
      await sendEmail(env, {
        from: env.FROM_EMAIL,
        to: [adminTo],
        subject: `Daily vCard activity summary — ${today}`,
        text: `Active vCards today:

${lines.join("\n")}`,
      });
    }
  }

  console.log(`Daily summary done. Active contacts: ${active.length}`);
}

async function runWeeklyNudge(env) {
  const indexRaw = await env.CONTACTS_KV.get("contacts:index");
  const slugs = JSON.parse(indexRaw || "[]");

  let nudgesSent = 0;

  for (const slug of slugs) {
    const contactRaw = await env.CONTACTS_KV.get(`contact:${slug}`);
    if (!contactRaw) continue;

    const contact = JSON.parse(contactRaw);
    const name = firstName(contact.fullName);
    const link = `${env.SITE_BASE_URL}/card/${slug}`;

    const views7 = await sumViews(env, slug, 7);
    const views14 = await sumViews(env, slug, 14);
    const views28 = await sumViews(env, slug, 28);

    const sent7 = await env.CONTACTS_KV.get(`nudge:sent:${slug}:7`);
    const sent14 = await env.CONTACTS_KV.get(`nudge:sent:${slug}:14`);
    const sent28 = await env.CONTACTS_KV.get(`nudge:sent:${slug}:28`);

    // Correct sequence: 7 -> 14 -> 28

    if (views7 === 0 && !sent7) {
      const sent = await maybeSendNudge(
        env,
        contact,
        slug,
        7,
        "Your contact page is ready if you need it",
        `Hi ${name},

Just a quick note — your contact page is still live if you want to use it in your follow-ups.

${link}

– YY`,
        TEST_MODE
      );
      if (sent) {
        nudgesSent++;
        continue;
      }
    }

    if (views14 === 0 && sent7 && !sent14) {
      const sent = await maybeSendNudge(
        env,
        contact,
        slug,
        14,
        "A small nudge on your contact page",
        `Hi ${name},

Just resurfacing this in case it’s useful — your contact page is still there when you need it.

${link}

– YY`,
        TEST_MODE
      );
      if (sent) {
        nudgesSent++;
        continue;
      }
    }

    if (views28 === 0 && sent14 && !sent28) {
      const sent = await maybeSendNudge(
        env,
        contact,
        slug,
        28,
        "Keeping this here for when you need it",
        `Hi ${name},

Just leaving this here for you — your contact page is still live.

You can use it anytime when it becomes useful:
${link}

– YY`,
        TEST_MODE
      );
      if (sent) {
        nudgesSent++;
        continue;
      }
    }
  }

  console.log(`Weekly nudge done. Nudges sent: ${nudgesSent}`);
}

export default {
  async scheduled(event, env, ctx) {
    console.log(`Cron fired: ${event.cron}`);

    if (event.cron === "0 14 * * *") {
      await runDailySummary(env);
      return;
    }

    if (event.cron === "0 0 * * 1") {
      await runWeeklyNudge(env);
      return;
    }

    console.log("No matching cron handler.");
  },
};