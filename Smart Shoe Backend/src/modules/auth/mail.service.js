import nodemailer from 'nodemailer'
import { env } from '../../config/env.js'

const hasEmailConfig = Boolean(env.EMAIL_HOST && env.EMAIL_USER && env.EMAIL_APP_PASSWORD)

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_SECURE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_APP_PASSWORD
      }
    })
  : null

const brandColors = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  slate: '#1E293B',
  gray: '#64748B',
  lightGray: '#F1F5F9',
  white: '#FFFFFF',
  green: '#059669',
  red: '#DC2626',
}

function buildEmailWrapper({ title, headline, bodyHtml, footerText, ctaUrl, ctaLabel }) {
  const ctaHtml = ctaUrl && ctaLabel
    ? `<table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td style="border-radius: 8px; background: ${brandColors.primary}; text-align: center;">
            <a href="${ctaUrl}" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 600; color: ${brandColors.white}; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${ctaLabel}</a>
          </td>
        </tr>
       </table>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${brandColors.lightGray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding: 40px 16px;">
      <table role="presentation" width="100%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;background:${brandColors.white};border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header stripe -->
        <tr>
          <td style="background:${brandColors.primary};padding:28px 32px 24px;text-align:center;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td style="width:40px;height:40px;background:${brandColors.white};border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="font-size:22px;line-height:40px;">&#128095;</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="color:${brandColors.white};font-size:18px;font-weight:700;letter-spacing:-0.3px;">Smart Shoe Factory</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${brandColors.slate};line-height:1.3;">${headline}</h1>
            <p style="margin:0 0 20px;font-size:15px;color:${brandColors.gray};line-height:1.6;">${bodyHtml}</p>
            ${ctaHtml}
          </td>
        </tr>
        <!-- Divider -->
        <tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #E2E8F0;margin:0;" /></td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:${brandColors.gray};line-height:1.5;">${footerText}</p>
            <p style="margin:0;font-size:12px;color:#94A3B8;line-height:1.5;">Smart Shoe Factory &mdash; Automated Footwear Manufacturing System</p>
          </td>
        </tr>
      </table>
      <p style="margin-top:20px;font-size:12px;color:#94A3B8;text-align:center;">You received this email because you have an account on Smart Shoe Factory.</p>
    </td></tr>
  </table>
</body>
</html>`
}

export const sendVerificationEmail = async ({ to, code }) => {
  const formattedCode = String(code).split('').join(' ')

  const text = `Your Smart Shoe Factory verification code is ${code}. It expires in 15 minutes. If you didn't request this, you can safely ignore it.`

  const html = buildEmailWrapper({
    title: 'Verify your email',
    headline: 'Verify your email address',
    bodyHtml: `To keep your account secure, please enter the verification code below on the sign-in page. This code is valid for <strong>15 minutes</strong>.
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px auto 0;text-align:center;">
      <tr>
        <td style="background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:12px;padding:20px 32px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:800;color:${brandColors.slate};font-family:'SF Mono',Monaco,monospace;">
          ${formattedCode}
        </td>
      </tr>
    </table>`,
    footerText: `Didn&rsquo;t request this? You can safely ignore it. This code will expire in 15 minutes.`,
  })

  if (!transporter) {
    console.log(`Email verification code for ${to}: ${code}`)
    return
  }

  await transporter.sendMail({
    from: `"Smart Shoe Factory" <${env.EMAIL_FROM}>`,
    to,
    subject: 'Your verification code',
    text,
    html,
  })
}

export const sendPasswordResetEmail = async ({ to, token }) => {
  const resetUrl = `${env.CLIENT_URL}/password-reset?token=${token}`

  const text = `Reset your Smart Shoe Factory password using this link: ${resetUrl}. It expires in 30 minutes. If you didn't request this, you can safely ignore it.`

  const html = buildEmailWrapper({
    title: 'Reset your password',
    headline: 'Reset your password',
    bodyHtml: `We received a request to reset the password for your Smart Shoe Factory account. Click the button below to choose a new password. This link expires in <strong>30 minutes</strong>.`,
    ctaUrl: resetUrl,
    ctaLabel: 'Reset Password',
    footerText: `Didn&rsquo;t request a password reset? You can safely ignore this email &mdash; your password will not change.`,
  })

  if (!transporter) {
    console.log(`Password reset link for ${to}: ${resetUrl}`)
    return
  }

  await transporter.sendMail({
    from: `"Smart Shoe Factory" <${env.EMAIL_FROM}>`,
    to,
    subject: 'Reset your password',
    text,
    html,
  })
}

export const sendRoleAssignmentEmail = async ({ to, fullName, role, employeeId, department }) => {
  const loginUrl = `${env.CLIENT_URL}/login`

  const text = `Hello ${fullName}, your account has been approved! Role: ${role}, Employee ID: ${employeeId}, Department: ${department}. You can now log in at ${loginUrl}.`

  const html = buildEmailWrapper({
    title: 'Account Approved — Janida Shoe Ltd',
    headline: '🎉 Your Account Has Been Approved!',
    bodyHtml: `Hello <strong>${fullName}</strong>,<br/><br/>
    Great news! An administrator has reviewed your registration and approved your account. Here are your details:
    <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0;width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 16px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px 8px 0 0;font-size:13px;color:${brandColors.gray};">Employee ID</td>
        <td style="padding:12px 16px;background:#F8FAFC;border:1px solid #E2E8F0;border-left:none;border-radius:0 8px 0 0;font-size:15px;font-weight:700;color:${brandColors.slate};letter-spacing:1px;">${employeeId}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #E2E8F0;border-top:none;font-size:13px;color:${brandColors.gray};">Role</td>
        <td style="padding:12px 16px;border:1px solid #E2E8F0;border-left:none;border-top:none;font-size:15px;font-weight:600;color:${brandColors.primary};">${role}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #E2E8F0;border-top:none;border-radius:0 0 0 8px;font-size:13px;color:${brandColors.gray};">Department</td>
        <td style="padding:12px 16px;border:1px solid #E2E8F0;border-left:none;border-top:none;border-radius:0 0 8px 0;font-size:15px;font-weight:600;color:${brandColors.slate};">${department}</td>
      </tr>
    </table>
    Please save your <strong>Employee ID</strong> for your records. You can now log in to access your dashboard.`,
    ctaUrl: loginUrl,
    ctaLabel: 'Log In to Your Dashboard',
    footerText: `This is an automated notification from Janida Shoe Ltd. If you did not register, please contact the IT department.`,
  })

  if (!transporter) {
    console.log(`Role assignment email for ${to}: Role=${role}, EmpID=${employeeId}, Dept=${department}`)
    return
  }

  await transporter.sendMail({
    from: `"Janida Shoe Ltd" <${env.EMAIL_FROM}>`,
    to,
    subject: `Account Approved — Your Employee ID is ${employeeId}`,
    text,
    html,
  })
}
