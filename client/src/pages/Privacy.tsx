import React from 'react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const Privacy = () => {
  // Get current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="container py-8 max-w-4xl content-container">
      <div className="flex justify-between items-start mb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
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
          <h2>Introduction</h2>
          <p>
            Welcome to the Solstice Navigator Privacy Policy. Your privacy is critically important to us, and we are committed to being transparent about how we collect, use, and share your information.
          </p>
          <p>
            This Privacy Policy applies to information we collect when you use our website and services. It explains how we collect, use, store, protect, and share your personal information.
          </p>
          <p>
            By using Solstice Navigator, you agree to the collection and use of information in accordance with this policy. If you do not agree with any part of this policy, please do not use our services.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <section className="mb-8">
          <h2>Information We Collect</h2>
          <p>We collect several types of information from and about users of our website:</p>
          
          <h3>Information You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and profile picture through our authentication provider.</li>
            <li><strong>Flight Information:</strong> Data you input about your flights, including departure and arrival airports, dates, airlines, aircraft types, and any tags you add.</li>
            <li><strong>Carbon Offset Information:</strong> If you record carbon offset purchases, we collect information about the provider, date, and amount.</li>
            <li><strong>Communications:</strong> If you contact us directly, we may receive additional information about you, such as your name, email address, and the contents of your message.</li>
          </ul>
          
          <h3>Information We Collect Automatically</h3>
          <ul>
            <li><strong>Usage Information:</strong> We collect information about your interactions with our website, such as the pages or content you view and the dates and times of your visits.</li>
            <li><strong>Device Information:</strong> We collect information about the device you use to access our services, including IP address, browser type, operating system, and device identifiers.</li>
            <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect for various purposes, including to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Calculate and track your flight carbon footprint</li>
            <li>Personalize your experience and provide content that interests you</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Send you technical notices, updates, security alerts, and support and administrative messages</li>
            <li>Communicate with you about services, offers, and promotions</li>
            <li>Monitor and analyze trends, usage, and activities in connection with our website</li>
            <li>Detect, investigate, and prevent security incidents and other malicious, deceptive, fraudulent, or illegal activity</li>
            <li>Debug to identify and repair errors in our website's operation</li>
            <li>Protect the rights, property, and safety of our users and others</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2>Sharing Your Information</h2>
          <p>We do not sell your personal information to third parties. We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>With Service Providers:</strong> We may share your information with third-party vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</li>
            <li><strong>For Legal Reasons:</strong> We may disclose information if we believe it is necessary to comply with any applicable law, regulation, legal process, or governmental request.</li>
            <li><strong>With Your Consent:</strong> We may share information with your consent or at your direction.</li>
            <li><strong>In Connection with a Transfer of Assets:</strong> If we are involved in a merger, acquisition, bankruptcy, reorganization, or sale of all or a portion of our assets, your information may be sold or transferred as part of that transaction.</li>
          </ul>
        </section>
        
        <section className="mb-8">
          <h2>Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the Internet or data storage system can be guaranteed to be 100% secure.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Your Rights and Choices</h2>
          <p>You have certain rights and choices regarding your personal information:</p>
          <ul>
            <li><strong>Account Information:</strong> You can update your account information at any time by accessing your account settings.</li>
            <li><strong>Flight Data:</strong> You can view, edit, and delete your flight entries through the website interface.</li>
            <li><strong>Marketing Communications:</strong> You can opt out of receiving marketing emails from us by following the instructions in those emails.</li>
            <li><strong>Cookies:</strong> Most web browsers are set to accept cookies by default. You can usually choose to set your browser to remove or reject cookies.</li>
          </ul>
          <p>
            Depending on your location, you may have additional rights under applicable law, such as the right to access, correct, delete, or restrict processing of your personal information.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Data Retention</h2>
          <p>
            We store your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need to use your information, we will remove it from our systems or anonymize it so that it no longer identifies you.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Children's Privacy</h2>
          <p>
            Our services are not directed to children under 16, and we do not knowingly collect personal information from children under 16. If we learn that we have collected personal information from a child under 16, we will promptly delete that information.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. If we make material changes, we will notify you through the website or by other means, such as email. We encourage you to review the Privacy Policy whenever you access our services.
          </p>
        </section>
        
        <section className="mb-8">
          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our privacy practices, please contact us at privacy@solsticenavigator.com.
          </p>
        </section>
        
        <Separator className="my-8" />
        
        <footer className="text-muted-foreground text-sm">
          <p>© {currentYear} Solstice Navigator. All rights reserved.</p>
          <div className="mt-4 flex gap-4">
            <Link href="/" className="text-primary hover:underline">Home</Link>
            <Link href="/terms" className="text-primary hover:underline">Terms & Conditions</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Privacy;