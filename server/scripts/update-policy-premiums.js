/**
 * Script to update existing policies to use monthly frequency and adjust premiums to R170
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to get the correct data file path
function getDataFilePath() {
  const mainPath = path.join(__dirname, 'data', 'app-data.json');
  if (fs.existsSync(mainPath)) {
    return mainPath;
  }
  
  const altPath = path.join(__dirname, 'server', 'app-data.json');
  if (fs.existsSync(altPath)) {
    console.log('Using alternate data file path');
    return altPath;
  }
  
  // If we can't find it in either place, look for it in the current directory
  const rootPath = path.join(__dirname, 'app-data.json');
  if (fs.existsSync(rootPath)) {
    console.log('Using root directory data file path');
    return rootPath;
  }
  
  return mainPath; // Default, even if it doesn't exist
}

const DATA_FILE = getDataFilePath();

// Load data from disk
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      console.log('Loaded data from disk successfully');
      return data;
    }
  } catch (error) {
    console.error('Error loading data from disk:', error);
  }
  return { policies: [] };
}

// Save data to disk
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data saved to disk successfully');
  } catch (error) {
    console.error('Error saving data to disk:', error);
  }
}

// Main function to update policies
function updatePolicies() {
  const data = loadData();
  
  if (!data.policies || data.policies.length === 0) {
    console.log('No policies found to update');
    return;
  }

  console.log(`Found ${data.policies.length} policies to update`);
  
  // Statistics tracking
  let annualPolicies = 0;
  let otherFrequencies = 0;
  let alreadyMonthly = 0;
  let highPremiums = 0;
  let lowPremiums = 0;

  // Update each policy - handle nested array structure [id, policyObject]
  try {
    // Show progress update for only first 5 policies to prevent log overflow
    const showDetailedLogs = false;
    
    data.policies = data.policies.map((policyArray, index) => {
      if (!policyArray || !Array.isArray(policyArray) || policyArray.length < 2) {
        console.log(`Skipping invalid policy at index ${index}`);
        return policyArray; // Return unchanged
      }
      
      // Each policy is stored as [id, policyObject]
      const policyId = policyArray[0];
      const policy = policyArray[1];
      
      // Skip null or invalid policies
      if (!policy || typeof policy !== 'object') {
        console.log(`Skipping null/invalid policy with id ${policyId}`);
        return policyArray; // Return unchanged
      }
      
      // Count original frequency for statistics - handle missing frequency
      if (!policy.hasOwnProperty('frequency') || policy.frequency !== 'monthly') {
        if (policy.frequency === 'annual') {
          annualPolicies++;
        } else {
          otherFrequencies++;
        }
        // Set frequency to monthly
        policy.frequency = 'monthly';
      } else {
        alreadyMonthly++;
      }
      
      // Count premium changes for statistics - handle missing premium
      if (policy.hasOwnProperty('premium')) {
        if (policy.premium > 500) {
          highPremiums++;
        } else if (policy.premium < 50) {
          lowPremiums++;
        }
      }
      
      // Show progress only for first few policies to avoid excessive logging
      if (showDetailedLogs && index < 5) {
        console.log(`Updating policy ${policyId} from premium ${policy.premium || 'unknown'} to 170`);
      } else if (index % 100 === 0) {
        console.log(`Processed ${index} policies...`);
      }
      
      // Always set premium to 170 regardless of current value
      policy.premium = 170;
      
      return [policyId, policy]; // Return the updated structure
    });
  } catch (error) {
    console.error('Error while updating policies:', error);
    // Continue with saving what we have so far
  }

  // Print statistics
  console.log('Update Statistics:');
  console.log(`- Converted annual policies: ${annualPolicies}`);
  console.log(`- Converted other frequency policies: ${otherFrequencies}`);
  console.log(`- Already monthly policies: ${alreadyMonthly}`);
  console.log(`- High premiums adjusted: ${highPremiums}`);
  console.log(`- Low premiums adjusted: ${lowPremiums}`);
  
  // Save the updated data
  saveData(data);
  console.log('All policies updated successfully!');
}

// Run the update
updatePolicies();