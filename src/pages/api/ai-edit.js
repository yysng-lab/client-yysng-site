import { handleEdit } from "@yysng/ai-edit-engine/server";
import { updateContentAdapter } from "../../server/updateContent.local.js";

export async function POST(context) {
  const body = await context.request.json();

  const adapted = body.intent
    ? { section: body.intent.target, content: body.intent.payload }
    : body;

  const req = new Request(context.request.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(adapted),
  });

  return handleEdit(req, {
    UPDATE_CONTENT: updateContentAdapter,
    ...import.meta.env,
  });
}