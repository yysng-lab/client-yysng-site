import { Resend } from "resend";

function todayKeyPart() {
  return new Date().toISOString().slice(0, 10);
}

export default {
  async scheduled(event: any, env: any, ctx: any) {
    const resend = new Resend(env.RESEND_API_KEY);
    const today = todayKeyPart();

    const indexRaw = await env.CONTACTS_KV.get("contacts:index");
    const slugs = JSON.parse(indexRaw || "[]");

    const active: any[] = [];

    for (const slug of slugs) {
      const contactRaw = await env.CONTACTS_KV.get(`contact:${slug}`);
      if (!contactRaw) continue;

      const contact = JSON.parse(contactRaw);
      const views = Number(await env.CONTACTS_KV.get(`metrics:open:${slug}:${today}`)) || 0;

      if (views <= 0) continue;

      active.push({ slug, fullName: contact.fullName, email: contact.email, views });

      if (contact.email) {
        const countText =
          views === 1
            ? "1 person viewed your contact page today"
            : `${views} people viewed your contact page today`;

        await resend.emails.send({
          from: env.FROM_EMAIL,
          to: contact.email,
          subject: countText,
          text: `Hi ${contact.fullName},

${countText}.

If you're actively connecting with people, you can keep sharing it here:
${env.SITE_BASE_URL}/card/${slug}

– YY`
        });
      }
    }

    if (active.length > 0 && env.ADMIN_REPORT_EMAIL) {
      const lines = active.map(
        (x) => `${x.fullName} (${x.slug}) — ${x.views} view${x.views === 1 ? "" : "s"}`
      );

      await resend.emails.send({
        from: env.FROM_EMAIL,
        to: env.ADMIN_REPORT_EMAIL,
        subject: `Daily vCard activity summary — ${today}`,
        text: `Active vCards today:

${lines.join("\n")}`
      });
    }
  }
};