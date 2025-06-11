import { format, addMonths } from 'date-fns';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * Generates a policy schedule HTML document
 * @param {Object} policy - The policy object
 * @param {Object} client - The client object
 * @param {Array} dependents - List of dependents
 * @param {Array} beneficiaries - List of beneficiaries
 * @param {Object} policyType - The policy type object
 * @param {Object} bankDetail - Bank details for payment
 * @returns {String} HTML document as a string
 */
export async function generatePolicySchedule(policy, client, dependents = [], beneficiaries = [], policyType, bankDetail) {
  // Read the template file
  const templatePath = path.resolve(__dirname, '../templates/policy-schedule.html');
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  
  // Compile the template
  const template = Handlebars.compile(templateContent);
  
  // Get spouse if any
  const spouse = dependents.find(dep => dep.relationship === 'spouse');
  
  // Get children
  const children = dependents.filter(dep => dep.relationship === 'child');
  
  // Get parents
  const parents = dependents.filter(dep => dep.relationship === 'parent');
  
  // Get extended family members
  const extendedFamily = dependents.filter(dep => 
    dep.relationship !== 'spouse' && 
    dep.relationship !== 'child' && 
    dep.relationship !== 'parent'
  );
  
  // Calculate coverage amounts based on policy type
  const mainMemberCoverage = policy.coverageAmount || 25000;
  const spouseCoverage = spouse ? mainMemberCoverage : 0;
  const childCoverage = mainMemberCoverage * 0.5; // 50% of main member
  const parentCoverage = mainMemberCoverage * 0.5; // 50% of main member
  const extendedCoverage = mainMemberCoverage * 0.5; // 50% of main member
  
  // Calculate total coverage
  const totalCoverage = mainMemberCoverage + 
    (spouse ? spouseCoverage : 0) + 
    (children.length * childCoverage) + 
    (parents.length * parentCoverage) + 
    (extendedFamily.length * extendedCoverage);
  
  // Format date strings
  const formattedInceptionDate = policy.inceptionDate 
    ? format(new Date(policy.inceptionDate), 'yyyy/MM/dd')
    : 'Not set';
    
  const formattedRenewalDate = policy.renewalDate 
    ? format(new Date(policy.renewalDate), 'yyyy/MM/dd')
    : format(addMonths(new Date(), 12), 'yyyy/MM/dd');
  
  // Prepare template data
  const templateData = {
    policyNumber: policy.policyNumber,
    policyType: policyType?.name || 'Funeral Plan',
    clientName: client?.name || 'Policy Holder',
    idNumber: client?.idNumber || '',
    contactNumber: client?.phone || '',
    emailAddress: client?.email || '',
    inceptionDate: formattedInceptionDate,
    renewalDate: formattedRenewalDate,
    totalCoverageAmount: formatCurrency(totalCoverage),
    mainMemberCoverage: formatCurrency(mainMemberCoverage),
    
    // Conditionally include spouse coverage
    spouseCoverage: spouse ? formatCurrency(spouseCoverage) : null,
    
    // Conditionally include children coverage
    childrenCoverage: children.length > 0 ? formatCurrency(childCoverage) : null,
    childrenCount: children.length,
    
    // Conditionally include parents coverage
    parentsCoverage: parents.length > 0 ? formatCurrency(parentCoverage) : null,
    parentsCount: parents.length,
    
    // Conditionally include extended family coverage
    extendedCoverage: extendedFamily.length > 0 ? formatCurrency(extendedCoverage) : null,
    extendedCount: extendedFamily.length,
    
    premiumAmount: formatCurrency(policy.premium || 0),
    paymentDate: getPaymentDate(bankDetail),
    
    // Conditionally set plan-specific benefits
    familyPlan: policyType?.name === 'Family Plan',
    pensionerPlan: policyType?.name === 'Pensioner Plan',
    
    // Format beneficiaries for display
    beneficiaries: beneficiaries.map(ben => ({
      name: ben.name,
      relationship: ben.relationship,
      idNumber: ben.idNumber || 'Not provided',
      contactNumber: ben.contactNumber || 'Not provided'
    }))
  };
  
  // Generate the HTML
  return template(templateData);
}

/**
 * Formats a number as currency
 * @param {Number} amount - The amount to format
 * @returns {String} Formatted amount
 */
function formatCurrency(amount) {
  return amount.toLocaleString('en-ZA');
}

/**
 * Gets the payment date from bank details
 * @param {Object} bankDetail - Bank detail object
 * @returns {String} Payment date
 */
function getPaymentDate(bankDetail) {
  if (bankDetail && bankDetail.debitDay) {
    return bankDetail.debitDay.toString();
  }
  return '1st'; // Default to 1st of the month
}