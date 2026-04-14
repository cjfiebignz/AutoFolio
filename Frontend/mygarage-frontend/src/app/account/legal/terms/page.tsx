import { LegalDocumentShell, LegalSection } from "@/components/LegalDocumentShell";

export default function TermsOfServicePage() {
  return (
    <LegalDocumentShell 
      title="Terms of Service" 
      subtext="Platform Usage & Member Agreement"
      lastUpdated="8 April 2026"
    >
      <LegalSection title="1. Service Overview">
        <p>
          Autofolio (the "Service") provides a digital platform for automotive documentation, maintenance tracking, and portfolio management. By accessing or using the Service, you agree to be bound by these Terms of Service.
        </p>
      </LegalSection>

      <LegalSection title="2. User Responsibilities">
        <p>
          You are responsible for maintaining the accuracy of the data you input into the Service. You must ensure that you have the legal right to upload any documents, photos, or metadata associated with the vehicles in your collection.
        </p>
        <p>
          The Service is intended for lawful personal and commercial automotive management. Any misuse of the platform, including unauthorized access to other accounts or data corruption, is strictly prohibited.
        </p>
      </LegalSection>

      <LegalSection title="3. Account & Authentication">
        <p>
          We use secure authentication providers to manage access to your account. You are responsible for maintaining the confidentiality of your session and must notify us immediately of any unauthorized use of your account.
        </p>
      </LegalSection>

      <LegalSection title="4. Data Ownership">
        <p>
          You retain full ownership of the automotive data, records, and media you upload to Autofolio. By using the Service, you grant Autofolio a limited, non-exclusive license to process and display this data solely for the purpose of providing the Service to you.
        </p>
      </LegalSection>

      <LegalSection title="5. Service Availability">
        <p>
          While we strive for 100% uptime, the Service is provided "as is" and "as available". We reserve the right to modify, suspend, or discontinue any part of the Service at any time without prior notice for maintenance or updates.
        </p>
      </LegalSection>

      <LegalSection title="6. Limitation of Liability">
        <p>
          Autofolio is a technical documentation tool. We are not responsible for the mechanical condition of your vehicles, the accuracy of third-party service provider data, or any loss resulting from reliance on the information stored within the Service.
        </p>
      </LegalSection>

      <LegalSection title="7. Termination">
        <p>
          You may terminate your account at any time. Autofolio reserves the right to suspend or terminate access for users who violate these terms or engage in behavior that threatens the integrity of the platform.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes to Terms">
        <p>
          We may update these terms as the platform evolves. Significant changes will be communicated via the application interface. Continued use of Autofolio following an update constitutes acceptance of the new terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For inquiries regarding these terms, please contact our support team through the official platform channels.
        </p>
      </LegalSection>
    </LegalDocumentShell>
  );
}
