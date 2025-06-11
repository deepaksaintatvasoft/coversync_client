import { validateSouthAfricanID, getDateOfBirthFromIDNumber, getGenderFromIDNumber } from './lib/utils';

// Test with a valid South African ID number
// Format: YYMMDDSSSSCA Z
// Example: 8001015009087 (This is a fictional ID number for testing)

const testID = "8001015009087";

console.log("ID:", testID);
console.log("Valid:", validateSouthAfricanID(testID));
console.log("Date of Birth:", getDateOfBirthFromIDNumber(testID));
console.log("Gender:", getGenderFromIDNumber(testID));