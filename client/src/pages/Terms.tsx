import React from 'react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const Terms = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="container py-8 max-w-4xl content-container">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
          <p className="text-muted-foreground">Last updated: May 16, 2025</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2>Welcome to Solstice Navigator</h2>
          <p>
            These terms and conditions outline the rules and regulations for the use of Solstice Navigator.
            By accessing this website, we assume you accept these terms and conditions in full. Do not continue
            to use Solstice Navigator if you do not accept all of the terms and conditions stated on this page.
          </p>
          <p>
            The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice,
            and any or all Agreements: "Client", "You" and "Your" refers to you, the person accessing this website
            and accepting the Company's terms and conditions. "The Company", "Ourselves", "We", "Our" and "Us", refers
            to Solstice Navigator. "Party", "Parties", or "Us", refers to both the Client and ourselves, or either the Client
            or ourselves.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-8">
          <h2>License</h2>
          <p>
            Unless otherwise stated, Solstice Navigator and/or its licensors own the intellectual property rights for
            all material on Solstice Navigator. All intellectual property rights are reserved. You may view and/or print
            pages from the website for your own personal use subject to restrictions set in these terms and conditions.
          </p>
          <p>You must not:</p>
          <ul>
            <li>Republish material from this website</li>
            <li>Sell, rent or sub-license material from this website</li>
            <li>Reproduce, duplicate or copy material from this website</li>
            <li>Redistribute content from Solstice Navigator (unless content is specifically made for redistribution)</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2>User Account</h2>
          <p>
            If you create an account on the website, you are responsible for maintaining the security of your account and
            you are fully responsible for all activities that occur under the account. You must immediately notify us of
            any unauthorized uses of your account or any other breaches of security. We will not be liable for any acts
            or omissions by you, including any damages of any kind incurred as a result of such acts or omissions.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Flight Data</h2>
          <p>
            Solstice Navigator allows you to track your flights and visualize your air travel data. The information you
            input is stored in our database and is subject to our Privacy Policy. You retain all rights to the data you
            input into the system.
          </p>
          <p>
            We strive to calculate carbon footprints with the highest accuracy possible, but acknowledge that all carbon
            calculations are estimates based on available data and the current understanding of aviation emissions. These
            calculations should be treated as approximations and not exact measurements.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Carbon Offset Information</h2>
          <p>
            Solstice Navigator provides information about carbon offset providers as a convenience to our users. We do not
            receive any commission or financial benefit from these providers. The information is provided "as is" and we
            make no warranties, either express or implied, concerning the accuracy, completeness, reliability, or suitability
            of the information.
          </p>
          <p>
            We encourage users to conduct their own research before purchasing carbon offsets. The inclusion of any provider
            on our website does not constitute an endorsement or recommendation by Solstice Navigator.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Content Liability</h2>
          <p>
            We shall not be responsible for any content that appears on your website. You agree to protect and defend us
            against all claims that are rising on your website. No link(s) should appear on any website that may be
            interpreted as libelous, obscene, or criminal, or which infringes, otherwise violates, or advocates the
            infringement or other violation of, any third party rights.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Disclaimer</h2>
          <p>
            To the maximum extent permitted by applicable law, we exclude all representations, warranties, and conditions
            relating to our website and the use of this website (including, without limitation, any warranties implied by
            law in respect of satisfactory quality, fitness for purpose and/or the use of reasonable care and skill).
          </p>
          <p>Nothing in this disclaimer will:</p>
          <ul>
            <li>Limit or exclude our or your liability for death or personal injury resulting from negligence</li>
            <li>Limit or exclude our or your liability for fraud or fraudulent misrepresentation</li>
            <li>Limit any of our or your liabilities in any way that is not permitted under applicable law</li>
            <li>Exclude any of our or your liabilities that may not be excluded under applicable law</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2>Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. If we make changes to these terms, we will post the
            revised terms on the website and update the "Last Updated" date at the top of these terms. We encourage you
            to check the terms periodically for any changes. In some cases, we may notify you of changes through email.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Contact Information</h2>
          <p>
            If you have any questions about these Terms and Conditions, please contact us at support@solsticenavigator.com.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <footer className="text-muted-foreground text-sm">
          <p>© {currentYear} Solstice Navigator. All rights reserved.</p>
          <div className="mt-4 flex gap-4">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Terms;