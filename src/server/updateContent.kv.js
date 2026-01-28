const REGISTRY = {
  hero: "hero.json",
  about: "about.json",
  cta: "cta.json",
  testimonials: "testimonials.json",
};

function mergeDefined(existing, incoming) {
  const out = { ...existing };
  for (const k of Object.keys(incoming || {})) {
    const v = incoming[k];
    if (v === undefined) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = mergeDefined(existing?.[k] || {}, v);
    else out[k] = v;
  }
  return out;
}

function validate(section, data) {
  if (section === "hero") {
    if (typeof data.title !== "string") throw new Error("Hero.title must be a string");
    if (typeof data.subtitle !== "string") throw new Error("Hero.subtitle must be a string");
    if (data.cta) {
      if (typeof data.cta !== "object") throw new Error("Hero.cta must be an object");
      if (typeof data.cta.label !== "string") throw new Error("Hero.cta.label must be a string");
      if (typeof data.cta.href !== "string") throw new Error("Hero.cta.href must be a string");
    }
    return;
  }

  if (section === "cta") {
    if (typeof data.heading !== "string") throw new Error("CTA.heading must be a string");
    if (data.description && typeof data.description !== "string") throw new Error("CTA.description must be a string");
    if (!data.button || typeof data.button !== "object") throw new Error("CTA.button must be an object");
    if (typeof data.button.label !== "string") throw new Error("CTA.button.label must be a string");
    if (typeof data.button.href !== "string") throw new Error("CTA.button.href must be a string");
    return;
  }

  throw new Error(`No schema for ${section}`);
}

export async function updateContentKV(section, incoming, env) {
  if (!env?.CONTENT_KV) throw new Error("CONTENT_KV binding missing in env");

  const file = REGISTRY[section];
  if (!file) throw new Error(`No registry entry for ${section}`);

  const raw = await env.CONTENT_KV.get(file);
  const existing = raw ? JSON.parse(raw) : {};

  const merged = mergeDefined(existing, incoming);
  validate(section, merged);

  await env.CONTENT_KV.put(file, JSON.stringify(merged));
  return merged;
}