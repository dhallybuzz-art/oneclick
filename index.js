const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

// R2 Client Setup
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/', (req, res) => res.send("OneClick Signer is Online."));

app.get('/:fileName', async (req, res) => {
    const fileName = req.params.fileName;

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName, // বাকেটের ফাইলের নাম
        });

        // ২৪ ঘণ্টার জন্য সিগনেচার করা লিঙ্ক তৈরি হবে
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 86400 
        });

        res.json({
            status: "success",
            filename: fileName,
            url: signedUrl // এই লিঙ্কে X-Amz-Signature থাকবে
        });

    } catch (error) {
        console.error("Link Generation Error:", error.message);
        res.status(500).json({ status: "error", message: "Error generating link" });
    }
});

app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
