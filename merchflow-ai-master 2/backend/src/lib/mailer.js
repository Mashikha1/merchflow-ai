import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false }
})

export async function sendMail({ to, subject, html, text }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[Mailer] SMTP not configured — skipping email to ${to}: ${subject}`)
        return { skipped: true }
    }
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'MerchFlow AI <no-reply@merchflow.ai>',
            to, subject, html, text
        })
        console.log(`[Mailer] Sent to ${to}: ${info.messageId}`)
        return info
    } catch (err) {
        console.error(`[Mailer] Failed to send to ${to}:`, err.message)
        throw err
    }
}

export function quoteEmailHtml({ quote, brandName = 'MerchFlow AI', brandColor = '#C47B2B' }) {
    const money = (n, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n || 0)
    const items = quote.items || []
    const subtotal = items.reduce((a, i) => a + i.qty * Number(i.unitPrice), 0)
    const discount = items.reduce((a, i) => a + i.qty * Number(i.unitPrice) * ((i.discountPct || 0) / 100), 0)
    const total = Math.max(0, subtotal - discount)

    const rows = items.map(i => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;">${i.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:center;">${i.sku}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:center;">${i.qty}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:right;">${money(i.unitPrice, quote.currency)}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0ede8;text-align:right;">${money(i.qty * Number(i.unitPrice), quote.currency)}</td>
        </tr>
    `).join('')

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Quote from ${brandName}</title></head>
<body style="margin:0;padding:0;background:#f8f5f0;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:680px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:${brandColor};padding:32px 40px;">
        <h1 style="color:#fff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${brandName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Quote #${quote.id}</p>
    </div>
    <div style="padding:40px;">
        <p style="color:#4a3f38;font-size:15px;margin:0 0 24px;">Hi <strong>${quote.buyerName}</strong>,</p>
        <p style="color:#4a3f38;font-size:15px;margin:0 0 32px;">
            Thank you for your interest. Please find your quote details below.
            This quote is valid until <strong>${quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString('en-US', { year:'numeric',month:'long',day:'numeric'}) : '14 days from today'}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
            <thead>
                <tr style="background:#faf8f5;">
                    <th style="padding:10px 12px;text-align:left;font-size:12px;color:#a09080;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Product</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#a09080;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">SKU</th>
                    <th style="padding:10px 12px;text-align:center;font-size:12px;color:#a09080;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Qty</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#a09080;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Unit Price</th>
                    <th style="padding:10px 12px;text-align:right;font-size:12px;color:#a09080;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Line Total</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
        <div style="border-top:2px solid #f0ede8;padding-top:20px;text-align:right;">
            <p style="color:#a09080;font-size:13px;margin:0 0 4px;">Subtotal: <strong style="color:#2c2420;">${money(subtotal, quote.currency)}</strong></p>
            <p style="color:#a09080;font-size:13px;margin:0 0 8px;">Discount: <strong style="color:#2c2420;">-${money(discount, quote.currency)}</strong></p>
            <p style="color:#2c2420;font-size:18px;font-weight:700;margin:0;">Total: ${money(total, quote.currency)}</p>
        </div>
        <div style="margin-top:40px;padding:20px;background:#faf8f5;border-radius:8px;text-align:center;">
            <p style="color:#4a3f38;font-size:14px;margin:0 0 16px;">Questions? Reply to this email or contact us directly.</p>
            <p style="color:#a09080;font-size:12px;margin:0;">This quote was generated by ${brandName} via MerchFlow AI</p>
        </div>
    </div>
</div>
</body>
</html>`
}

export function inviteEmailHtml({ inviterName, role, brandName, acceptUrl }) {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f8f5f0;margin:0;padding:32px;">
<div style="max-width:540px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <h2 style="color:#2c2420;margin:0 0 16px;">You've been invited to ${brandName || 'MerchFlow AI'}</h2>
    <p style="color:#4a3f38;font-size:15px;">${inviterName} has invited you to join their workspace as <strong>${role}</strong>.</p>
    <a href="${acceptUrl}" style="display:inline-block;margin:24px 0;padding:14px 28px;background:#C47B2B;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Accept Invitation</a>
    <p style="color:#a09080;font-size:13px;">This link expires in 7 days. If you didn't expect this, you can ignore it.</p>
</div>
</body></html>`
}
