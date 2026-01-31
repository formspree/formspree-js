# Formspree AJAX Demo

A pure JavaScript/TypeScript example demonstrating how to use `@formspree/ajax` for form submissions without any frontend framework.

## Features

- Pure HTML/CSS/TypeScript implementation
- No React, Vue, or other framework dependencies
- Beautiful, responsive contact form UI
- Loading states and error handling
- Form validation
- Success/error messages
- Built with Vite for fast development

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get your Formspree form ID:

   - Go to [formspree.io](https://formspree.io)
   - Create a new form or use an existing one
   - Copy your form ID (e.g., `xyzabc123`)

3. Update the form ID in `src/main.ts`:
   ```typescript
   const client = new FormspreeClient({
     formId: 'YOUR_FORM_ID', // Replace with your actual form ID
   });
   ```

## Development

Run the development server:

```bash
npm run dev
```

The demo will be available at `http://localhost:5173`

## Build

Build for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Usage

### Basic Form Submission

```typescript
import { FormspreeClient } from '@formspree/ajax';

const client = new FormspreeClient({
  formId: 'your-form-id',
});

// Submit form element
const form = document.getElementById('my-form');
const response = await client.submitForm(form);

if (response.ok) {
  console.log('Success!');
} else {
  console.error('Error:', response.errors);
}
```

### Submit Data Object

```typescript
const response = await client.submit({
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello!',
});
```

## File Structure

```
ajax-demo/
├── public/
│   └── index.html          # HTML form with styling
├── src/
│   └── main.ts             # TypeScript implementation
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Learn More

- [Formspree Documentation](https://help.formspree.io/)
- [@formspree/ajax Package](../../packages/formspree-ajax)
