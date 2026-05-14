import React from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Twitter,
  Facebook,
  Instagram,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  const developerName = "Alex Jordan";
  const developerProfileUrl = "/developers/alex-jordan";

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="container mx-auto px-4">
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-12">
          {/* Brand Info */}
          <div className="col-span-1 md:col-span-4 space-y-6">
            <h3 className="text-3xl font-extrabold">Your Brand</h3>
            <p className="text-sm max-w-xs text-gray-400">
              Innovating at the intersection of design and technology to deliver
              exceptional products worldwide.
            </p>

            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <MapPin
                  size={18}
                  className="text-primary mt-0.5 mr-3 flex-shrink-0"
                />
                <span>123 Main Street, Suite 456, City, State 90210</span>
              </div>
              <div className="flex items-center">
                <Phone size={18} className="text-primary mr-3" />
                <a
                  href="tel:+1-555-555-5555"
                  className="hover:text-white transition-colors"
                >
                  (555) 555-5555
                </a>
              </div>
              <div className="flex items-center">
                <Mail size={18} className="text-primary mr-3" />
                <a
                  href="mailto:contact@yourbrand.com"
                  className="hover:text-white transition-colors"
                >
                  contact@yourbrand.com
                </a>
              </div>
            </div>

            <div className="flex space-x-5 pt-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-400 hover:text-primary-500 transition-colors"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div className="col-span-1 sm:col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-5 border-b border-gray-700 pb-2">
              Company
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm">
              {["About Us", "Careers", "Press & Media", "Our Blog"].map(
                (text, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/${text.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex items-center hover:text-white transition-colors"
                    >
                      <ChevronRight
                        size={16}
                        className="text-primary-500 mr-2"
                      />
                      {text}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1 sm:col-span-1 md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-5 border-b border-gray-700 pb-2">
              Support
            </h3>
            <ul className="space-y-2 sm:space-y-3 text-sm">
              {["FAQ", "Shipping & Returns", "Help Center", "Legal"].map(
                (text, idx) => (
                  <li key={idx}>
                    <Link
                      href={`/${text.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex items-center hover:text-white transition-colors"
                    >
                      <ChevronRight
                        size={16}
                        className="text-primary-500 mr-2"
                      />
                      {text}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1 sm:col-span-2 md:col-span-4">
            <h3 className="text-lg font-bold text-white mb-5 border-b border-gray-700 pb-2">
              Stay Connected
            </h3>
            <p className="text-sm mb-5 text-gray-400">
              Join our mailing list to receive product updates, exclusive
              offers, and industry insights.
            </p>
            <form className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 h-12 bg-gray-800 text-white border-gray-700 placeholder:text-gray-500 focus:border-primary-600 focus:ring-1 focus:ring-primary-600"
              />
              <Button
                type="submit"
                className="bg-primary h-12 font-semibold text-white w-full sm:w-auto px-6 transition-colors"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-gray-700 text-center text-sm text-gray-500 space-y-3 sm:space-y-0 sm:flex sm:flex-col sm:items-center">
          <p>
            &copy; {new Date().getFullYear()} Your Company Name. All rights
            reserved.
          </p>
          <div className="mt-2 sm:mt-1 space-x-4 text-xs font-medium flex flex-wrap justify-center gap-2">
            {["Terms of Service", "Privacy Policy", "Cookie Preferences"].map(
              (text, idx) => (
                <React.Fragment key={idx}>
                  <Link
                    href={`/${text.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-white transition-colors"
                  >
                    {text}
                  </Link>
                  {idx < 2 && <span className="text-gray-700">|</span>}
                </React.Fragment>
              )
            )}
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-700">
          <p>
            Developed with 💜 by
            <Link
              href={developerProfileUrl}
              className="ml-1 text-primary hover:text-primary-300 transition-colors"
            >
              {developerName}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
