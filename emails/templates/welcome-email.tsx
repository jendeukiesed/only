import { Button, Text } from "@react-email/components";
import { EmailLayout, styles } from "./components/email-layout";

interface WelcomeEmailProps {
  name: string;
  role: "BUYER" | "SELLER";
  dashboardUrl: string;
}

export default function WelcomeEmail({ name, role, dashboardUrl }: WelcomeEmailProps) {
  const isBuyer = role === "BUYER";
  return (
    <EmailLayout preview="Your PawDrop account is ready">
      <Text style={styles.heading}>You&apos;re in, {name.split(" ")[0]} 🐾</Text>
      <Text style={styles.paragraph}>
        {isBuyer
          ? "Your account comes with a starter balance of points — enough to unlock your first few mystery photos. Every unlock reveals a random photo from the tier you pick, scored by our AI for cuteness, composition, and more."
          : "You're ready to upload. Every photo you submit gets an AI score (cuteness, composition, lighting, emotion, and more) with a suggested price — our team reviews it, and once approved it goes live in the marketplace for buyers to unlock."}
      </Text>
      <Button href={dashboardUrl} style={styles.button}>
        {isBuyer ? "Browse the marketplace" : "Upload your first photo"}
      </Button>
    </EmailLayout>
  );
}
