import nodemailer from 'nodemailer';

// Create transporter using Gmail
const createTransporter = () => {
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

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendBetaEndReminderEmail
};
