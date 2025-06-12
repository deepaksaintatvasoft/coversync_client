/**
 * Script to update policy premiums to R170 using the API endpoints
 */
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

async function fetchPolicies() {
  try {
    const response = await fetch(`${API_URL}/policies`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const policies = await response.json();
    console.log(`Fetched ${policies.length} policies from API`);
    return policies;
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
}

async function updatePolicy(policyId, premium) {
  try {
    const response = await fetch(`${API_URL}/policies/${policyId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        premium: premium,
        frequency: 'monthly'
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const updatedPolicy = await response.json();
    return updatedPolicy;
  } catch (error) {
    console.error(`Error updating policy ${policyId}:`, error);
    return null;
  }
}

async function updateAllPremiums() {
  const policies = await fetchPolicies();
  if (policies.length === 0) {
    console.log('No policies found');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  console.log(`Updating ${policies.length} policies to R170 monthly premium...`);
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 10;
  for (let i = 0; i < policies.length; i += batchSize) {
    const batch = policies.slice(i, i + batchSize);
    
    // Create an array of promises for the current batch
    const promises = batch.map(policy => {
      if (policy.premium !== 170 || policy.frequency !== 'monthly') {
        console.log(`Updating policy ${policy.id} from premium ${policy.premium} (${policy.frequency}) to 170 (monthly)`);
        return updatePolicy(policy.id, 170);
      } else {
        console.log(`Policy ${policy.id} already has premium 170 (monthly)`);
        return Promise.resolve(null);
      }
    });
    
    // Wait for all promises in the current batch to resolve
    const results = await Promise.all(promises);
    
    // Count successes and errors
    results.forEach(result => {
      if (result) {
        successCount++;
      } else {
        errorCount++;
      }
    });
    
    console.log(`Processed ${i + batch.length} of ${policies.length} policies...`);
  }
  
  console.log(`Update complete. Successfully updated ${successCount} policies. Errors: ${errorCount}`);
}

// Execute the function
updateAllPremiums().catch(error => {
  console.error('Error in main execution:', error);
});