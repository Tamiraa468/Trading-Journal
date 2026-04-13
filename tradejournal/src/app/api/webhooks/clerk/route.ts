import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const h = await headers();
  const svix_id = h.get("svix-id");
  const svix_timestamp = h.get("svix-timestamp");
  const svix_signature = h.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  let evt: WebhookEvent;
  try {
    evt = new Webhook(secret).verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook verify failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  switch (evt.type) {
    case "user.created":
    case "user.updated": {
      const data = evt.data;
      const email =
        data.email_addresses?.find((e) => e.id === data.primary_email_address_id)
          ?.email_address ??
        data.email_addresses?.[0]?.email_address ??
        `${data.id}@placeholder.local`;
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        data.username ||
        null;

      await db.user.upsert({
        where: { clerkId: data.id },
        update: { email, name },
        create: { clerkId: data.id, email, name },
      });
      break;
    }
    case "user.deleted": {
      const id = evt.data.id;
      if (id) {
        await db.user.deleteMany({ where: { clerkId: id } });
      }
      break;
    }
    default:
      break;
  }

  return Response.json({ ok: true });
}
