import MainLayout from '@/components/layout/main-layout'

export const revalidate = 3600

export default function ContactPage() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            We’d love to hear from you. Reach out for product inquiries, orders, or support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Company</h2>
            <p className="mt-2 text-gray-600">Rijal Decors & Interior Pvt. Ltd</p>
            <p className="mt-1 text-sm text-gray-500">Home and office decor specialists</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Hours</h2>
            <p className="mt-2 text-gray-600">Daily, 9:00–17:00</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
            <ul className="mt-2 space-y-1 text-gray-600">
              <li>
                <a href="mailto:info@rijaldecorsvalley.com" className="text-indigo-600 hover:text-indigo-700">
                  info@rijaldecorsvalley.com
                </a>
              </li>
              <li>
                <a href="tel:+977-9800000000" className="text-indigo-600 hover:text-indigo-700">
                  +977-9800000000
                </a>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Address</h2>
            <address className="not-italic mt-2 text-gray-600">
              <div>Rijal Decors & Interior Pvt. Ltd</div>
              <div>Kalanki, Kathmandu 44600</div>
              <div>Nepal</div>
            </address>
            <p className="mt-2 text-xs text-gray-500">Replace with your exact address if different.</p>
          </div>
        </div>

        {/* About Us */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">About Us</h2>
          <p className="mt-2 text-gray-600">
            Rijal Decors & Interior Pvt. Ltd curates affordable, artistic decor for homes and offices — from resin sculptures and figurines to chef and wine holders, welcome sign boards, and stock market bull & bear sets. We focus on tasteful pieces that elevate spaces and make thoughtful gifts.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Map Location</h2>
            <p className="mt-1 text-sm text-gray-500">Replace with your exact location if needed.</p>
            <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg border border-gray-200">
              <iframe
                title="Rijal Decors & Interior Pvt. Ltd Location"
                src="https://www.google.com/maps?q=Kalanki%2C%20Kathmandu%2044600&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Message Us</h2>
          <p className="mt-1 text-sm text-gray-500">Use your email client to reach us quickly.</p>
          <div className="mt-4">
            <a
              href="mailto:info@rijaldecorsvalley.com?subject=Inquiry"
              className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Email Us
            </a>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">Connect With Us</h2>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {/* Facebook */}
            <li>
              <a
                href="https://facebook.com/rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-white shadow-sm hover:shadow-md transition bg-[#1877F2]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H8.08v-2.9h2.36v-2.2c0-2.33 1.39-3.62 3.52-3.62.99 0 2.02.18 2.02.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.41v2h2.5l-.4 2.9h-2.1V22c4.78-.76 8.44-4.92 8.44-9.94z"/>
                </svg>
                <span className="sr-only">Facebook</span>
              </a>
            </li>

            {/* Instagram */}
            <li>
              <a
                href="https://instagram.com/rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-white shadow-sm hover:shadow-md transition bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
                  <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
                </svg>
                <span className="sr-only">Instagram</span>
              </a>
            </li>

            {/* TikTok */}
            <li>
              <a
                href="https://tiktok.com/@rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-white shadow-sm hover:shadow-md transition bg-black"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M21 8.5c-2.6 0-4.9-1.5-6-3.7V16c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.35 0 .7.03 1 .1v2.54c-.32-.09-.66-.14-1-.14-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.79 4-4V2h2.18c1.02 2.2 3.26 3.73 5.82 3.86V8.5z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </a>
            </li>

            {/* YouTube */}
            <li>
              <a
                href="https://youtube.com/@rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                title="YouTube"
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-white shadow-sm hover:shadow-md transition bg-[#FF0000]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.5 6.2c-.3-1.2-1.2-2.1-2.4-2.4C19.3 3.3 12 3.3 12 3.3s-7.3 0-9.1.5C1.7 4.1.8 5 .5 6.2.1 8 .1 12 .1 12s0 4 .4 5.8c.3 1.2 1.2 2.1 2.4 2.4 1.8.5 9.1.5 9.1.5s7.3 0 9.1-.5c1.2-.3 2.1-1.2 2.4-2.4.4-1.8.4-5.8.4-5.8s0-4-.4-5.8zM9.8 15.5V8.5l6.2 3.5-6.2 3.5z"/>
                </svg>
                <span className="sr-only">YouTube</span>
              </a>
            </li>

            {/* WhatsApp */}
            <li>
              <a
                href="https://wa.me/9779800000000"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
                className="inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-white shadow-sm hover:shadow-md transition bg-[#25D366]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.5 3.5A11.9 11.9 0 0012 0C5.4 0 .1 5.3.1 11.9c0 2.1.6 4.1 1.7 5.9L0 24l6.4-1.7a11.9 11.9 0 005.6 1.4h.1c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.1-3.5-8.3zM12 21.3c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.8 1 1-3.7-.3-.4a9.3 9.3 0 01-1.6-5.1c0-5.1 4.2-9.2 9.3-9.2 2.5 0 4.8 1 6.6 2.7 1.8 1.8 2.7 4.1 2.7 6.6 0 5.1-4.2 9.2-9.5 9.2zm5.4-6.9c-.3-.2-1.8-.9-2.1-1-.2-.1-.4-.2-.6.1-.2.2-.7.8-.9 1-.2.2-.3.2-.6.1-1.6-.8-2.7-1.4-3.7-3.3-.3-.5.3-.5.9-1.6.1-.1.1-.3 0-.5-.2-.2-.6-1.6-.9-2.2-.2-.6-.5-.5-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1.1 2.8 1.3 3c.2.2 2.1 3.2 5.1 4.4.7.3 1.3.5 1.8.6.7.2 1.3.2 1.8.1.6-.1 1.8-.7 2-1.4.2-.6.2-1.2.2-1.3 0-.1-.1-.2-.3-.3z"/>
                </svg>
                <span className="sr-only">WhatsApp</span>
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">Replace these URLs with your official profiles.</p>
        </div>
      </div>
    </MainLayout>
  )
}
