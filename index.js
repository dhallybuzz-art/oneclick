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
app.get('/', (req, res) => res.send("OneClick Signer is Online and Optimized."));

app.get('/:fileName', async (req, res) => {
    // ফাইলের নাম যদি ইউআরএল এনকোড করা থাকে তবে তা ডিকোড করে নেওয়া ভালো
    const fileName = decodeURIComponent(req.params.fileName);

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
        });

        // ২৪ ঘণ্টার (৮৬৪০০ সেকেন্ড) জন্য সিগনেচার জেনারেট করা
        const signedUrl = await getSignedUrl(s3Client, command, { 
            expiresIn: 86400 
        });

        // পাবলিক ডোমেইন রিপ্লেসমেন্ট লজিক
        let finalUrl = signedUrl;
        if (process.env.R2_PUBLIC_DOMAIN) {
            // R2 এর ডিফল্ট এন্ডপয়েন্ট ফরম্যাট
            const defaultEndpoint = `${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
            // ডিফল্ট এন্ডপয়েন্ট সরিয়ে আপনার ডোমেইন বসিয়ে দেওয়া হচ্ছে
            finalUrl = signedUrl.replace(defaultEndpoint, process.env.R2_PUBLIC_DOMAIN);
        }

        res.json({
            status: "success",
            filename: fileName,
            url: finalUrl // এই লিঙ্কে আপনার কাস্টম ডোমেইন এবং সিগনেচার দুইটাই থাকবে
        });

    } catch (error) {
        console.error("Link Generation Error:", error.message);
        res.status(500).json({ status: "error", message: "Error generating link" });
    }
});

app.listen(PORT, () => console.log(`Service running on port ${PORT}`));
