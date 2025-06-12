#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the original file
const filePath = path.join(process.cwd(), 'src/components/policy-signup-form-modern.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the positions of the problematic sections
const firstSectionStart = content.indexOf('{/* Step 6: Banking Details */}\n          {step === 6 && (', 1500);
const secondSectionStart = content.indexOf('{/* Step 6: Banking Details */}\n          {step === 6 && (', firstSectionStart + 100);

if (firstSectionStart !== -1 && secondSectionStart !== -1) {
  // Find the end of the first section
  let depth = 1;
  let firstSectionEnd = firstSectionStart + '{/* Step 6: Banking Details */}\n          {step === 6 && ('.length;
  
  while (depth > 0 && firstSectionEnd < content.length) {
    if (content[firstSectionEnd] === '{') depth++;
    if (content[firstSectionEnd] === '}') depth--;
    firstSectionEnd++;
  }
  
  // Truncate the first section's closing
  const firstSectionClosingStart = content.lastIndexOf(')}', firstSectionEnd);
  
  if (firstSectionClosingStart !== -1) {
    // Remove the duplicate section and replace with a combined one
    const firstPart = content.substring(0, firstSectionStart);
    const combinedSection = '{/* Step 6: Banking Details - Combined */}\n          {step === 6 && (\n            <div>\n';
    
    // Get content from first section (without the wrapper div and closing tag)
    const firstSectionContent = content.substring(
      firstSectionStart + '{/* Step 6: Banking Details */}\n          {step === 6 && (\n            <div>\n'.length,
      firstSectionClosingStart - 14 // Adjusted to remove the closing div
    );
    
    // Get content from second section (without the wrapper div and closing tag)
    const secondSectionStartContent = secondSectionStart + '{/* Step 6: Banking Details */}\n          {step === 6 && (\n            <div>\n'.length;
    let secondSectionEndContent = secondSectionStartContent;
    depth = 1;
    
    while (depth > 0 && secondSectionEndContent < content.length) {
      if (content[secondSectionEndContent] === '{') depth++;
      if (content[secondSectionEndContent] === '}') depth--;
      secondSectionEndContent++;
    }
    
    const secondSectionContent = content.substring(
      secondSectionStartContent,
      content.lastIndexOf(')}', secondSectionEndContent) - 14 // Adjusted to remove the closing div
    );
    
    // Get the end part after the second section
    const endPart = content.substring(content.indexOf(')}', secondSectionEndContent) + 2);
    
    // Combine everything
    const newContent = firstPart + combinedSection + firstSectionContent + '\n' + secondSectionContent + '\n            </div>\n          )}' + endPart;
    
    // Write the fixed content back to the file
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully fixed the file!');
  } else {
    console.error('Could not find the closing bracket of the first section');
  }
} else {
  console.error('Could not find the problematic sections');
}
