import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./components/email-layout";

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
}

export default function PasswordResetEmail({ name, resetUrl }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your PawDrop password">
      <Text style={styles.heading}>Reset your password</Text>
      <Text style={styles.paragraph}>Hi {name.split(" ")[0]},</Text>
      <Text style={styles.paragraph}>
        We received a request to reset your PawDrop password. Click below to choose a new one.
        This link expires in 1 hour.
      </Text>
      <Button href={resetUrl} style={styles.button}>
        Reset password
      </Button>
      <Text style={{ ...styles.paragraph, fontSize: "13px", marginTop: "20px" }}>
        If you didn&apos;t request this, you can ignore this email — your password won&apos;t
        change.
      </Text>
    </EmailLayout>
  );
}
