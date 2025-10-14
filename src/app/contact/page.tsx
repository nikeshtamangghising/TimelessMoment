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
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li>
              <a
                href="https://facebook.com/rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Facebook
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com/rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href="https://tiktok.com/@rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                TikTok
              </a>
            </li>
            <li>
              <a
                href="https://youtube.com/@rijaldecorsvalley"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                YouTube
              </a>
            </li>
            <li className="sm:col-span-2">
              <a
                href="https://wa.me/9779800000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                WhatsApp
              </a>
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-500">Replace these URLs with your official profiles.</p>
        </div>
      </div>
    </MainLayout>
  )
}
