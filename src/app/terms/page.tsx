import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of Service", description: "The rules for using findMe." };

// Plain-English starting point. Have it reviewed by a Nigerian lawyer and add your registered business details before launch.
export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="23 November 2026"
      intro={
        <p>
          These terms are the agreement between you and findMe when you use our website and services. By creating an account or using findMe, you agree to them.
          Please read them together with our <Link href="/privacy" className="font-semibold text-brand-700">Privacy Policy</Link>.
        </p>
      }
      sections={[
        {
          id: "what",
          title: "What findMe is",
          body: (
            <p>
              findMe is a marketplace brought to you by Radius Technology (&ldquo;we&rdquo;, &ldquo;us&rdquo;) that helps clients find independent professionals and contact them. Professionals are not employees or agents of findMe.
              Any agreement for work — price, timing, quality and payment — is between the client and the professional. findMe is not a party to that agreement.
            </p>
          ),
        },
        {
          id: "accounts",
          title: "Your account",
          body: (
            <ul>
              <li>You must be 18 or older and give accurate information, including a real email address and phone number.</li>
              <li>If you verify your ID, the NIN must be your own. Using someone else&apos;s NIN leads to removal.</li>
              <li>Keep your password secret. You&apos;re responsible for activity on your account.</li>
              <li>One person, one account. Don&apos;t impersonate anyone or create accounts for others without permission.</li>
            </ul>
          ),
        },
        {
          id: "pros",
          title: "If you offer services",
          body: (
            <ul>
              <li>Describe your skills, experience, prices and availability honestly.</li>
              <li>Hold any licences or permits your work requires, and follow the law, including tax obligations.</li>
              <li>Reply to requests promptly and do the work you agree to, to a professional standard.</li>
            </ul>
          ),
        },
        {
          id: "clients",
          title: "If you hire",
          body: (
            <ul>
              <li>Describe the job clearly and honestly, and treat professionals with respect.</li>
              <li>Agree price and timing in findMe chat so there&apos;s a record.</li>
              <li>Pay what you agreed, once you&apos;re satisfied the agreed work has been done.</li>
            </ul>
          ),
        },
        {
          id: "conduct",
          title: "What's not allowed",
          body: (
            <ul>
              <li>Scams or fraud, including asking for money upfront under false pretences or pressuring anyone to pay outside an agreement.</li>
              <li>Harassment, threats, hate speech, or sharing someone&apos;s personal information without consent.</li>
              <li>Illegal services, fake profiles, fake reviews, or reviews in exchange for payment.</li>
              <li>Spam, scraping, or trying to access accounts or systems that aren&apos;t yours.</li>
            </ul>
          ),
        },
        {
          id: "reviews",
          title: "Reviews and reports",
          body: (
            <p>
              Only clients who completed a job through findMe can review it. Reviews must be honest and about your own experience. You can report anyone from their profile or a
              conversation; we review reports and may hide profiles that several people report while we investigate.
            </p>
          ),
        },
        {
          id: "suspension",
          title: "Suspension and closing accounts",
          body: (
            <p>
              We may limit, suspend or close accounts that break these terms or put others at risk, and remove content that does. You can delete your account at any time in{" "}
              <Link href="/dashboard/settings">Account settings</Link>.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Our responsibility",
          body: (
            <>
              <p>
                We work hard to keep findMe safe and available, but we can&apos;t guarantee the work, conduct or identity of any user, and findMe is provided &ldquo;as is&rdquo;.
                To the extent the law allows, findMe isn&apos;t liable for losses arising from agreements or dealings between users.
              </p>
              <p>Nothing in these terms limits rights you have under Nigerian consumer protection law that can&apos;t be limited.</p>
            </>
          ),
        },
        {
          id: "law",
          title: "Law and disputes",
          body: (
            <p>
              These terms are governed by the laws of the Federal Republic of Nigeria. If you have a complaint, please <Link href="/contact">contact us</Link> first — most issues
              can be resolved quickly.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes",
          body: <p>We may update these terms. If changes are significant we&apos;ll tell you in the app or by email; continuing to use findMe means you accept them.</p>,
        },
      ]}
    />
  );
}
