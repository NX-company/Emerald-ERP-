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

const setSliderValue = async (testId, value) => {
  const slider = document.querySelector(`[data-testid="${testId}"] [role="slider"]`);
  if (!slider) throw new Error(`Slider with testid="${testId}" not found`);
  
  slider.setAttribute('aria-valuenow', value.toString());
  slider.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(200);
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

async function runProductionE2ETest() {
  const uniqueItemName = `Test Item ${nanoid(6)}`;
  const stage1Name = `Стадия 1 ${nanoid(4)}`;
  const stage2Name = `Стадия 2 ${nanoid(4)}`;
  let createdTaskId = null;

  try {
    log('Starting E2E test for Production module...');
    
    log('Step 1: Verify we are on Production page');
    await sleep(1000);
    if (!window.location.pathname.includes('/production')) {
      throw new Error('Not on Production page. Please navigate to /production first');
    }
    logSuccess('Step 1: On Production page');

    log('Step 2: Click on first existing production task card');
    const firstTaskCard = document.querySelector('[data-testid^="card-production-"]');
    if (!firstTaskCard) {
      throw new Error('No production task cards found. Please create at least one task first');
    }
    const firstTaskTestId = firstTaskCard.getAttribute('data-testid');
    await clickElement(firstTaskTestId);
    await waitForElement('text-production-sheet-title', 3000);
    logSuccess('Step 2: Production task detail sheet opened');

    log('Step 3: Verify task data is displayed in form');
    const itemNameValue = getInputValue('input-production-item-name');
    if (!itemNameValue) {
      throw new Error('Item name not loaded in form');
    }
    log('Item name in form:', itemNameValue);
    logSuccess('Step 3: Task data loaded in form');

    log('Step 4: Close the sheet');
    const sheetCloseButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (sheetCloseButton) {
      sheetCloseButton.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-production-sheet-title', 3000);
    logSuccess('Step 4: Sheet closed');

    log('Step 5: Click "New Task" button to open create dialog');
    await clickElement('button-create-production');
    await waitForElement('text-production-dialog-title', 3000);
    logSuccess('Step 5: Create dialog opened');

    log('Step 6: Fill form and create new production task');
    await typeIntoInput('input-create-production-item-name', uniqueItemName);
    await typeIntoInput('input-create-production-payment', '15000');
    
    const workerSelect = document.querySelector('[data-testid="select-create-production-worker"]');
    if (workerSelect) {
      await clickElement('select-create-production-worker');
      await sleep(300);
      const firstWorkerOption = document.querySelector('[data-testid^="option-create-production-worker-"]');
      if (firstWorkerOption) {
        firstWorkerOption.click();
        await sleep(300);
      }
    }

    await setSliderValue('slider-create-production-progress', 20);
    await selectOption('select-create-production-status', 'option-create-production-status-in_progress');

    log('Step 7: Submit the form to create production task');
    await clickElement('button-submit-create-production');
    await waitForElementToDisappear('text-production-dialog-title', 3000);
    logSuccess('Step 7: Production task created successfully');

    log('Step 8: Wait for new task card to appear');
    await sleep(1000);
    const allTaskCards = Array.from(document.querySelectorAll('[data-testid^="card-production-"]'));
    const newTaskCard = allTaskCards.find(card => {
      const itemNameEl = card.querySelector(`[data-testid^="text-production-item-name-"]`);
      return itemNameEl && itemNameEl.textContent.includes(uniqueItemName);
    });
    
    if (!newTaskCard) {
      throw new Error('Newly created task card not found');
    }
    createdTaskId = newTaskCard.getAttribute('data-testid').replace('card-production-', '');
    log('Created task ID:', createdTaskId);
    logSuccess('Step 8: New task card found');

    log('Step 9: Open the newly created task');
    await clickElement(`card-production-${createdTaskId}`);
    await waitForElement('text-production-sheet-title', 3000);
    logSuccess('Step 9: Newly created task opened');

    log('Step 10: Add first production stage');
    await clickElement('button-add-production-stage');
    await waitForElement('input-new-production-stage-name', 2000);
    await typeIntoInput('input-new-production-stage-name', stage1Name);
    await clickElement('button-save-production-stage');
    await sleep(1000);
    logSuccess('Step 10: First stage added');

    log('Step 11: Add second production stage');
    await clickElement('button-add-production-stage');
    await waitForElement('input-new-production-stage-name', 2000);
    await typeIntoInput('input-new-production-stage-name', stage2Name);
    await clickElement('button-save-production-stage');
    await sleep(1000);
    logSuccess('Step 11: Second stage added');

    log('Step 12: Update first stage status to completed');
    const firstStageCard = document.querySelector('[data-testid^="card-production-stage-"]');
    if (firstStageCard) {
      const stageId = firstStageCard.getAttribute('data-testid').replace('card-production-stage-', '');
      await selectOption(`select-stage-status-${stageId}`, `option-stage-status-${stageId}-completed`);
      await sleep(500);
      logSuccess('Step 12: First stage marked as completed');
    } else {
      throw new Error('First stage card not found');
    }

    log('Step 13: Generate QR code for task');
    if (elementExists('button-generate-qr')) {
      await clickElement('button-generate-qr');
      await sleep(1000);
      if (elementExists('text-production-qr-code')) {
        logSuccess('Step 13: QR code generated');
      } else {
        throw new Error('QR code not displayed after generation');
      }
    } else {
      log('QR code already exists, skipping generation');
      logSuccess('Step 13: QR code already exists');
    }

    log('Step 14: Update task progress and status');
    await setSliderValue('slider-production-progress', 75);
    await selectOption('select-production-status', 'option-production-status-in_progress');
    logSuccess('Step 14: Task progress and status updated');

    log('Step 15: Save the task');
    await clickElement('button-save-production');
    await sleep(1000);
    logSuccess('Step 15: Task saved successfully');

    log('Step 16: Test tabs filtering');
    const sheetCloseButton2 = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (sheetCloseButton2) {
      sheetCloseButton2.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-production-sheet-title', 2000);
    
    await clickElement('tab-production-in_progress');
    await sleep(500);
    if (!elementExists(`card-production-${createdTaskId}`)) {
      throw new Error('Task not visible in "In Progress" tab');
    }
    logSuccess('Step 16: Task visible in "In Progress" tab');

    log('Step 17: Test "All" tab');
    await clickElement('tab-production-all');
    await sleep(500);
    if (!elementExists(`card-production-${createdTaskId}`)) {
      throw new Error('Task not visible in "All" tab');
    }
    logSuccess('Step 17: Task visible in "All" tab');

    log('Step 18: Open task for deletion');
    await clickElement(`card-production-${createdTaskId}`);
    await waitForElement('text-production-sheet-title', 3000);
    logSuccess('Step 18: Task opened for deletion');

    log('Step 19: Delete the production task');
    await clickElement('button-delete-production');
    await sleep(500);
    
    const confirmButton = document.querySelector('[data-testid="button-confirm-delete-production"]');
    if (confirmButton) {
      confirmButton.click();
      await sleep(1000);
    }
    await waitForElementToDisappear('text-production-sheet-title', 3000);
    logSuccess('Step 19: Production task deleted');

    log('Step 20: Verify task is removed from list');
    await sleep(1000);
    if (elementExists(`card-production-${createdTaskId}`)) {
      throw new Error('Task still visible after deletion');
    }
    logSuccess('Step 20: Task successfully removed from list');

    console.log('%c\n🎉 ALL TESTS PASSED! Production module E2E test completed successfully!\n', 
      'color: green; font-size: 16px; font-weight: bold');
    
    return {
      success: true,
      message: 'All Production E2E tests passed successfully',
      createdTaskId
    };

  } catch (error) {
    logError('Test failed', error);
    console.error('%c\n❌ TEST FAILED\n', 'color: red; font-size: 16px; font-weight: bold');
    
    return {
      success: false,
      error: error.message,
      createdTaskId
    };
  }
}

if (typeof window !== 'undefined') {
  window.runProductionE2ETest = runProductionE2ETest;
  console.log('%c\nProduction E2E Test loaded! Run with: runProductionE2ETest()\n', 
    'color: blue; font-size: 14px; font-weight: bold');
}

export { runProductionE2ETest };
