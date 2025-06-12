// Program to manually debug and calculate the Luhn checksum for South African ID numbers

// In South African IDs, the checksum is calculated as follows:
// 1. Sum the digits in odd positions (1st, 3rd, 5th, etc)
// 2. Double each digit in even positions, sum their digits
// 3. Add these two sums together
// 4. The checksum is the digit that makes this sum a multiple of 10

// Function to calculate a checksum for a 12-digit ID number string (without checksum)
function calculateChecksum(idPrefix) {
  console.log(`Calculating checksum for: ${idPrefix}`);
  
  // For testing, try different implementations of the Luhn algorithm
  let sum = 0;
  
  // Standard implementation - multiply odd positions by 1, even by 2 (odd/even from right to left)
  for (let i = 0; i < 12; i++) {
    let value = parseInt(idPrefix.charAt(i));
    
    // Odd positions from the right (even indices from the left)
    if (i % 2 === 0) {
      value *= 2;
      if (value > 9) {
        value -= 9;  // Same as sum of digits for doubled values > 9
      }
    }
    
    sum += value;
    console.log(`Digit ${i+1}: ${idPrefix.charAt(i)} → ${value}, Running sum: ${sum}`);
  }
  
  // Calculate the check digit that would make the sum a multiple of 10
  const checkDigit = (10 - (sum % 10)) % 10;
  console.log(`Final sum: ${sum}, Check digit: ${checkDigit}`);
  
  return checkDigit;
}

// Test ID numbers
const testIDs = [
  "890918580008",  // Valid ID without check digit
  "920220472008",  // Should have checksum 5
  "910110568108"   // Another sample
];

console.log("South African ID Checksum Calculation");
console.log("=====================================");

// Calculate checksums for test IDs
for (const idPrefix of testIDs) {
  const checkDigit = calculateChecksum(idPrefix);
  console.log(`Full valid ID: ${idPrefix}${checkDigit}`);
  console.log("-------------------------------------");
}

// Verify specific test cases using our algorithm
const verifyIDs = [
  "8909185800088", // Known valid ID
  "9202204720085", // Another ID where we want to check the last digit
];

console.log("\nVerifying complete IDs:");
console.log("=====================================");

for (const id of verifyIDs) {
  const idPrefix = id.substring(0, 12);
  const providedCheckDigit = parseInt(id.charAt(12));
  const calculatedCheckDigit = calculateChecksum(idPrefix);
  
  console.log(`ID: ${id}`);
  console.log(`Provided check digit: ${providedCheckDigit}`);
  console.log(`Calculated check digit: ${calculatedCheckDigit}`);
  console.log(`Result: ${providedCheckDigit === calculatedCheckDigit ? 'VALID ✓' : 'INVALID ✗'}`);
  console.log("-------------------------------------");
}