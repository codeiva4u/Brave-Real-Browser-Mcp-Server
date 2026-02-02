/**
 * Form Automator Module
 * Features: Auto-fill forms, human-like typing, field detection, smart form submission
 * Compatible with brave-real-browser ecosystem
 */

// Field type detection patterns
const FIELD_PATTERNS = {
    email: [/email/i, /e-mail/i, /mail/i],
    password: [/password/i, /pass/i, /pwd/i],
    username: [/username/i, /user/i, /login/i, /uname/i],
    firstName: [/first.?name/i, /fname/i, /given.?name/i],
    lastName: [/last.?name/i, /lname/i, /surname/i, /family.?name/i],
    fullName: [/full.?name/i, /name/i],
    phone: [/phone/i, /tel/i, /mobile/i, /cell/i],
    address: [/address/i, /street/i, /addr/i],
    city: [/city/i, /town/i],
    state: [/state/i, /province/i, /region/i],
    zip: [/zip/i, /postal/i, /postcode/i],
    country: [/country/i, /nation/i],
    cardNumber: [/card.?number/i, /cc.?num/i, /credit.?card/i],
    cvv: [/cvv/i, /cvc/i, /security.?code/i],
    expiry: [/expir/i, /exp.?date/i],
    search: [/search/i, /query/i, /q/i],
    message: [/message/i, /comment/i, /feedback/i, /note/i],
    company: [/company/i, /organization/i, /org/i],
    website: [/website/i, /url/i, /web/i],
    age: [/age/i, /birth/i, /dob/i],
};

// Human-like typing with variable delays and occasional typos
async function humanType(page, selector, text, options = {}) {
    const {
        minDelay = 50,
        maxDelay = 150,
        errorRate = 0.02,  // 2% typo rate
        correctionDelay = 200,
    } = options;
    
    const element = await page.$(selector);
    if (!element) {
        throw new Error(`Element not found: ${selector}`);
    }
    
    // Focus and clear field
    await element.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('a');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Random delay between keystrokes
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        await new Promise(r => setTimeout(r, delay));
        
        // Simulate occasional typo
        if (Math.random() < errorRate && i > 0 && i < text.length - 1) {
            // Type wrong character
            const wrongChar = String.fromCharCode(char.charCodeAt(0) + (Math.random() > 0.5 ? 1 : -1));
            await page.keyboard.type(wrongChar);
            await new Promise(r => setTimeout(r, correctionDelay));
            
            // Delete and type correct character
            await page.keyboard.press('Backspace');
            await new Promise(r => setTimeout(r, 50 + Math.random() * 50));
        }
        
        await page.keyboard.type(char);
    }
    
    return true;
}

// Detect field type from attributes
function detectFieldType(attributes) {
    const { name = '', id = '', type = '', placeholder = '', label = '', autocomplete = '' } = attributes;
    const combined = `${name} ${id} ${type} ${placeholder} ${label} ${autocomplete}`.toLowerCase();
    
    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(combined)) {
                return fieldType;
            }
        }
    }
    
    return 'unknown';
}

// Get all form fields with their types
async function getFormFields(page, formSelector = 'form') {
    return await page.evaluate((selector) => {
        const form = document.querySelector(selector);
        if (!form) return [];
        
        const inputs = form.querySelectorAll('input, textarea, select');
        const fields = [];
        
        inputs.forEach((input, index) => {
            // Find associated label
            let label = '';
            if (input.id) {
                const labelEl = document.querySelector(`label[for="${input.id}"]`);
                if (labelEl) label = labelEl.textContent.trim();
            }
            if (!label) {
                const parent = input.closest('label');
                if (parent) label = parent.textContent.replace(input.value || '', '').trim();
            }
            
            fields.push({
                index,
                tagName: input.tagName.toLowerCase(),
                type: input.type || 'text',
                name: input.name || '',
                id: input.id || '',
                placeholder: input.placeholder || '',
                label,
                autocomplete: input.autocomplete || '',
                required: input.required,
                value: input.value || '',
                visible: input.offsetWidth > 0 && input.offsetHeight > 0,
                selector: input.id ? `#${input.id}` : 
                         input.name ? `[name="${input.name}"]` : 
                         `${selector} ${input.tagName.toLowerCase()}:nth-of-type(${index + 1})`
            });
        });
        
        return fields;
    }, formSelector);
}

