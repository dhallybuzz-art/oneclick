const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

app.get('/:fileName', async (req, res) => {
    const fileName = decodeURIComponent(req.params.fileName);
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
        });

        // ২৪ ঘণ্টার জন্য সিগনেচার জেনারেট
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 86400 });

        let finalUrl = signedUrl;
        if (process.env.R2_PUBLIC_DOMAIN) {
            const defaultEndpoint = `${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
            finalUrl = signedUrl.replace(defaultEndpoint, process.env.R2_PUBLIC_DOMAIN);
        }

        res.json({ status: "success", filename: fileName, url: finalUrl });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.listen(PORT, () => console.log(`OneClick Signer running on port ${PORT}`));
