import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Vedly <notifications@vedly.app>";

export async function sendExpenseAddedEmail(params: {
  to: string;
  name: string;
  addedBy: string;
  description: string;
  amount: number;
  yourShare: number;
}) {
  const { to, name, addedBy, description, amount, yourShare } = params;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${addedBy} added an expense: ${description}`,
    html: `
      <div style="font-family: DM Sans, sans-serif; background: #0f1117; color: #f0f4ff; padding: 32px; border-radius: 16px; max-width: 480px; margin: auto;">
        <h2 style="color: #5BC5A7; margin-top: 0;">New Expense Added</h2>
        <p>Hi ${name},</p>
        <p><strong>${addedBy}</strong> added an expense:</p>
        <div style="background: #1e2535; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>${description}</strong></p>
          <p style="margin: 4px 0; color: #8894b0;">Total: ₹${amount.toFixed(2)}</p>
          <p style="margin: 4px 0; color: #5BC5A7;">Your share: ₹${yourShare.toFixed(2)}</p>
        </div>
        <p style="color: #8894b0; font-size: 14px;">Log in to Vedly to view details and settle up.</p>
      </div>
    `,
  });
}

export async function sendSettlementEmail(params: {
  to: string;
  name: string;
  fromName: string;
  amount: number;
}) {
  const { to, name, fromName, amount } = params;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${fromName} settled up with you — ₹${amount.toFixed(2)}`,
    html: `
      <div style="font-family: DM Sans, sans-serif; background: #0f1117; color: #f0f4ff; padding: 32px; border-radius: 16px; max-width: 480px; margin: auto;">
        <h2 style="color: #5BC5A7; margin-top: 0;">Payment Received! 🎉</h2>
        <p>Hi ${name},</p>
        <p><strong>${fromName}</strong> settled up with you.</p>
        <div style="background: #1e2535; border-radius: 10px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #5BC5A7; font-size: 24px; font-weight: 700;">₹${amount.toFixed(2)}</p>
        </div>
      </div>
    `,
  });
}

export async function sendGroupInviteEmail(params: {
  to: string;
  name: string;
  inviterName: string;
  groupName: string;
  inviteCode: string;
  appUrl: string;
}) {
  const { to, name, inviterName, groupName, inviteCode, appUrl } = params;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} added you to ${groupName} on Vedly`,
    html: `
      <div style="font-family: DM Sans, sans-serif; background: #0f1117; color: #f0f4ff; padding: 32px; border-radius: 16px; max-width: 480px; margin: auto;">
        <h2 style="color: #5BC5A7; margin-top: 0;">You've been added to a group!</h2>
        <p>Hi ${name},</p>
        <p><strong>${inviterName}</strong> added you to <strong>${groupName}</strong> on Vedly.</p>
        <a href="${appUrl}/groups" style="display: inline-block; background: #5BC5A7; color: #0f1117; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">View Group</a>
      </div>
    `,
  });
}
