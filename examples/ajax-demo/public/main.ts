import { FormspreeClient } from '@formspree/ajax';

// Initialize the Formspree client
// Replace 'YOUR_FORM_ID' with your actual form ID from https://formspree.io
const client = new FormspreeClient({
  formId: 'mjgyklbo'
});

// Get form elements
const form = document.getElementById('contact-form') as HTMLFormElement;
const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
const messageDiv = document.getElementById('message') as HTMLDivElement;

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Update UI to show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span>Sending...';
  messageDiv.className = 'message';
  messageDiv.style.display = 'none';

  try {
    // Submit the form using Formspree AJAX client
    const response = await client.submitForm(form);

    if (response.ok) {
      // Success - show success message
      messageDiv.className = 'message success';
      messageDiv.textContent = '✓ Thank you! Your message has been sent successfully.';
      messageDiv.style.display = 'block';

      // Reset the form
      form.reset();
    } else {
      // Error from Formspree API
      messageDiv.className = 'message error';

      if (response.errors && response.errors.length > 0) {
        const errorMessages = response.errors
          .map(err => err.message || 'Unknown error')
          .join(', ');
        messageDiv.textContent = `✗ Error: ${errorMessages}`;
      } else {
        messageDiv.textContent = '✗ Failed to send message. Please try again.';
      }

      messageDiv.style.display = 'block';
    }
  } catch (error) {
    // Network or unexpected error
    messageDiv.className = 'message error';
    messageDiv.textContent = '✗ An unexpected error occurred. Please check your connection and try again.';
    messageDiv.style.display = 'block';
    console.error('Form submission error:', error);
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Message';
  }
});

// Alternative: Submit using data object instead of form element
async function submitWithDataObject() {
  const formData = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello from Formspree AJAX!'
  };

  const response = await client.submit(formData);
  console.log('Response:', response);
}

// Example of handling validation errors
form.querySelectorAll('input, textarea').forEach(field => {
  field.addEventListener('invalid', (e) => {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    messageDiv.className = 'message error';
    messageDiv.textContent = `✗ Please fill in the ${target.name} field correctly.`;
    messageDiv.style.display = 'block';
  });
});
