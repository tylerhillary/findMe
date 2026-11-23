// findMe currently operates in Nigeria only.

export const COUNTRY = "Nigeria";
export const TIME_ZONE = "Africa/Lagos";
export const LOCALE = "en-NG";

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta",
  "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
  "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
] as const;

/** Common "Area, State" suggestions for location inputs. */
export const POPULAR_LOCATIONS = [
  "Ikeja, Lagos", "Lekki, Lagos", "Yaba, Lagos", "Surulere, Lagos", "Victoria Island, Lagos", "Ikorodu, Lagos",
  "Wuse, FCT Abuja", "Garki, FCT Abuja", "Gwarinpa, FCT Abuja", "Port Harcourt, Rivers", "Ibadan, Oyo",
  "Kano, Kano", "Enugu, Enugu", "Benin City, Edo", "Kaduna, Kaduna", "Owerri, Imo", "Abeokuta, Ogun",
  "Uyo, Akwa Ibom", "Calabar, Cross River", "Jos, Plateau", "Ilorin, Kwara", "Asaba, Delta", "Warri, Delta",
  "Onitsha, Anambra", "Awka, Anambra", "Akure, Ondo", "Osogbo, Osun", "Aba, Abia",
];

/** Does a free-text location ("Lekki, Lagos") fall in the given state? */
export function inState(location: string, state: string) {
  // Drop the country name so "Niger" doesn't match "…, Nigeria".
  const loc = location.toLowerCase().replace(/nigeria/g, "");
  const s = state.toLowerCase();
  if (s === "fct abuja") return loc.includes("abuja") || loc.includes("fct");
  return loc.includes(s);
}
