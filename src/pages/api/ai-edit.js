import { handleEdit } from "@yysng/ai-edit-engine/server";
import { initContentRoot } from "../../server/contentRoot.init.js";
import { updateContent } from "@yysng/astro-boilerplate";

export async function POST({ request }) {
  initContentRoot();

  return await handleEdit(request, {
    UPDATE_CONTENT: updateContent,
    ...import.meta.env
  });
}