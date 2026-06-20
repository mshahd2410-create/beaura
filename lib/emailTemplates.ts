export function brideWelcomeEmail(firstName: string) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to Beaura 💜</h2>

      <p>Hi ${firstName},</p>

      <p>
        Congratulations on creating your Beaura account.
      </p>

      <p>
        You can now discover makeup artists, manage bookings,
        and prepare for your special day.
      </p>

      <p>
        Thank you for joining Beaura.
      </p>

      <p>
        — The Beaura Team
      </p>
    </div>
  `;
}

export function muaWelcomeEmail(firstName: string) {
  return `
    <div style="font-family: Arial, sans-serif;">
      <h2>Welcome to Beaura 💜</h2>

      <p>Hi ${firstName},</p>

      <p>
        Your account has been created successfully.
      </p>

      <p>
        Your profile is currently under review by the Beaura team.
      </p>

      <p>
        Please expect a review decision within 48 hours.
      </p>

      <p>
        — The Beaura Team
      </p>
    </div>
  `;
}