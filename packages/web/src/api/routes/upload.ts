import { z } from "zod";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authed } from "../middleware/auth";
import { s3, BUCKET } from "../lib/s3";

export const upload = {
  /** Presigned PUT — the browser uploads straight to storage. */
  presign: authed
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .handler(async ({ input, context }) => {
      const safe = input.filename.replace(/[^\w.\-]+/g, "_");
      const key = `flowdesk/${context.user.id}/${Date.now()}-${safe}`;
      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: input.contentType }),
        { expiresIn: 600 },
      );
      return { url, key };
    }),

  /** Presigned GET — short-lived download/preview link. */
  signedUrl: authed.input(z.object({ key: z.string() })).handler(async ({ input, context }) => {
    if (!input.key.startsWith(`flowdesk/${context.user.id}/`)) return { url: "" };
    const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: input.key }), {
      expiresIn: 3600,
    });
    return { url };
  }),
};
