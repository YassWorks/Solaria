export function generatePassword(fullname: string, phone: number) {
  const random = Math.random().toString(36).slice(-4);
  const namePart = fullname.replace(/\s+/g, '').slice(0, 3);
  const phonePart = phone.toString().slice(-3);
  return `${namePart}${random}${phonePart}`;
}
