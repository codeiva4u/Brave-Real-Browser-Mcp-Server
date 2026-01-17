const crypto = require('crypto');
const https = require('https');

const url = 'https://hubstream.art/api/v1/video?id=6pxb6v';
const key = 'kiemtienmua911ca';
const ivList = ['1234567890oiuytr', '0123456789abcdef'];

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const hex = data.trim();
        console.log('Hex length:', hex.length);

        for (const iv of ivList) {
            try {
                const decipher = crypto.createDecipheriv('aes-128-cbc', Buffer.from(key, 'utf8'), Buffer.from(iv, 'utf8'));
                decipher.setAutoPadding(true);
                let decrypted = decipher.update(Buffer.from(hex, 'hex'));
                decrypted = Buffer.concat([decrypted, decipher.final()]);
                const text = decrypted.toString('utf8');

                const sourceMatch = /"source":"([^"]+)"/.exec(text);
                console.log('SUCCESS with IV:', iv);
                console.log('Stream URL:', sourceMatch ? sourceMatch[1].replace(/\\\//g, '/') : 'not found');
                return;
            } catch (e) {
                console.log('Failed with IV', iv, ':', e.message);
            }
        }
        console.log('All IVs failed');
    });
}).on('error', (e) => {
    console.log('Request error:', e.message);
});
