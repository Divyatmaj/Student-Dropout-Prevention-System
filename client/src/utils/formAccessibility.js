/** Move focus to the first invalid field after form validation renders errors. */
export function focusFirstInvalidField(formId) {
  window.setTimeout(() => {
    const form = formId ? document.getElementById(formId) : document.querySelector('.modal-overlay');
    const field = form?.querySelector('[aria-invalid="true"]');
    if (!field) return;
    field.focus();
    field.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }, 0);
}
