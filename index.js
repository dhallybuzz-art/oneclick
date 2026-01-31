const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

// R2 Client কনফিগারেশন
const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY,
        secretAccessKey: process.env.R2_SECRET_KEY,
    },
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/:fileName', async (req, res) => {
    const fileName = req.params.fileName;

    try {
        // ১. সরাসরি বাকেট থেকে ফাইলের জন্য কমান্ড তৈরি
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName, // এখানে আপনার মুভির আসল নাম বা কি (Key) বসবে
        });

        // ২. Presigned URL জেনারেট করা (২৪ ঘণ্টা মেয়াদের জন্য)
        // এটি আপনার দেওয়া স্যাম্পল লিঙ্কের মতো X-Amz-Signature তৈরি করবে
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 86400 // ২৪ ঘণ্টা (seconds)
        });

        // ৩. PHP সাইটের জন্য JSON রেসপন্স
        res.json({
            status: "success",
            filename: fileName,
            url: signedUrl // এই ইউআরএল-টি আপনার দেওয়া স্যাম্পল লিঙ্কের মতো হবে
        });

    } catch (error) {
        console.error("OneClick Error:", error.message);
        res.status(500).json({ status: "error", message: "Could not generate link" });
    }
});

app.listen(PORT, () => console.log(`OneClick Service running on port ${PORT}`));