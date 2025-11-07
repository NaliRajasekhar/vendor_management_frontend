export function validateForm(values) {
  const errors = {}

  const req = (key, msg = 'Required') => {
    if (!values[key] || String(values[key]).trim() === '') errors[key] = msg
  }

  req('vendor')
  req('implementation')
  req('client')
  req('name', 'Enter full name')

  // Email validation
  if (!values.email || String(values.email).trim() === '') {
    errors.email = 'Email required'
  } else if (!/^\S+@\S+\.[A-Za-z]{2,}$/.test(values.email)) {
    errors.email = 'Invalid email'
  }

  // Phone validation: support India and USA formats
  if (values.phone) {
    const phone = String(values.phone).trim()
    const inPattern = /^(?:\+91[\s\-]?|0)?[6-9]\d{9}$/
    const usPattern = /^(?:\+1[\s\-]?|1[\s\-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.\-]?[2-9]\d{2}[\s.\-]?\d{4}$/
    if (!inPattern.test(phone) && !usPattern.test(phone)) {
      errors.phone = 'Invalid phone (use US or India format)'
    }
  }

  return errors
}

export function firstErrorKey(errors) {
  return Object.keys(errors)[0] || null
}