// Auto-fill form with provided data
async function fillForm(page, formSelector, data, options = {}) {
    const {
        humanLike = true,
        clearFields = true,
        submitAfter = false,
        submitSelector = 'button[type="submit"], input[type="submit"]',
        delayBetweenFields = 500,
    } = options;
    
    const fields = await getFormFields(page, formSelector);
    const filledFields = [];
    const errors = [];
    
    for (const field of fields) {
        if (!field.visible) continue;
        
        // Detect field type
        const fieldType = detectFieldType(field);
        
        // Find matching data
        let value = null;
        
        // Try exact match first
        if (data[field.name]) value = data[field.name];
        else if (data[field.id]) value = data[field.id];
        else if (data[fieldType]) value = data[fieldType];
        
        // Skip if no value found
        if (!value) continue;
        
        try {
            // Handle different input types
            if (field.tagName === 'select') {
                await page.select(field.selector, value);
            } else if (field.type === 'checkbox') {
                const isChecked = await page.$eval(field.selector, el => el.checked);
                if ((value === true || value === 'true' || value === '1') && !isChecked) {
                    await page.click(field.selector);
                } else if ((value === false || value === 'false' || value === '0') && isChecked) {
                    await page.click(field.selector);
                }
            } else if (field.type === 'radio') {
                const radioSelector = `${field.selector}[value="${value}"]`;
                await page.click(radioSelector);
            } else {
                // Text inputs
                if (humanLike) {
                    await humanType(page, field.selector, value.toString());
                } else {
                    if (clearFields) {
                        await page.$eval(field.selector, el => el.value = '');
                    }
                    await page.type(field.selector, value.toString());
                }
            }
            
            filledFields.push({
                field: field.name || field.id || field.selector,
                type: fieldType,
                success: true
            });
            
            // Delay between fields for human-like behavior
            if (humanLike) {
                await new Promise(r => setTimeout(r, delayBetweenFields * (0.5 + Math.random())));
            }
            
        } catch (err) {
            errors.push({
                field: field.name || field.id || field.selector,
                error: err.message
            });
        }
    }
    
    // Submit form if requested
    let submitted = false;
    if (submitAfter) {
        try {
            const submitButton = await page.$(submitSelector);
            if (submitButton) {
                await submitButton.click();
                submitted = true;
            } else {
                // Try form.submit()
                await page.$eval(formSelector, form => form.submit());
                submitted = true;
            }
        } catch (err) {
            errors.push({ field: 'submit', error: err.message });
        }
    }
    
    return {
        success: errors.length === 0,
        filledFields,
        errors,
        submitted,
        totalFields: fields.filter(f => f.visible).length
    };
}

// Fill form with auto-detection
async function autoFillForm(page, formSelector, userData = {}) {
    // Default test data for common fields
    const defaultData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        username: 'testuser',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        phone: '+1-555-123-4567',
        address: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'United States',
        company: 'Acme Corp',
        website: 'https://example.com',
        message: 'This is a test message.',
        ...userData
    };
    
    return fillForm(page, formSelector, defaultData, { humanLike: true });
}

// Quick fill specific field
async function fillField(page, selector, value, options = {}) {
    const { humanLike = true, clear = true } = options;
    
    if (humanLike) {
        return await humanType(page, selector, value);
    } else {
        if (clear) {
            await page.$eval(selector, el => el.value = '');
        }
        await page.type(selector, value);
        return true;
    }
}

// Submit form with optional wait
async function submitForm(page, formSelector, options = {}) {
    const {
        waitForNavigation = true,
        waitTimeout = 30000,
        submitSelector = 'button[type="submit"], input[type="submit"]'
    } = options;
    
    const form = await page.$(formSelector);
    if (!form) {
        throw new Error(`Form not found: ${formSelector}`);
    }
    
    const submitButton = await page.$(submitSelector);
    
    if (waitForNavigation) {
        const navigationPromise = page.waitForNavigation({ timeout: waitTimeout }).catch(() => null);
        
        if (submitButton) {
            await submitButton.click();
        } else {
            await page.$eval(formSelector, f => f.submit());
        }
        
        await navigationPromise;
    } else {
        if (submitButton) {
            await submitButton.click();
        } else {
            await page.$eval(formSelector, f => f.submit());
        }
    }
    
    return { submitted: true, url: page.url() };
}

// Export all functions
export {
    humanType,
    detectFieldType,
    getFormFields,
    fillForm,
    autoFillForm,
    fillField,
    submitForm,
    FIELD_PATTERNS
};

export default {
    humanType,
    detectFieldType,
    getFormFields,
    fillForm,
    autoFillForm,
    fillField,
    submitForm,
    FIELD_PATTERNS
};
