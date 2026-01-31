# @formspree/ajax

Pure JavaScript AJAX library for Formspree - no framework dependencies required.

## Installation

```bash
npm install @formspree/ajax
```

## Usage

### Basic Example

```typescript
import { FormspreeClient } from '@formspree/ajax';

const client = new FormspreeClient({
  formId: 'your-form-id',
});

// Submit form data
const response = await client.submit({
  email: 'user@example.com',
  message: 'Hello from Formspree!',
});

if (response.ok) {
  console.log('Form submitted successfully!');
} else {
  console.error('Form submission failed:', response.errors);
}
```

### HTML Form Integration

```html
<form id="contact-form">
  <input type="email" name="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Send</button>
</form>

<script type="module">
  import { FormspreeClient } from '@formspree/ajax';

  const client = new FormspreeClient({
    formId: 'your-form-id',
  });

  const form = document.getElementById('contact-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await client.submitForm(form);

    if (response.ok) {
      alert('Thank you for your submission!');
      form.reset();
    } else {
      alert('Submission failed. Please try again.');
    }
  });
</script>
```

## API

### FormspreeClient

#### Constructor

```typescript
new FormspreeClient(config: FormspreeClientConfig)
```

**Config Options:**

- `formId` (required): Your Formspree form ID
- `endpoint` (optional): Custom endpoint URL (defaults to `https://formspree.io/f`)

#### Methods

##### `submit(data: Record<string, any>): Promise<FormspreeResponse>`

Submit form data as a JavaScript object.

##### `submitForm(formElement: HTMLFormElement): Promise<FormspreeResponse>`

Submit an HTML form element directly.

### FormspreeResponse

```typescript
{
  ok: boolean;
  body?: any;
  errors?: any[];
}
```

## License

MIT
