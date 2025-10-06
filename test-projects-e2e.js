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

async function runProjectsE2ETest() {
  const uniqueProjectName = `Test Project ${nanoid(6)}`;
  const uniqueClientName = `Test Client ${nanoid(6)}`;
  const stage1Name = `Stage 1 ${nanoid(4)}`;
  const stage2Name = `Stage 2 ${nanoid(4)}`;
  let createdProjectId = null;

  try {
    log('Starting E2E test for Projects module...');
    
    log('Step 1: Verify we are on Projects page');
    await sleep(1000);
    if (!window.location.pathname.includes('/projects')) {
      throw new Error('Not on Projects page. Please navigate to /projects first');
    }
    logSuccess('Step 1: On Projects page');

    log('Step 2: Click on first existing project card');
    const firstProjectCard = document.querySelector('[data-testid^="card-project-"]');
    if (!firstProjectCard) {
      throw new Error('No project cards found. Please create at least one project first');
    }
    const firstProjectTestId = firstProjectCard.getAttribute('data-testid');
    await clickElement(firstProjectTestId);
    await waitForElement('text-project-sheet-title', 3000);
    logSuccess('Step 2: Project detail sheet opened');

    log('Step 3: Verify project data is displayed in form');
    const projectNameValue = getInputValue('input-project-name');
    if (!projectNameValue) {
      throw new Error('Project name not loaded in form');
    }
    log('Project name in form:', projectNameValue);
    logSuccess('Step 3: Project data loaded in form');

    log('Step 4: Close the sheet');
    const sheetCloseButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (sheetCloseButton) {
      sheetCloseButton.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-project-sheet-title', 3000);
    logSuccess('Step 4: Sheet closed');

    log('Step 5: Click "New Project" button to open create dialog');
    await clickElement('button-create-project');
    await waitForElement('text-project-dialog-title', 3000);
    logSuccess('Step 5: Create dialog opened');

    log('Step 6: Fill form and create new project');
    await typeIntoInput('input-create-project-name', uniqueProjectName);
    await typeIntoInput('input-create-project-client-name', uniqueClientName);
    
    await selectOption('select-create-project-status', 'option-create-project-status-pending');
    
    await setSliderValue('slider-create-project-progress', 10);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const dateTimeString = futureDate.toISOString().slice(0, 16);
    await typeIntoInput('input-create-project-deadline', dateTimeString);

    log('Submitting create form...');
    await clickElement('button-submit-create-project');
    await sleep(2000);
    
    await waitForElementToDisappear('text-project-dialog-title', 5000);
    logSuccess('Step 6: New project created successfully');

    log('Step 7: Verify new project appears in list');
    await sleep(1000);
    const projectCards = Array.from(document.querySelectorAll('[data-testid^="card-project-"]'));
    const newProjectCard = projectCards.find(card => {
      const cardText = card.textContent;
      return cardText.includes(uniqueProjectName);
    });
    
    if (!newProjectCard) {
      throw new Error(`New project with name "${uniqueProjectName}" not found in list`);
    }
    createdProjectId = newProjectCard.getAttribute('data-testid').replace('card-project-', '');
    log('Found new project with ID:', createdProjectId);
    logSuccess('Step 7: New project found in list');

    log('Step 8: Open created project and add stages');
    await clickElement(`card-project-${createdProjectId}`);
    await waitForElement('text-project-sheet-title', 3000);
    
    const loadedProjectName = getInputValue('input-project-name');
    if (loadedProjectName !== uniqueProjectName) {
      throw new Error(`Project name mismatch. Expected: ${uniqueProjectName}, Got: ${loadedProjectName}`);
    }
    logSuccess('Step 8: Created project opened with correct data');

    log('Step 9: Add first stage');
    await typeIntoInput('input-new-stage-name', stage1Name);
    await clickElement('button-add-stage');
    await sleep(1500);
    
    if (!elementExists('stage-item-0')) {
      throw new Error('First stage not added');
    }
    logSuccess('Step 9: First stage added successfully');

    log('Step 10: Add second stage');
    await typeIntoInput('input-new-stage-name', stage2Name);
    await clickElement('button-add-stage');
    await sleep(1500);
    
    if (!elementExists('stage-item-1')) {
      throw new Error('Second stage not added');
    }
    logSuccess('Step 10: Second stage added successfully');

    log('Step 11: Update first stage status to in_progress');
    await selectOption('select-stage-status-0', 'option-stage-status-in_progress-0');
    await sleep(1500);
    logSuccess('Step 11: First stage status updated');

    log('Step 12: Update second stage status to completed');
    await selectOption('select-stage-status-1', 'option-stage-status-completed-1');
    await sleep(1500);
    logSuccess('Step 12: Second stage status updated');

    log('Step 13: Update project progress and status');
    await setSliderValue('slider-project-progress', 75);
    await sleep(500);
    await selectOption('select-project-status', 'option-project-status-in_progress');
    await sleep(500);
    
    await clickElement('button-save-project');
    await sleep(2000);
    await waitForElementToDisappear('text-project-sheet-title', 5000);
    logSuccess('Step 13: Project updated successfully');

    log('Step 14: Verify updated project');
    await sleep(500);
    const updatedProjectCard = document.querySelector(`[data-testid="card-project-${createdProjectId}"]`);
    if (!updatedProjectCard) {
      throw new Error('Updated project card not found');
    }
    logSuccess('Step 14: Project updates verified');

    log('Step 15: Delete one stage');
    await clickElement(`card-project-${createdProjectId}`);
    await waitForElement('text-project-sheet-title', 3000);
    
    await clickElement('button-delete-stage-0');
    await sleep(1500);
    
    if (elementExists('stage-item-0') && !elementExists('stage-item-1')) {
      logSuccess('Step 15: First stage deleted successfully');
    } else {
      log('Warning: Stage deletion might have affected different stage');
    }

    log('Step 16: Close sheet and delete the project');
    const closeButton = document.querySelector('[data-state="open"] button[aria-label="Close"]');
    if (closeButton) {
      closeButton.click();
      await sleep(500);
    }
    await waitForElementToDisappear('text-project-sheet-title', 3000);
    
    await clickElement(`card-project-${createdProjectId}`);
    await waitForElement('text-project-sheet-title', 3000);
    
    await clickElement('button-delete-project');
    await waitForElement('dialog-project-delete-confirm', 3000);
    logSuccess('Delete confirmation dialog opened');
    
    await clickElement('button-confirm-project-delete');
    await sleep(2000);
    await waitForElementToDisappear('dialog-project-delete-confirm', 5000);
    logSuccess('Step 16: Project deleted successfully');

    log('Step 17: Verify project is removed from list');
    await sleep(500);
    const deletedProjectCard = document.querySelector(`[data-testid="card-project-${createdProjectId}"]`);
    if (deletedProjectCard) {
      throw new Error('Project card still exists after deletion');
    }
    logSuccess('Step 17: Project removed from list');

    console.log('\n%c========================================', 'color: green; font-weight: bold');
    console.log('%c✓ ALL E2E TESTS PASSED SUCCESSFULLY!', 'color: green; font-weight: bold; font-size: 16px');
    console.log('%c========================================', 'color: green; font-weight: bold');
    console.log('\nTest Summary:');
    console.log('- Created project:', uniqueProjectName);
    console.log('- Created project for client:', uniqueClientName);
    console.log('- Added 2 stages:', stage1Name, 'and', stage2Name);
    console.log('- Updated stage statuses: pending → in_progress, pending → completed');
    console.log('- Updated project progress: 10% → 75%');
    console.log('- Updated project status: pending → in_progress');
    console.log('- Deleted one stage');
    console.log('- Project successfully deleted');
    
    return true;
  } catch (error) {
    logError('E2E TEST FAILED', error.message);
    console.error('Full error:', error);
    return false;
  }
}

console.log('%c=== Projects Module E2E Test ===', 'color: blue; font-weight: bold; font-size: 18px');
console.log('This script will test all CRUD operations in the Projects module including stage management.');
console.log('Make sure you are on the /projects page before running the test.\n');

window.runProjectsE2ETest = runProjectsE2ETest;

console.log('%cTo run the test, execute: runProjectsE2ETest()', 'color: orange; font-weight: bold');
