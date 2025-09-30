'use client'

// Inline SVG icon to avoid import issues
const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
)

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Fashion Enthusiast',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    content: 'Amazing quality products and lightning-fast delivery! I\'ve been shopping here for over a year and they never disappoint. The customer service is exceptional.',
    rating: 5
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Tech Professional',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80',
    content: 'The best online shopping experience I\'ve ever had. Great prices, authentic products, and the return policy is incredibly customer-friendly. Highly recommend!',
    rating: 5
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Small Business Owner',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80',
    content: 'I love how easy it is to find exactly what I need. The search functionality is excellent and the product descriptions are detailed and accurate.',
    rating: 5
  }
]

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
            ⭐ Customer Reviews
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it. Here's what real customers have to say about their shopping experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={testimonial.id}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              style={{
                animationDelay: `${index * 200}ms`,
              }}
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-gray-200 group-hover:text-gray-300 transition-colors">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-700 leading-relaxed mb-6 group-hover:text-gray-600 transition-colors">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center">
                <div className="relative">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-gray-200 transition-all"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              {/* Hover Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-purple-50/0 group-hover:from-blue-50/50 group-hover:to-purple-50/50 rounded-2xl transition-all duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 text-gray-500">
            <div className="flex items-center">
              <StarIcon className="w-5 h-5 text-yellow-400 mr-1" />
              <span className="font-semibold text-gray-900">4.9/5</span>
              <span className="ml-1">Average Rating</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div>
              <span className="font-semibold text-gray-900">10,000+</span>
              <span className="ml-1">Happy Customers</span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
            <div>
              <span className="font-semibold text-gray-900">99.9%</span>
              <span className="ml-1">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}