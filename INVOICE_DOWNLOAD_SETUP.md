# Invoice Download Feature Setup

## Required Package Installation

To enable PDF invoice generation, you need to install PDFKit:

```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

## Features Implemented

### 📄 PDF Invoice Generation
- Professional invoice layout with company branding
- Complete order details including items, pricing, and totals
- Customer and shipping information
- Payment method details
- Tax calculations (13% VAT for Nepal)
- Shipping cost calculations
- Automatic filename generation

### 🔐 Security Features
- Authentication required for access
- User can only download their own invoices
- Admin can download any invoice
- Order ownership verification

### 📱 User Interface
- Download button in order details page
- Download button in admin order management
- Professional PDF formatting
- Mobile-responsive design

## API Endpoint
- `GET /api/orders/[id]/invoice` - Downloads PDF invoice for specific order

## File Structure
- `src/app/api/orders/[id]/invoice/route.ts` - API endpoint
- `src/lib/invoice-generator.ts` - PDF generation utility

## Next Steps
1. Install required packages
2. Add download buttons to UI components
3. Test invoice generation
4. Customize invoice template as needed