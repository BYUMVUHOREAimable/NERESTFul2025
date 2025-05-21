export function validatePassword(password) {
  const minLength = 10;
  const maxLength = 128;
  const errors = [];

  if (!password) {
    errors.push("Password is required.");
    return errors; // Early exit if no password provided
  }

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long.`);
  }

  if (password.length > maxLength) {
    errors.push(`Password must not exceed ${maxLength} characters.`);
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push("Password must contain at least one digit.");
  }


  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/.test(password)) {
    errors.push("Password must contain at least one special character (e.g., !@#$%^&*).");
  }

  // Check for leading/trailing spaces
  if (password.trim() !== password) {
    errors.push("Password must not have leading or trailing spaces.");
  }

  return errors; // Returns an array of error messages
}
export function validateEmail(email) {
  const maxLength = 254;
  const errors = [];

  const practicalEmailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;


  if (!email) {
    errors.push("Email is required.");
    return errors;
  }

  if (email.length > maxLength) {
    errors.push(`Email must not exceed ${maxLength} characters.`);
  }

  if (!practicalEmailRegex.test(String(email).toLowerCase())) {
    errors.push("Invalid email format.");
  }

  if (email.trim() !== email) {
    errors.push("Email must not have leading or trailing spaces.");
  }

  return errors;
}



