import { Link } from "wouter";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex space-x-6">
            <Link href="/carbon-offset">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">Carbon Offset</span>
            </Link>
            <Link href="/terms">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">Terms & Conditions</span>
            </Link>
            <Link href="/privacy">
              <span className="text-sm text-primary hover:text-primary/80 cursor-pointer">Privacy Policy</span>
            </Link>
          </div>
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Solstice Navigator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
