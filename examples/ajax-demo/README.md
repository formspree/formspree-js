# Formspree AJAX Demo

A pure JavaScript/TypeScript example demonstrating how to use `@formspree/ajax` for form submissions without any frontend framework.

## Features

- Pure HTML/CSS/TypeScript implementation
- No React, Vue, or other framework dependencies
- Beautiful, responsive contact form UI
- Loading states and error handling
- Form validation feedback
- Success/error messages
- Built with Vite for fast development

## Setup

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Get your Formspree form ID:

   - Go to [formspree.io](https://formspree.io)
   - Create a new form or use an existing one
   - Copy your form ID (e.g., `xyzabc123`)

3. Create a `.env.local` file from the template:

   ```bash
   cp .env.local.template .env.local
   ```

4. Update `VITE_FORMSPREE_FORM_ID` in `.env.local` with your form ID.

## Development

Run the development server:

```bash
yarn dev
```

The demo will be available at `http://localhost:5173`

## Build

Build for production:

```bash
yarn build
```

The output will be in the `dist` directory.

## Usage

### Basic Form Initialization

```typescript
import { initForm } from '@formspree/ajax';

initForm({
  formElement: '#contact-form',
  formId: 'your-form-id',
  onSuccess: ({ form }) => {
    console.log('Success!');
    form.reset();
  },
  onError: (_context, error) => {
    const messages = error.getFormErrors().map((e) => e.message);
    console.error('Validation errors:', messages);
  },
  onFailure: (_context, error) => {
    console.error('Unexpected error:', error);
  },
});
```

### With Extra Data

```typescript
initForm({
  formElement: '#contact-form',
  formId: 'your-form-id',
  data: {
    source: 'website',
    timestamp: new Date().toISOString(),
  },
  onSuccess: ({ form }) => {
    form.reset();
  },
});
```

### Custom Origin (e.g., staging)

```typescript
initForm({
  formElement: '#contact-form',
  formId: 'your-form-id',
  origin: 'https://staging.formspree.io',
  debug: true,
});
```

## File Structure

```
ajax-demo/
├── public/
│   ├── index.html      # HTML form with styling
│   └── main.ts         # TypeScript implementation
├── .env.local.template # Environment variables template
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Learn More

- [Formspree Documentation](https://help.formspree.io/)
- [@formspree/ajax Package](../../packages/formspree-ajax)
