import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rijal Decors Valley</h3>
            <p className="text-gray-600 mb-4">
              Rijal Decors & Interior Pvt. Ltd specializes in home and office decor, offering a range of resin sculptures and figurines such as deer, elephants, eagles, chef holders, and stock market bull and bear sets. Products are marketed for both aesthetic and gifting purposes, with items like welcome sign boards and wine holders indicating a focus on decorative utility. The company operates daily from 9:00 to 17:00. While specific customer reviews and ratings are not available in the provided context, the product lineup suggests an emphasis on affordable, artistic decor with some items priced as low as NPR 999. There is no information on customer service quality or delivery options.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-gray-600 hover:text-gray-900">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-gray-900">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-gray-900">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-400 text-sm">
            © 2024 Rijal Decors Valley. All rights reserved. Powered by Sanam International PVT LTD.
          </p>
        </div>
      </div>
    </footer>
  )
}