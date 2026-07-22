import nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import EmailLog from '../models/EmailLog.js';

// Create transporter.
// If EMAIL_HOST is set (e.g. GoDaddy SMTP for support@lenzu.app), send through that
// authenticated host so the From domain aligns with SPF/DMARC → lands in inbox, not spam.
// Falls back to Gmail (legacy) when no custom host is configured — non-breaking.
const createTransporter = () => {
  if (process.env.EMAIL_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '465', 10),
      secure: process.env.EMAIL_SECURE !== 'false', // true → 465 (SSL); set 'false' for 587 (STARTTLS)
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send welcome email to new users
export const sendWelcomeEmail = async (user) => {
  // Skip if email is not configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping welcome email for:', user.email);
    return;
  }

  try {
    const transporter = createTransporter();
    
    const isPhotographer = user.role === 'photographer' || user.role === 'creator';
    
    const mailOptions = {
      from: `"LenzuApp" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: isPhotographer
        ? '¡Bienvenido a Lenzu! Tu prueba de 7 días ha comenzado 🎉'
        : '¡Bienvenido a Lenzu! 🎉',
      html: isPhotographer 
        ? getPhotographerWelcomeTemplate(user)
        : getGuestWelcomeTemplate(user)
    };

    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw - email failure shouldn't block registration
  }
};

// Template for photographer/creator welcome email
const getPhotographerWelcomeTemplate = (user) => {
  const trialEndDate = user.trial_end_date 
    ? new Date(user.trial_end_date).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : '7 días desde hoy';

  const isBeta = new Date() < new Date('2026-05-08T23:59:59');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F2F1F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background-color: #12112a; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Lenzu!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #3B3B3B; margin-top: 0;">Hola ${user.name},</h2>

          ${isBeta ? `
          <!-- Beta block (visible only before May 8, 2026) -->
          <div style="background-color: #12112a; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
            <p style="color: #CDD973; font-size: 18px; font-weight: bold; margin: 0 0 12px 0;">
              🎉 Bienvenido a la Beta de Lenzu
            </p>
            <p style="color: #ffffff; font-size: 14px; line-height: 1.7; margin: 0 0 12px 0;">
              Te registraste durante nuestra Beta abierta, así que tienes acceso completo a todas las funciones de Lenzu — incluyendo custom branding — durante 30 días, sin costo.
            </p>
            <p style="color: rgba(255,255,255,0.7); font-size: 14px; line-height: 1.7; margin: 0;">
              Queremos que lo pruebes en campo y nos cuentes qué piensas. Si tienes dudas o sugerencias, responde directamente a este correo.
            </p>
          </div>
          ` : ''}

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Bienvenido a Lenzu — la app que mantiene a tu equipo sincronizado el día de la boda.
          </p>

          <!-- Trial Box -->
          <div style="background-color: #CDD973; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #3B3B3B; margin: 0 0 10px 0;">🎉 Tu prueba gratuita de 7 días está activa</h3>
            <p style="color: #3B3B3B; margin: 0; font-size: 14px;">
              Válida hasta: <strong>${trialEndDate}</strong>
            </p>
          </div>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Durante tu período de prueba puedes:
          </p>

          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            <li>Crea proyectos con timeline del día</li>
            <li>Gestiona tu shot list por categorías</li>
            <li>Invita a tu equipo como colaboradores</li>
            <li>Notificaciones antes de cada momento clave</li>
            <li>Sincronización con Apple Watch</li>
          </ul>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://lenzu.app/dashboard"
               style="background-color: #3B3B3B; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Crear mi primer proyecto →
            </a>
          </div>

          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Si tienes alguna pregunta, no dudes en contactarnos respondiendo a este email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F2F1F0; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Lenzu · Coordinación para fotógrafos de boda · lenzu.app
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Template for guest welcome email
const getGuestWelcomeTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F2F1F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #3B3B3B; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a LenzuApp!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #3B3B3B; margin-top: 0;">Hola ${user.name},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            ¡Gracias por crear tu cuenta en LenzuApp!
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Como invitado, podrás acceder a los proyectos de eventos que te compartan. 
            Cuando un fotógrafo u organizador te invite a su timeline, recibirás una notificación 
            y podrás ver todos los detalles del evento.
          </p>
          
          <!-- Info Box -->
          <div style="background-color: #F2F1F0; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #3B3B3B; margin: 0 0 10px 0;">📋 ¿Qué puedes hacer como invitado?</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
              <li>Ver timelines de eventos compartidos</li>
              <li>Consultar horarios y ubicaciones</li>
              <li>Participar en el chat del evento</li>
              <li>Recibir notificaciones de cambios</li>
            </ul>
          </div>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://lenzu.app/dashboard" 
               style="background-color: #3B3B3B; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Ir a mi Dashboard →
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            ¿Eres fotógrafo y quieres crear tus propios proyectos? 
            <a href="https://lenzu.app" style="color: #3B3B3B;">Actualiza tu cuenta aquí</a>.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F2F1F0; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} LenzuApp - Planifica tu evento perfecto
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Send password reset email
export const sendPasswordResetEmail = async (user, resetToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping password reset email for:', user.email);
    return;
  }

  try {
    const transporter = createTransporter();
    const resetUrl = `https://lenzu.app/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"LenzuApp" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Restablecer tu contraseña - LenzuApp',
      html: getPasswordResetTemplate(user, resetUrl)
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Template for password reset email
const getPasswordResetTemplate = (user, resetUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F2F1F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #3B3B3B; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Restablecer Contraseña</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #3B3B3B; margin-top: 0;">Hola ${user.name},</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta en LenzuApp.
          </p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Haz clic en el siguiente botón para crear una nueva contraseña:
          </p>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3B3B3B; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña →
            </a>
          </div>
          
          <!-- Warning Box -->
          <div style="background-color: #FFF3CD; border-radius: 12px; padding: 20px; margin: 25px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              ⚠️ Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este email.
            </p>
          </div>
          
          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Si el botón no funciona, copia y pega este enlace en tu navegador:
          </p>
          <p style="color: #666; font-size: 12px; word-break: break-all;">
            ${resetUrl}
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F2F1F0; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} LenzuApp - Planifica tu evento perfecto
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `;
};

// Send beta end reminder email (May 3, 2026 campaign)
export const sendBetaEndReminderEmail = async (user) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping beta reminder for:', user.email);
    return;
  }

  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Lenzu" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Tu acceso Beta de Lenzu termina en 5 días',
      html: getBetaEndReminderTemplate(user)
    };

    await transporter.sendMail(mailOptions);
    console.log('Beta reminder sent to:', user.email);
  } catch (error) {
    console.error('Error sending beta reminder to', user.email, ':', error);
  }
};

const getBetaEndReminderTemplate = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F2F1F0; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

        <!-- Header -->
        <div style="background-color: #12112a; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 26px;">Tu Beta de Lenzu termina pronto</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #3B3B3B; margin-top: 0;">Hola ${user.name},</h2>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Tu período de acceso completo a Lenzu termina el <strong>8 de mayo</strong>.
          </p>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Durante este tiempo pudiste usar todas las funciones, incluyendo custom branding, proyectos ilimitados y Apple Watch sync.
          </p>

          <!-- Features reminder -->
          <div style="background-color: #F2F1F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <p style="color: #3B3B3B; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Lo que tuviste durante la Beta:</p>
            <ul style="color: #666; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.9;">
              <li>Proyectos ilimitados con timeline del día</li>
              <li>Shot list por categorías</li>
              <li>Colaboradores en tiempo real</li>
              <li>Notificaciones antes de cada momento clave</li>
              <li>Apple Watch sync</li>
              <li>Custom branding (plan Studio)</li>
            </ul>
          </div>

          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Si Lenzu te ha sido útil, este es el momento de elegir tu plan. El plan <strong>Pro</strong> incluye todo lo que necesitas para el día de la boda, y el plan <strong>Studio</strong> agrega custom branding para tu marca.
          </p>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://lenzu.app/pricing"
               style="background-color: #12112a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">
              Ver planes → lenzu.app/pricing
            </a>
          </div>

          <p style="color: #999; font-size: 14px; line-height: 1.6;">
            Si tienes dudas o quieres contarnos cómo te fue en campo, responde directamente a este correo — nos encantaría saber.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #F2F1F0; padding: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} Lenzu · Coordinación para fotógrafos de boda · lenzu.app
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
};

export const sendReengagementEmail = async (user, extendToken) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping reengagement email for:', user.email);
    return;
  }

  try {
    const transporter = createTransporter();
    const extendUrl = `https://lenzu.app/api/auth/extend-plan?token=${extendToken}`;

    const mailOptions = {
      from: `"Alex de Lenzu" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '¿Cómo te fue con Lenzu?',
      html: getReengagementTemplate(user, extendUrl)
    };

    await transporter.sendMail(mailOptions);
    console.log('Reengagement email sent to:', user.email);
  } catch (error) {
    console.error('Error sending reengagement email to', user.email, ':', error);
  }
};

const getReengagementTemplate = (user, extendUrl) => {
  const firstName = user.name ? user.name.split(' ')[0] : 'fotógrafo';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f1ec; margin: 0; padding: 20px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: #12112a; padding: 28px 40px;">
          <p style="color: #f4f1ec; font-size: 22px; letter-spacing: 0.12em; margin: 0; font-family: Georgia, serif;">LENZU</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            Hola ${firstName},
          </p>
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            Hace unas semanas tuviste acceso completo a Lenzu. Quería preguntarte personalmente: ¿tuviste oportunidad de usarla en alguna boda o sesión?
          </p>
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            Si no le diste mucha vuelta todavía, no hay problema — te quiero dar un mes más para que la pruebes con calma, sin compromiso.
          </p>
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
            Solo haz clic abajo y tu cuenta queda activa de nuevo por 30 días con acceso Studio completo.
          </p>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 36px;">
            <a href="${extendUrl}"
               style="display: inline-block; background-color: #12112a; color: #f4f1ec; text-decoration: none; padding: 14px 36px; border-radius: 3px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; letter-spacing: 0.08em;">
              PRUÉBALO UN MES MÁS
            </a>
          </div>

          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 8px;">
            Y si tienes feedback — qué te gustó, qué faltó, qué cambiarías — me encantaría leerlo. Puedes responder directo a este correo.
          </p>
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0;">
            Saludos,<br>
            <strong>Alex</strong><br>
            <span style="font-size: 13px; color: #888;">Lenzu · lenzu.app</span>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f1ec; padding: 20px 40px; text-align: center;">
          <p style="color: #aaa; font-size: 11px; margin: 0; font-family: Arial, sans-serif;">
            © ${new Date().getFullYear()} Lenzu · Coordinación para fotógrafos de boda · lenzu.app
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
};

// Send project (timeline) collaboration invitation
// inviteUrl points to /invite/:token — handles both registered and new users.
// lang: 'en' | 'es' (default) — chosen by the inviting photographer per client.
export const sendProjectInvitationEmail = async (invitedEmail, inviter, timeline, inviteUrl, lang = 'es') => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('Email not configured, skipping project invitation email for:', invitedEmail);
    return;
  }

  // Tracking de apertura: pixel 1×1 servido por el backend (visible en Admin → Correos)
  const trackingId = randomUUID();
  const baseUrl = process.env.FRONTEND_URL || 'https://lenzu.app';
  const trackingPixel = `<img src="${baseUrl}/api/email-track/${trackingId}.png" width="1" height="1" alt="" style="display:block;border:0;" />`;
  const logEmail = (status, error) => {
    EmailLog.create({
      trackingId,
      to: invitedEmail,
      emailType: 'invitation',
      lang,
      timelineId: timeline?._id,
      timelineTitle: timeline?.title,
      sentBy: inviter?._id,
      sentByName: inviter?.name,
      status,
      error
    }).catch(err => console.error('Error logging invitation email:', err));
  };

  try {
    const transporter = createTransporter();
    const en = lang === 'en';
    const inviterName = inviter?.name || (en ? 'A photographer' : 'Un fotógrafo');
    const projectTitle = timeline?.title || (en ? 'a project' : 'un proyecto');

    const subject = en
      ? `${inviterName} invited you to collaborate on Lenzu`
      : `${inviterName} te invitó a colaborar en Lenzu`;

    const text = en
      ? `Hi,

${inviterName} invited you to collaborate on the project "${projectTitle}" on Lenzu.

Lenzu keeps your whole team in sync on the wedding day: day-of timeline, shot list, locations and reminders before each moment.

Open the project here:
${inviteUrl}

If you don't have an account yet, you can create one in seconds and join the project automatically.

— Lenzu · lenzu.app`
      : `Hola,

${inviterName} te invitó a colaborar en el proyecto "${projectTitle}" en Lenzu.

Lenzu mantiene a tu equipo sincronizado el día de la boda: timeline, shot list, locaciones y notificaciones antes de cada momento.

Abre el proyecto aquí:
${inviteUrl}

Si aún no tienes cuenta, podrás crearla en segundos y unirte automáticamente al proyecto.

— Lenzu · lenzu.app`;

    const mailOptions = {
      from: `"Lenzu" <${process.env.EMAIL_USER}>`,
      to: invitedEmail,
      replyTo: inviter?.email || process.env.EMAIL_USER,
      subject,
      text, // Plain-text alternative — reduces spam scoring vs HTML-only emails
      html: getProjectInvitationTemplate(inviter, timeline, inviteUrl, lang) + trackingPixel
    };

    await transporter.sendMail(mailOptions);
    console.log(`Project invitation email sent to: ${invitedEmail} (${lang})`);
    logEmail('sent');
  } catch (error) {
    console.error('Error sending project invitation email to', invitedEmail, ':', error);
    logEmail('failed', error?.message);
    // Don't throw — email failure shouldn't block the invitation flow
  }
};

const getProjectInvitationTemplate = (inviter, timeline, inviteUrl, lang = 'es') => {
  const en = lang === 'en';
  const inviterName = inviter?.name || (en ? 'A photographer' : 'Un fotógrafo');
  const projectTitle = timeline?.title || (en ? 'a project' : 'un proyecto');
  const customFooter = inviter?.branding?.emailFooter;

  const t = en ? {
    greeting: 'Hi,',
    invited: (n, p) => `<strong>${n}</strong> invited you to collaborate on the project <strong>${p}</strong> on Lenzu.`,
    pitch: 'Lenzu keeps the whole team in sync on the wedding day: day-of timeline, shot list, locations and reminders before each moment. Accept the invitation to see the project.',
    cta: 'VIEW THE PROJECT',
    fallback: 'If you don\'t have an account yet, you can create one in seconds and join the project automatically. If the button doesn\'t work, copy and paste this link:',
    footer: 'Coordination for wedding photographers'
  } : {
    greeting: 'Hola,',
    invited: (n, p) => `<strong>${n}</strong> te invitó a colaborar en el proyecto <strong>${p}</strong> en Lenzu.`,
    pitch: 'Lenzu mantiene a todo el equipo sincronizado el día de la boda: timeline del día, shot list, locaciones y notificaciones antes de cada momento. Acepta la invitación para ver el proyecto.',
    cta: 'VER EL PROYECTO',
    fallback: 'Si aún no tienes cuenta, podrás crear una en segundos y unirte automáticamente al proyecto. Si el botón no funciona, copia y pega este enlace:',
    footer: 'Coordinación para fotógrafos de boda'
  };

  let dateLine = '';
  if (timeline?.weddingDate) {
    try {
      const formatted = new Date(timeline.weddingDate).toLocaleDateString(en ? 'en-US' : 'es-MX', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Mexico_City'
      });
      dateLine = `<p style="color: #12112a; font-size: 15px; line-height: 1.7; margin: 0 0 20px;">📅 ${formatted}</p>`;
    } catch (_) { /* invalid date — skip */ }
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Georgia, 'Times New Roman', serif; background-color: #f4f1ec; margin: 0; padding: 20px;">
      <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden;">

        <!-- Header -->
        <div style="background-color: #12112a; padding: 28px 40px;">
          <p style="color: #f4f1ec; font-size: 22px; letter-spacing: 0.12em; margin: 0; font-family: Georgia, serif;">LENZU</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            ${t.greeting}
          </p>
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
            ${t.invited(inviterName, projectTitle)}
          </p>
          ${dateLine}
          <p style="color: #12112a; font-size: 16px; line-height: 1.7; margin: 0 0 32px;">
            ${t.pitch}
          </p>

          <!-- CTA -->
          <div style="text-align: center; margin-bottom: 36px;">
            <a href="${inviteUrl}"
               style="display: inline-block; background-color: #12112a; color: #f4f1ec; text-decoration: none; padding: 14px 36px; border-radius: 3px; font-family: 'DM Sans', Arial, sans-serif; font-size: 14px; letter-spacing: 0.08em;">
              ${t.cta}
            </a>
          </div>

          <p style="color: #888; font-size: 13px; line-height: 1.7; margin: 0;">
            ${t.fallback}<br>
            <a href="${inviteUrl}" style="color: #12112a; word-break: break-all;">${inviteUrl}</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f4f1ec; padding: 20px 40px; text-align: center;">
          <p style="color: #aaa; font-size: 11px; margin: 0; font-family: Arial, sans-serif;">
            ${customFooter ? `${customFooter}<br>` : ''}© ${new Date().getFullYear()} Lenzu · ${t.footer} · lenzu.app
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBetaEndReminderEmail,
  sendReengagementEmail,
  sendProjectInvitationEmail
};
