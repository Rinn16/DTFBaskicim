import { s3Client, S3_BUCKET } from "../src/lib/s3";
import { PutBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";

async function setupLifecycleRules() {
  console.log(`Setting up S3 lifecycle rules for bucket: ${S3_BUCKET}`);

  await s3Client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: S3_BUCKET,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: "expire-uploads-24h",
            Status: "Enabled",
            Filter: { Prefix: "uploads/" },
            Expiration: { Days: 1 },
          },
        ],
      },
    })
  );

  console.log("Lifecycle rule set: uploads/ will expire after 24 hours.");
}

setupLifecycleRules().catch((err) => {
  console.error("Failed to set lifecycle rules:", err);
  process.exit(1);
});
