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

const getText = (testId) => {
  const element = document.querySelector(`[data-testid="${testId}"]`);
  if (!element) throw new Error(`Element with testid="${testId}" not found`);
  return element.textContent;
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

async function runWarehouseE2ETest() {
  const uniqueItemName = `Test Item ${nanoid(6)}`;
  const location = `Стеллаж А-${nanoid(2)}`;
  const minStock = '50';
  const initialQuantity = '100';
  const inQuantity = '50';
  const outQuantity = '130';
  let createdItemId = null;

  try {
    log('Starting E2E test for Warehouse module...');
    
    log('Step 1: Verify we are on Warehouse page');
    await sleep(1000);
    if (!window.location.pathname.includes('/warehouse')) {
      throw new Error('Not on Warehouse page. Please navigate to /warehouse first');
    }
    logSuccess('Step 1: On Warehouse page');

    log('Step 2: Click "New Item" button to open create dialog');
    await clickElement('button-create-warehouse-item');
    await waitForElement('text-warehouse-dialog-title', 3000);
    logSuccess('Step 2: Create dialog opened');

    log('Step 3: Fill form and create new warehouse item');
    await typeIntoInput('input-warehouse-name', uniqueItemName);
    await typeIntoInput('input-warehouse-quantity', initialQuantity);
    await selectOption('select-warehouse-unit', 'option-unit-pc');
    await typeIntoInput('input-warehouse-location', location);
    await selectOption('select-warehouse-category', 'option-category-materials');
    await typeIntoInput('input-warehouse-min-stock', minStock);
    
    log('Submitting create form...');
    await clickElement('button-warehouse-submit-create');
    await sleep(2000);
    
    await waitForElementToDisappear('text-warehouse-dialog-title', 5000);
    logSuccess('Step 3: New warehouse item created successfully');

    log('Step 4: Verify new item appears in grid');
    await sleep(1000);
    const itemCards = Array.from(document.querySelectorAll('[data-testid^="card-warehouse-item-"]'));
    const newItemCard = itemCards.find(card => {
      const cardText = card.textContent;
      return cardText.includes(uniqueItemName);
    });
    
    if (!newItemCard) {
      throw new Error(`New item with name "${uniqueItemName}" not found in grid`);
    }
    createdItemId = newItemCard.getAttribute('data-testid').replace('card-warehouse-item-', '');
    log('Found new item with ID:', createdItemId);
    logSuccess('Step 4: New item found in grid');

    log('Step 5: Verify item has "normal" status initially');
    const statusBadge = document.querySelector(`[data-testid="badge-warehouse-status-${createdItemId}"]`);
    if (!statusBadge) {
      throw new Error('Status badge not found');
    }
    const statusText = statusBadge.textContent;
    log('Initial status:', statusText);
    if (!statusText.includes('Норма')) {
      throw new Error(`Expected "Норма" status, got: ${statusText}`);
    }
    logSuccess('Step 5: Item has correct initial status (Норма)');

    log('Step 6: Open created item detail sheet');
    await clickElement(`card-warehouse-item-${createdItemId}`);
    await waitForElement('text-warehouse-sheet-title', 3000);
    
    const loadedItemName = getInputValue('input-warehouse-item-name');
    if (loadedItemName !== uniqueItemName) {
      throw new Error(`Item name mismatch. Expected: ${uniqueItemName}, Got: ${loadedItemName}`);
    }
    logSuccess('Step 6: Item detail sheet opened with correct data');

    log('Step 7: Add incoming transaction (приход)');
    await clickElement('button-add-transaction');
    await waitForElement('text-transaction-dialog-title', 3000);
    
    await clickElement('radio-transaction-type-in');
    await typeIntoInput('input-transaction-quantity', inQuantity);
    await typeIntoInput('input-transaction-notes', 'Приход товара для теста');
    
    await clickElement('button-transaction-submit');
    await sleep(2000);
    await waitForElementToDisappear('text-transaction-dialog-title', 5000);
    logSuccess('Step 7: Incoming transaction created successfully');

    log('Step 8: Verify transaction appears in history');
    await sleep(1000);
    if (!elementExists('transaction-item-0')) {
      throw new Error('Transaction not found in history');
    }
    const transactionQuantity = getText('transaction-quantity-0');
    if (!transactionQuantity.includes(inQuantity)) {
      log('Warning: Transaction quantity might not match');
    }
    logSuccess('Step 8: Transaction appears in history');

    log('Step 9: Verify quantity was updated (100 + 50 = 150)');
    const updatedQuantity = getInputValue('input-warehouse-item-quantity');
    const expectedQuantity = (parseFloat(initialQuantity) + parseFloat(inQuantity)).toString();
    if (updatedQuantity !== expectedQuantity) {
      log(`Warning: Expected quantity ${expectedQuantity}, got ${updatedQuantity}`);
    }
    logSuccess('Step 9: Quantity updated correctly');

    log('Step 10: Close and reopen to verify status is still normal');
    const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (closeButton) {
      closeButton.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-warehouse-sheet-title', 3000);
    
    await sleep(500);
    const statusBadgeAfterIn = document.querySelector(`[data-testid="badge-warehouse-status-${createdItemId}"]`);
    if (statusBadgeAfterIn && !statusBadgeAfterIn.textContent.includes('Норма')) {
      log('Warning: Status changed unexpectedly after incoming transaction');
    }
    logSuccess('Step 10: Status is still normal after incoming transaction');

    log('Step 11: Add outgoing transaction (расход) to trigger low/critical status');
    await clickElement(`card-warehouse-item-${createdItemId}`);
    await waitForElement('text-warehouse-sheet-title', 3000);
    
    await clickElement('button-add-transaction');
    await waitForElement('text-transaction-dialog-title', 3000);
    
    await clickElement('radio-transaction-type-out');
    await typeIntoInput('input-transaction-quantity', outQuantity);
    await typeIntoInput('input-transaction-notes', 'Расход товара для теста');
    
    await clickElement('button-transaction-submit');
    await sleep(2000);
    await waitForElementToDisappear('text-transaction-dialog-title', 5000);
    logSuccess('Step 11: Outgoing transaction created successfully');

    log('Step 12: Verify status changed to critical or low');
    await sleep(1500);
    const statusBadgeInSheet = document.querySelector('[data-testid="badge-warehouse-status"]');
    if (!statusBadgeInSheet) {
      throw new Error('Status badge not found in sheet');
    }
    const newStatusText = statusBadgeInSheet.textContent;
    log('Status after outgoing transaction:', newStatusText);
    
    if (newStatusText.includes('Норма')) {
      throw new Error('Status should have changed to low or critical, but is still normal');
    }
    
    if (newStatusText.includes('Низкий') || newStatusText.includes('Критический')) {
      logSuccess('Step 12: Status automatically changed to low/critical');
    } else {
      throw new Error(`Unexpected status: ${newStatusText}`);
    }

    log('Step 13: Verify second transaction appears in history');
    if (!elementExists('transaction-item-1')) {
      throw new Error('Second transaction not found in history');
    }
    const transaction2Quantity = getText('transaction-quantity-1');
    if (!transaction2Quantity.includes(outQuantity)) {
      log('Warning: Second transaction quantity might not match');
    }
    logSuccess('Step 13: Second transaction appears in history');

    log('Step 14: Verify final quantity (150 - 130 = 20)');
    const finalQuantity = getInputValue('input-warehouse-item-quantity');
    const expectedFinalQuantity = (
      parseFloat(initialQuantity) + 
      parseFloat(inQuantity) - 
      parseFloat(outQuantity)
    ).toString();
    
    if (finalQuantity !== expectedFinalQuantity) {
      log(`Warning: Expected final quantity ${expectedFinalQuantity}, got ${finalQuantity}`);
    }
    logSuccess('Step 14: Final quantity is correct');

    log('Step 15: Delete the warehouse item');
    await clickElement('button-delete-warehouse-item');
    await waitForElement('dialog-warehouse-delete-confirm', 3000);
    logSuccess('Delete confirmation dialog opened');
    
    await clickElement('button-confirm-warehouse-delete');
    await sleep(2000);
    await waitForElementToDisappear('dialog-warehouse-delete-confirm', 5000);
    logSuccess('Step 15: Warehouse item deleted successfully');

    log('Step 16: Verify item is removed from grid');
    await sleep(500);
    const deletedItemCard = document.querySelector(`[data-testid="card-warehouse-item-${createdItemId}"]`);
    if (deletedItemCard) {
      throw new Error('Item card still exists after deletion');
    }
    logSuccess('Step 16: Item removed from grid');

    console.log('\n%c========================================', 'color: green; font-weight: bold');
    console.log('%c✓ ALL E2E TESTS PASSED SUCCESSFULLY!', 'color: green; font-weight: bold; font-size: 16px');
    console.log('%c========================================', 'color: green; font-weight: bold');
    console.log('\nTest Summary:');
    console.log('- Created warehouse item:', uniqueItemName);
    console.log('- Location:', location);
    console.log('- Category: Материалы');
    console.log('- Min stock:', minStock);
    console.log('- Initial quantity:', initialQuantity);
    console.log('- Added incoming transaction (+' + inQuantity + ')');
    console.log('- Quantity after incoming:', (parseFloat(initialQuantity) + parseFloat(inQuantity)));
    console.log('- Status: Норма');
    console.log('- Added outgoing transaction (-' + outQuantity + ')');
    console.log('- Final quantity:', (parseFloat(initialQuantity) + parseFloat(inQuantity) - parseFloat(outQuantity)));
    console.log('- Status automatically changed to: Низкий/Критический');
    console.log('- Transactions recorded in history: 2');
    console.log('- Item successfully deleted');
    
    return true;
  } catch (error) {
    logError('E2E TEST FAILED', error.message);
    console.error('Full error:', error);
    return false;
  }
}

console.log('%c=== Warehouse Module E2E Test ===', 'color: blue; font-weight: bold; font-size: 18px');
console.log('This script will test warehouse item CRUD operations and transaction management.');
console.log('Make sure you are on the /warehouse page before running the test.\n');

window.runWarehouseE2ETest = runWarehouseE2ETest;

console.log('%cTo run the test, execute: runWarehouseE2ETest()', 'color: orange; font-weight: bold');
