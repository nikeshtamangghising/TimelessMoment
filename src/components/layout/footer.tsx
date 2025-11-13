import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12" suppressHydrationWarning>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8" suppressHydrationWarning>
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2" suppressHydrationWarning>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rijal Decors Valley</h3>
            <p className="text-gray-600 mb-4">
              Rijal Decors & Interior Pvt. Ltd offers affordable, artistic home and office decor — from resin sculptures (deer, elephants, eagles) to chef and wine holders, welcome sign boards, and stock market bull & bear sets — perfect for aesthetics or gifting. Open daily 9:00–17:00.
            </p>
          </div>

          {/* Quick Links */}
          <div suppressHydrationWarning>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2" suppressHydrationWarning>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/categories" className="text-gray-600 hover:text-gray-900">
                    Categories
                  </Link>
                </span>
              </li>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                    About Us
                  </Link>
                </span>
              </li>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                    Contact
                  </Link>
                </span>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div suppressHydrationWarning>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-2" suppressHydrationWarning>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                    Help Center
                  </Link>
                </span>
              </li>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/shipping" className="text-gray-600 hover:text-gray-900">
                    Shipping Info
                  </Link>
                </span>
              </li>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/returns" className="text-gray-600 hover:text-gray-900">
                    Returns
                  </Link>
                </span>
              </li>
              <li suppressHydrationWarning>
                <span suppressHydrationWarning>
                  <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </Link>
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200" suppressHydrationWarning>
          <p className="text-center text-gray-400 text-sm">
            © 2024 Rijal Decors Valley. All rights reserved. Powered by Sanam International PVT LTD.
          </p>
        </div>
      </div>
    </footer>
  )
}