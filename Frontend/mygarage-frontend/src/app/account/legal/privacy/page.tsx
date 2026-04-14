import { LegalDocumentShell, LegalSection } from "@/components/LegalDocumentShell";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentShell 
      title="Privacy Policy" 
      subtext="Data Protection & Privacy Standards"
      lastUpdated="8 April 2026"
    >
      <LegalSection title="1. Data Collection">
        <p>
          We collect information necessary to provide the automotive management features of Autofolio. This includes vehicle metadata (VIN, make, model), maintenance records, odometer readings, uploaded documents (PDFs, images), and account profile details.
        </p>
      </LegalSection>

      <LegalSection title="2. How We Use Data">
        <p>
          Your data is used to calculate service intervals, generate maintenance alerts, display your vehicle history, and provide a secure digital vault for your automotive documents. We do not sell your personal vehicle data to third parties.
        </p>
      </LegalSection>

      <LegalSection title="3. Storage & Security">
        <p>
          We employ industry-standard encryption and security measures to protect your data. All uploaded media and documents are stored in secure cloud environments with strictly controlled access.
        </p>
      </LegalSection>

      <LegalSection title="4. Authentication">
        <p>
          We utilize secure third-party authentication services (e.g., Google, Github via NextAuth) to verify your identity. We do not store your passwords directly on our servers.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Sharing">
        <p>
          We only share data with essential infrastructure providers (e.g., database hosts, storage providers) required to operate the Service. We may disclose information if required by law or to protect the safety and rights of our users.
        </p>
      </LegalSection>

      <LegalSection title="6. User Rights">
        <p>
          You have the right to access, correct, or delete your data at any time through the application interface. You may export your vehicle history for your own records.
        </p>
      </LegalSection>

      <LegalSection title="7. Cookies & Local Storage">
        <p>
          We use local storage and essential cookies to maintain your session preferences (such as distance units) and ensure a seamless login experience.
        </p>
      </LegalSection>

      <LegalSection title="8. Retention">
        <p>
          We retain your data as long as your account is active. Upon account deletion, your data will be permanently removed from our active production databases, subject to standard backup rotation cycles.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For privacy-related inquiries or data protection requests, please reach out through our official support channels.
        </p>
      </LegalSection>
    </LegalDocumentShell>
  );
}
