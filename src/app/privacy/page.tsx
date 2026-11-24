import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy Policy", description: "How findMe collects, uses and protects your personal data." };

// Plain-English starting point written for the Nigeria Data Protection Act 2023.
// Have it reviewed by a Nigerian lawyer and add your registered business details before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="24 November 2026"
      intro={
        <p>
          findMe is brought to you by Radius Technology (&ldquo;we&rdquo;, &ldquo;us&rdquo;), which is responsible for your personal data on findMe.
          findMe connects people who need things done with skilled professionals across Nigeria. This policy explains what personal data we collect, why,
          who can see it, and the rights you have under the Nigeria Data Protection Act 2023 (NDPA).
        </p>
      }
      sections={[
        {
          id: "what",
          title: "What we collect",
          body: (
            <ul>
              <li><strong>Account details:</strong> your name, email address and password (passwords are handled by Google Firebase Authentication — we never see or store them).</li>
              <li><strong>Contact number:</strong> the phone or business line you add, and whether it&apos;s on WhatsApp.</li>
              <li><strong>Profile:</strong> photo, headline, bio, location, category, skills, rates and services (professionals).</li>
              <li><strong>NIN (optional):</strong> if you choose to verify your ID, your National Identification Number, used once to confirm it — see <a href="#nin">Identity checks</a>.</li>
              <li><strong>Activity:</strong> requests, messages, job status, reviews and ratings, reports and blocks.</li>
              <li><strong>Support:</strong> anything you send through our contact form.</li>
            </ul>
          ),
        },
        {
          id: "why",
          title: "Why we use it",
          body: (
            <ul>
              <li>To run your account and let clients and professionals find and contact each other (performance of our agreement with you).</li>
              <li>To send you alerts about requests, messages and reviews, and important account emails.</li>
              <li>To keep findMe safe — verifying emails, preventing spam, investigating reports and removing fraudulent accounts (our legitimate interest and legal obligations).</li>
              <li>To improve findMe, using information in aggregate.</li>
            </ul>
          ),
        },
        {
          id: "nin",
          title: "Identity checks (NIN)",
          body: (
            <>
              <p>
                Anyone on findMe can choose to verify their identity with their NIN. It&apos;s optional, and it earns an &ldquo;ID verified&rdquo; badge
                (professionals also rank higher in search). It helps protect people from fake and impersonated accounts.
              </p>
              <ul>
                <li>We send your NIN to our verification provider, <strong>Dojah</strong>, which checks it against the National Identity Management Commission (NIMC) record.</li>
                <li>We only use the result to confirm the record exists and that its name matches your findMe name. We don&apos;t keep your photo, date of birth or any other NIMC details.</li>
                <li>We <strong>never store your full NIN</strong>. We keep the last 4 digits and a one-way fingerprint so the same NIN can&apos;t back two accounts.</li>
                <li>Your NIN is never shown to anyone, including other users. Profiles only show an &ldquo;ID verified&rdquo; badge.</li>
                <li>Deleting your account deletes these records.</li>
              </ul>
            </>
          ),
        },
        {
          id: "sharing",
          title: "Who can see your information",
          body: (
            <>
              <ul>
                <li><strong>Everyone:</strong> a professional&apos;s public profile — name, photo, headline, bio, location, skills, services, rates, rating and reviews.</li>
                <li><strong>Only after a request is accepted:</strong> your phone number, and only to the other person on that job — unless a professional chooses to show their business line publicly.</li>
                <li><strong>Never public:</strong> your email address, password and private messages.</li>
                <li><strong>Service providers</strong> who process data for us under contract: Google Firebase (hosting, sign-in and database, stored in the European Union), Dojah (optional NIN checks) and our email provider for alerts.</li>
              </ul>
              <p>We don&apos;t sell your personal data. We may disclose information if the law requires it or to protect users from fraud or harm.</p>
            </>
          ),
        },
        {
          id: "retention",
          title: "How long we keep it",
          body: (
            <p>
              We keep your data while your account is open. When you delete your account, your profile, phone number, skills, services and notifications are removed
              immediately. Conversations you took part in stay available to the other person, shown as &ldquo;findMe user&rdquo;, because they&apos;re part of their record of a job.
              Reports may be kept for as long as needed to protect the community.
            </p>
          ),
        },
        {
          id: "rights",
          title: "Your rights",
          body: (
            <>
              <p>Under the NDPA you can:</p>
              <ul>
                <li>Access and correct your data — most of it is editable in <Link href="/dashboard/profile">Profile &amp; skills</Link>.</li>
                <li>Delete your account and data at any time in <Link href="/dashboard/settings">Account settings</Link>.</li>
                <li>Object to or restrict certain processing, withdraw consent, or ask for a copy of your data.</li>
                <li>Complain to the Nigeria Data Protection Commission (NDPC) if you believe we&apos;ve mishandled your data.</li>
              </ul>
              <p>
                To exercise any of these, <Link href="/contact">contact us</Link>. We&apos;ll respond within the time the law requires.
              </p>
            </>
          ),
        },
        {
          id: "security",
          title: "Security",
          body: (
            <p>
              Data travels over encrypted connections and is stored with Google Firebase. Browsers can&apos;t read our database directly — everything goes through our
              server, which checks who you are first. No system is perfectly secure, so please use a strong, unique password and never share OTPs or bank PINs with anyone.
            </p>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: <p>findMe is for people aged 18 and over. We don&apos;t knowingly collect data from children; if you believe a child has an account, please tell us.</p>,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: <p>If we make important changes, we&apos;ll update the date above and let you know in the app or by email.</p>,
        },
      ]}
    />
  );
}
