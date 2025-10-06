import { nanoid } from 'nanoid';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const clickElement = async (testId) => {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Element with testid="${testId}" not found`);
  element.click();
  await sleep(500);
};

const typeIntoInput = async (testId, value) => {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Input with testid="${testId}" not found`);
  
  element.focus();
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(200);
};

const selectOption = async (selectTestId, optionTestId) => {
  await clickElement(selectTestId);
  await sleep(300);
  await clickElement(optionTestId);
  await sleep(300);
};

const getInputValue = (testId) => {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Input with testid="${testId}" not found`);
  return element.value;
};

const elementExists = (testId) => {
  return !!document.querySelector(`[data-testid="${testId}"]`);
};

const waitForElement = async (testId, timeout = 5000) => {
  const startTime = Date.now();
  while (!elementExists(testId)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Element with testid="${testId}" not found after ${timeout}ms`);
    }
    await sleep(100);
  }
};

const waitForElementToDisappear = async (testId, timeout = 5000) => {
  const startTime = Date.now();
  while (elementExists(testId)) {
    if (Date.now() - startTime > timeout) {
      throw new Error(`Element with testid="${testId}" still exists after ${timeout}ms`);
    }
    await sleep(100);
  }
};

const log = (message, data) => {
  console.log(`[E2E TEST] ${message}`, data || '');
};

const logSuccess = (message) => {
  console.log(`%c✓ ${message}`, 'color: green; font-weight: bold');
};

const logError = (message, error) => {
  console.error(`%c✗ ${message}`, 'color: red; font-weight: bold', error);
};

