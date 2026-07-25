import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import type { ReactNode } from "react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://pawdrop.app";

export function EmailLayout({ preview, children }: { preview: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.header}>
            <Text style={styles.logo}>🐾 PawDrop</Text>
          </Section>
          <Section style={styles.content}>{children}</Section>
          <Hr style={styles.hr} />
          <Section>
            <Text style={styles.footer}>
              PawDrop · Internal points only, no real-money payments.
              <br />
              <Link href={APP_URL} style={styles.footerLink}>
                {APP_URL.replace(/^https?:\/\//, "")}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const styles = {
  body: {
    backgroundColor: "#f5f5f7",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: 0,
    padding: "40px 0",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    margin: "0 auto",
    maxWidth: "480px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: {
    padding: "32px 32px 0",
  },
  logo: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  content: {
    padding: "24px 32px 32px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#111827",
    margin: "0 0 12px",
  },
  paragraph: {
    fontSize: "15px",
    lineHeight: "24px",
    color: "#4b5563",
    margin: "0 0 16px",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: "10px",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    padding: "14px 24px",
  },
  code: {
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "8px",
    color: "#111827",
    textAlign: "center" as const,
    margin: "24px 0",
    fontFamily: "monospace",
  },
  hr: {
    borderColor: "#e5e7eb",
    margin: "0 32px",
  },
  footer: {
    fontSize: "12px",
    lineHeight: "18px",
    color: "#9ca3af",
    padding: "16px 32px 24px",
    margin: 0,
  },
  footerLink: {
    color: "#9ca3af",
    textDecoration: "underline",
  },
};
