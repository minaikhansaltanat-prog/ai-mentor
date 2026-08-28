import { db } from "@/lib/db";

export async function notify(opts: {
  userId: string;
  type: string;
  titleKk: string;
  titleRu: string;
  bodyKk?: string;
  bodyRu?: string;
  linkUrl?: string;
  refId?: string;
}) {
  await db.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      titleKk: opts.titleKk,
      titleRu: opts.titleRu,
      bodyKk: opts.bodyKk ?? "",
      bodyRu: opts.bodyRu ?? "",
      linkUrl: opts.linkUrl,
      refId: opts.refId,
    },
  });
}
