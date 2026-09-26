// Shared address rules for Bangladesh, used by forms and APIs.

export const COUNTRY = "Bangladesh";

// All 64 districts, sorted. Delivery fees are matched on this value.
export const BD_DISTRICTS = [
  "Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria",
  "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cox's Bazar", "Cumilla",
  "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj",
  "Habiganj", "Jamalpur", "Jashore", "Jhalokathi", "Jhenaidah", "Joypurhat",
  "Khagrachhari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur",
  "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar",
  "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi",
  "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh",
  "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur",
  "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet",
  "Tangail", "Thakurgaon",
];

// Accepts 01XXXXXXXXX, +8801XXXXXXXXX or 8801XXXXXXXXX (spaces/dashes ignored).
export function normalizeBdPhone(value) {
  const digits = String(value ?? "").replace(/[^\d]/g, "");
  const local = digits.startsWith("880") ? `0${digits.slice(3)}` : digits;
  return local;
}

export function isValidBdPhone(value) {
  return /^01[3-9]\d{8}$/.test(normalizeBdPhone(value));
}

/**
 * Validates an address from a form or API body.
 * Returns { data } with cleaned values or { error } with a message.
 */
export function validateAddress(input = {}) {
  const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);
  const data = {
    street: clean(input.street),
    city: clean(input.city, 60),
    state: clean(input.state, 60) || null,
    zipCode: clean(input.zipCode, 10) || null,
    country: COUNTRY,
    phoneNumber: normalizeBdPhone(input.phoneNumber),
  };

  if (data.street.length < 5) return { error: "Please enter your full street address (house, road, area)." };
  if (!BD_DISTRICTS.includes(data.city)) return { error: "Please choose your district." };
  if (!isValidBdPhone(data.phoneNumber)) {
    return { error: "Please enter a valid Bangladeshi mobile number (e.g. 01712345678)." };
  }
  if (data.zipCode && !/^\d{4}$/.test(data.zipCode)) return { error: "Postcode must be 4 digits." };
  return { data };
}
