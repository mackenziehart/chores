import { Resend } from 'resend';
import { storage } from './storage';
import { db } from './db';
import { remindersSent } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

// Resend integration - never cache client
async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

async function wasReminderSent(choreId: string, dateKey: string): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(remindersSent)
    .where(and(eq(remindersSent.choreId, choreId), eq(remindersSent.sentDate, dateKey)));
  return !!existing;
}

async function markReminderSent(choreId: string, dateKey: string): Promise<void> {
  await db.insert(remindersSent).values({ choreId, sentDate: dateKey });
}

export async function sendChoreReminder(
  choreId: string,
  toEmail: string,
  partnerName: string,
  choreTitle: string,
  dueDate: string
) {
  try {
    const dateKey = new Date().toISOString().split('T')[0];
    if (await wasReminderSent(choreId, dateKey)) {
      return false;
    }

    const { client, fromEmail } = await getUncachableResendClient();

    await client.emails.send({
      from: fromEmail || 'ChoreShare <onboarding@resend.dev>',
      to: toEmail,
      subject: `Reminder: "${choreTitle}" is due ${dueDate}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #faf9f7; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; background: hsl(345, 72%, 52%); color: white; width: 48px; height: 48px; border-radius: 12px; line-height: 48px; font-size: 24px;">&#9829;</div>
            <h1 style="margin: 12px 0 0; font-size: 22px; color: #2d2d2d;">ChoreShare</h1>
          </div>
          <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #eee;">
            <p style="margin: 0 0 8px; color: #666; font-size: 14px;">Hey ${partnerName},</p>
            <p style="margin: 0 0 16px; color: #333; font-size: 16px;">Just a friendly reminder that your chore is coming up:</p>
            <div style="background: #f5f3f0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <p style="margin: 0; font-weight: 600; font-size: 18px; color: #2d2d2d;">${choreTitle}</p>
              <p style="margin: 8px 0 0; color: #888; font-size: 14px;">Due: ${dueDate}</p>
            </div>
            <p style="margin: 0; color: #999; font-size: 13px;">You've got this! Teamwork makes the dream work.</p>
          </div>
          <p style="text-align: center; color: #bbb; font-size: 12px; margin-top: 20px;">Sent with love from ChoreShare</p>
        </div>
      `,
    });

    await markReminderSent(choreId, dateKey);
    console.log(`[email] Reminder sent to ${toEmail} for "${choreTitle}"`);
    return true;
  } catch (err: any) {
    console.log(`[email] Failed to send reminder: ${err.message}`);
    return false;
  }
}

export async function checkAndSendReminders() {
  try {
    const chores = await storage.getChores();
    const partners = await storage.getPartners();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    for (const chore of chores) {
      if (chore.completed || !chore.dueDate || !chore.assigneeId) continue;

      const dueDate = new Date(chore.dueDate);
      if (dueDate >= tomorrowStart && dueDate < tomorrowEnd) {
        const partner = partners.find((p) => p.id === chore.assigneeId);
        if (partner?.email && partner.email.includes('@')) {
          await sendChoreReminder(
            chore.id,
            partner.email,
            partner.name,
            chore.title,
            dueDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })
          );
        }
      }
    }
  } catch (err: any) {
    console.log(`[email] Reminder check failed: ${err.message}`);
  }
}
