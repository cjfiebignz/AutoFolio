import { LegalDocumentShell, LegalSection } from "@/components/LegalDocumentShell";

export default function DPAPage() {
  return (
    <LegalDocumentShell 
      title="Data Processing Agreement" 
      subtext="Data Privacy & Processing Standards"
      lastUpdated="8 April 2026"
    >
      <LegalSection title="1. Roles & Scope">
        <p>
          This Data Processing Agreement ("DPA") applies to the processing of personal data by Autofolio on behalf of its users. For the purposes of this document, the user is the Data Controller, and Autofolio is the Data Processor.
        </p>
      </LegalSection>

      <LegalSection title="2. Data Categories">
        <p>
          We process automotive ownership data, maintenance history, identification documents, and account metadata. This processing is performed solely to provide the contracted services.
        </p>
      </LegalSection>

      <LegalSection title="3. Processing Activities">
        <p>
          Autofolio will process data only on documented instructions from the user, including for the transfer of personal data to a third country, unless required by law.
        </p>
      </LegalSection>

      <LegalSection title="4. Security Measures">
        <p>
          We implement technical and organizational measures to ensure a level of security appropriate to the risk, including encryption of data at rest and in transit, and regular security assessments.
        </p>
      </LegalSection>

      <LegalSection title="5. Subprocessors">
        <p>
          The user grants general authorization for Autofolio to engage subprocessors (e.g., cloud infrastructure providers) to support the delivery of the Service. We maintain a list of active subprocessors and ensure they are bound by equivalent data protection obligations.
        </p>
      </LegalSection>

      <LegalSection title="6. Breach Handling">
        <p>
          In the event of a confirmed data breach, Autofolio will notify the affected users without undue delay and provide relevant details to assist the user in their own notification obligations.
        </p>
      </LegalSection>

      <LegalSection title="7. Deletion & Return">
        <p>
          Upon termination of the Service, Autofolio will delete or return all personal data to the user, except where retention is required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="8. Compliance Principles">
        <p>
          We adhere to fundamental data processing principles, including purpose limitation, data minimization, accuracy, and storage limitation.
        </p>
      </LegalSection>
    </LegalDocumentShell>
  );
}
