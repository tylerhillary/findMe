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
      updated="26 November 2026"
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
              findMe is a service brought to you by Radius Technology (&ldquo;we&rdquo;, &ldquo;us&rdquo;). Clients tell findMe what they need, we agree a price with them, take
              their payment, and send an independent professional to do the job. Professionals are not employees or agents of findMe; they choose which jobs to accept and do
              the work themselves.
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
              <li>When findMe gives you a job, contact the client promptly and do the work to a professional standard.</li>
              <li>findMe may ask whether you&apos;ll do a job for less when a client makes an offer. You can say no.</li>
            </ul>
          ),
        },
        {
          id: "clients",
          title: "If you hire",
          body: (
            <ul>
              <li>Describe the job clearly and honestly, and treat professionals with respect.</li>
              <li>Pay findMe the price we agree with you. Never pay a professional directly for a job arranged through findMe.</li>
              <li>Confirm on findMe when the job is done, or tell us if it isn&apos;t. If you don&apos;t answer within 3 days of the professional marking it done, it&apos;s treated as confirmed.</li>
            </ul>
          ),
        },
        {
          id: "payments",
          title: "Payments and findMe's fee",
          body: (
            <ul>
              <li>Clients pay findMe for each job. We hold the payment and pay the professional after the client confirms the job is done (or it&apos;s confirmed automatically after 3 days).</li>
              <li>findMe keeps 3% of the price the client pays. The professional receives the other 97%. Professionals can see this on every job.</li>
              <li>If a job is cancelled after you paid, or the work isn&apos;t done, <Link href="/contact">contact us</Link> and we&apos;ll look into a refund.</li>
            </ul>
          ),
        },
        {
          id: "no-bypass",
          title: "Keeping jobs on findMe",
          body: (
            <>
              <p>findMe only works if jobs we arrange stay on findMe. If you&apos;re a professional, for clients findMe sends you:</p>
              <ul>
                <li>Don&apos;t give them your phone number, social media or other contact details, and hide your number when you call (dial #31# first).</li>
                <li>Don&apos;t ask them to contact you directly or to book you outside findMe, now or for 12 months after the job.</li>
                <li>Don&apos;t take payment from them for any work, whether for the findMe job or anything else they ask you to do. Tell them to request it through findMe.</li>
              </ul>
              <p>
                Clients: please book professionals you met on findMe through findMe. If a professional asks you to pay them directly or to deal with them outside findMe,
                please report it. It protects your money.
              </p>
              <p>
                Breaking these rules can lead to your account being suspended or closed, and any of your open jobs being given to someone else.
              </p>
            </>
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
              Only clients whose job was completed through findMe can review it. Reviews must be honest and about your own experience. You can report anyone from their profile or a
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
                To the extent the law allows, findMe isn&apos;t liable for losses caused by a user&apos;s own conduct, and our total liability for a job is limited to the amount
                paid to findMe for it.
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
