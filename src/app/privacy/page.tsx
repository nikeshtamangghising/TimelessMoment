import MainLayout from '@/components/layout/main-layout'

export const revalidate = 86400

export default function PrivacyPage() {
  return (
    <MainLayout>
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-zinc-900 via-stone-900 to-amber-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">Privacy Policy</h1>
          <p className="mt-3 text-amber-100 max-w-3xl">
            Your privacy matters. This policy explains what we collect, how we use it, and your rights.
          </p>
        </div>
      </section>

      <div className="-mt-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="prose prose-stone max-w-none">
              <h2>1. Who we are</h2>
              <p>
                Rijal Decors & Interior Pvt. Ltd ("we", "us", "our") provides home and office decor products
                through our online store. This privacy notice describes how we handle your information when you use our
                services.
              </p>

              <h2>2. Information we collect</h2>
              <ul>
                <li>
                  Account and Contact Data: name, email, phone (if provided), addresses you add for shipping/billing.
                </li>
                <li>
                  Order and Payment Data: order details (items, totals). Payments are processed by Stripe; we don’t
                  store full card details on our servers.
                </li>
                <li>
                  Usage Data: pages viewed, product interactions (like view, add to cart), device/approximate location
                  inferred from IP for security and analytics.
                </li>
                <li>
                  Communications: emails you send us; email delivery status via our email provider.
                </li>
              </ul>

              <h2>3. How we use your information</h2>
              <ul>
                <li>To fulfill orders, process payments, and deliver products.</li>
                <li>To manage your account and provide customer support.</li>
                <li>To improve our catalog, recommendations, and on‑site experience.</li>
                <li>To send essential service emails (order confirmations, updates).</li>
                <li>To detect fraud, secure our services, and comply with legal obligations.</li>
              </ul>

              <h2>4. Cookies and tracking</h2>
              <p>
                We use cookies and similar technologies for essential functions (authentication, cart), analytics,
                and improving performance. You can control cookies via your browser settings; disabling some cookies may
                impact key features.
              </p>

              <h2>5. Third‑party services</h2>
              <ul>
                <li>
                  Payments: Stripe — processes your payment securely. Card details are handled by Stripe and are not
                  stored on our servers.
                </li>
                <li>
                  Authentication: NextAuth — manages sign‑in and session security.
                </li>
                <li>
                  Email: Resend — sends order and account emails; limited delivery metadata may be retained.
                </li>
                <li>
                  Database/Infrastructure: We use industry‑standard hosting and databases to run the service.
                </li>
              </ul>

              <h2>6. Data retention</h2>
              <p>
                We retain account, order, and invoice records as required for business, tax, and legal purposes.
                If you request deletion of your account, we will remove or anonymize data that is not legally required
                to be kept.
              </p>

              <h2>7. Your rights</h2>
              <p>
                Depending on your jurisdiction, you may have rights to access, correct, delete, or receive a copy of
                your personal data, and to object to or restrict certain processing. To make a request, please contact us.
              </p>

              <h2>8. Children</h2>
              <p>
                Our services are not directed to children under 13 (or the applicable age in your region). We do not
                knowingly collect data from children.
              </p>

              <h2>9. Changes to this policy</h2>
              <p>
                We may update this policy from time to time. We will update the “Last updated” date and, where
                appropriate, provide additional notice.
              </p>

              <h2>10. Contact</h2>
              <p>
                For privacy questions or requests, contact us at
                <a href="mailto:info@rijaldecorsvalley.com"> info@rijaldecorsvalley.com</a> or visit our
                <a href="/contact"> Contact page</a>.
              </p>

              <hr />
              <p className="text-sm text-gray-500">Last updated: {new Date().getFullYear()}.</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}