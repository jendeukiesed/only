import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./components/email-layout";

interface VerificationEmailProps {
  name: string;
  verificationUrl: string;
}

export default function VerificationEmail({ name, verificationUrl }: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your email to start using PawDrop">
      <Text style={styles.heading}>Confirm your email</Text>
      <Text style={styles.paragraph}>Hi {name.split(" ")[0]},</Text>
      <Text style={styles.paragraph}>
        Welcome to PawDrop! Confirm your email address to activate your account and start
        collecting (or uploading) dog photos.
      </Text>
      <Button href={verificationUrl} style={styles.button}>
        Verify email
      </Button>
      <Text style={{ ...styles.paragraph, fontSize: "13px", marginTop: "20px" }}>
        This link expires in 24 hours. If you didn&apos;t create a PawDrop account, you can
        safely ignore this email.
      </Text>
    </EmailLayout>
  );
}