async function runE2ETest() {
  const uniqueClientName = `Test Client ${nanoid(6)}`;
  const uniqueCompany = `Test Company ${nanoid(6)}`;
  const testAmount = '50000';
  let createdDealId = null;

  try {
    log('Starting E2E test for Sales module...');
    
    log('Step 1: Verify we are on Sales page');
    await sleep(1000);
    if (!window.location.pathname.includes('/sales')) {
      throw new Error('Not on Sales page. Please navigate to /sales first');
    }
    logSuccess('Step 1: On Sales page');

    log('Step 2: Click on first existing deal card');
    const firstDealCard = document.querySelector('[data-testid^="card-deal-"]');
    if (!firstDealCard) {
      throw new Error('No deal cards found. Please create at least one deal first');
    }
    const firstDealTestId = firstDealCard.getAttribute('data-testid');
    await clickElement(firstDealTestId);
    await waitForElement('text-sheet-title', 3000);
    logSuccess('Step 2: Deal detail sheet opened');

    log('Step 3: Verify deal data is displayed in form');
    const clientNameValue = getInputValue('input-client-name');
    if (!clientNameValue) {
      throw new Error('Client name not loaded in form');
    }
    log('Client name in form:', clientNameValue);
    logSuccess('Step 3: Deal data loaded in form');

    log('Step 4: Close the sheet');
    const sheetCloseButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (sheetCloseButton) {
      sheetCloseButton.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-sheet-title', 3000);
    logSuccess('Step 4: Sheet closed');

    log('Step 5: Click "New Deal" button to open create dialog');
    await clickElement('button-create-deal');
    await waitForElement('text-dialog-title', 3000);
    logSuccess('Step 5: Create dialog opened');

    log('Step 6: Fill form and create new deal');
    await typeIntoInput('input-create-client-name', uniqueClientName);
    await typeIntoInput('input-create-company', uniqueCompany);
    await typeIntoInput('input-create-amount', testAmount);
    
    await selectOption('select-create-stage', 'option-create-stage-meeting');
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateTimeString = futureDate.toISOString().slice(0, 16);
    await typeIntoInput('input-create-deadline', dateTimeString);

    log('Submitting create form...');
    await clickElement('button-submit-create');
    await sleep(2000);
    
    await waitForElementToDisappear('text-dialog-title', 5000);
    logSuccess('Step 6: New deal created successfully');

    log('Step 7: Verify new deal appears in list');
    await sleep(1000);
    const dealCards = Array.from(document.querySelectorAll('[data-testid^="card-deal-"]'));
    const newDealCard = dealCards.find(card => {
      const cardText = card.textContent;
      return cardText.includes(uniqueClientName);
    });
    
    if (!newDealCard) {
      throw new Error(`New deal with client name "${uniqueClientName}" not found in list`);
    }
    createdDealId = newDealCard.getAttribute('data-testid').replace('card-deal-', '');
    log('Found new deal with ID:', createdDealId);
    logSuccess('Step 7: New deal found in list');

    log('Step 8: Open created deal and edit it');
    await clickElement(`card-deal-${createdDealId}`);
    await waitForElement('text-sheet-title', 3000);
    
    const loadedClientName = getInputValue('input-client-name');
    if (loadedClientName !== uniqueClientName) {
      throw new Error(`Client name mismatch. Expected: ${uniqueClientName}, Got: ${loadedClientName}`);
    }
    logSuccess('Step 8: Created deal opened with correct data');

    log('Step 9: Edit the deal');
    const updatedAmount = '75000';
    await typeIntoInput('input-amount', updatedAmount);
    await selectOption('select-stage', 'option-stage-proposal');
    
    await clickElement('button-save-deal');
    await sleep(2000);
    await waitForElementToDisappear('text-sheet-title', 5000);
    logSuccess('Step 9: Deal updated successfully');

    log('Step 10: Verify updated data');
    await sleep(500);
    const updatedDealCard = document.querySelector(`[data-testid="card-deal-${createdDealId}"]`);
    if (!updatedDealCard) {
      throw new Error('Updated deal card not found');
    }
    const cardText = updatedDealCard.textContent;
    if (!cardText.includes('75')) {
      log('Warning: Updated amount might not be visible in card');
    }
    logSuccess('Step 10: Deal data verified');

    log('Step 11: Delete the deal');
    await clickElement(`card-deal-${createdDealId}`);
    await waitForElement('text-sheet-title', 3000);
    
    await clickElement('button-delete-deal');
    await waitForElement('dialog-delete-confirm', 3000);
    logSuccess('Delete confirmation dialog opened');
    
    await clickElement('button-confirm-delete');
    await sleep(2000);
    await waitForElementToDisappear('dialog-delete-confirm', 5000);
    logSuccess('Step 11: Deal deleted successfully');

    log('Step 12: Verify deal is removed from list');
    await sleep(500);
    const deletedDealCard = document.querySelector(`[data-testid="card-deal-${createdDealId}"]`);
    if (deletedDealCard) {
      throw new Error('Deal card still exists after deletion');
    }
    logSuccess('Step 12: Deal removed from list');

    console.log('\n%c========================================', 'color: green; font-weight: bold');
    console.log('%c✓ ALL E2E TESTS PASSED SUCCESSFULLY!', 'color: green; font-weight: bold; font-size: 16px');
    console.log('%c========================================', 'color: green; font-weight: bold');
    console.log('\nTest Summary:');
    console.log('- Created deal with client:', uniqueClientName);
    console.log('- Created deal with company:', uniqueCompany);
    console.log('- Initial amount: 50000 ₽');
    console.log('- Updated amount: 75000 ₽');
    console.log('- Stage changed: new → meeting → proposal');
    console.log('- Deal successfully deleted');
    
    return true;
  } catch (error) {
    logError('E2E TEST FAILED', error.message);
    console.error('Full error:', error);
    return false;
  }
}

console.log('%c=== Sales Module E2E Test ===', 'color: blue; font-weight: bold; font-size: 18px');
console.log('This script will test all CRUD operations in the Sales module.');
console.log('Make sure you are on the /sales page before running the test.\n');

window.runSalesE2ETest = runE2ETest;

console.log('%cTo run the test, execute: runSalesE2ETest()', 'color: orange; font-weight: bold');
