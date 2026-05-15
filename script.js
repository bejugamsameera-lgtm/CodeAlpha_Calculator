/**
 * Precision Calc - Core Logic
 */

const mainDisplay = document.getElementById('main-display');
const expressionDisplay = document.getElementById('expression-display');
const previewDisplay = document.getElementById('preview-display');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const historyToggle = document.getElementById('history-toggle');
const historyClose = document.getElementById('history-close');

let currentInput = '0';
let expression = '';
let isResult = false;
let history = [];

function updateDisplay() {
    mainDisplay.textContent = currentInput;
    expressionDisplay.textContent = expression.replace(/\*/g, '×').replace(/\//g, '÷');
    expressionDisplay.scrollLeft = expressionDisplay.scrollWidth;

    if (!isResult && expression !== '') {
        const fullExpr = expression + (currentInput === '0' && expression.endsWith(' ') ? '' : currentInput);
        const resultValue = calculate(fullExpr);
        if (resultValue !== 'Error') {
            previewDisplay.textContent = `Preview: ${resultValue}`;
        } else {
            previewDisplay.textContent = '';
        }
    } else {
        previewDisplay.textContent = '';
    }
}

function calculate(expr) {
    try {
        const sanitized = expr.replace(/[^-+/*0-9.]/g, '');
        if (!sanitized) return '0';
        const res = new Function(`return ${sanitized}`)();
        if (!isFinite(res) || isNaN(res)) return 'Error';
        return Number(parseFloat(res.toFixed(8)).toString()).toString();
    } catch {
        return 'Error';
    }
}

function appendNumber(num) {
    if (isResult) {
        currentInput = num;
        expression = '';
        isResult = false;
    } else {
        if (currentInput === '0') {
            currentInput = num;
        } else if (currentInput.length < 15) {
            currentInput += num;
        }
    }
    updateDisplay();
}

function appendOperator(op) {
    const realOp = op === '×' ? '*' : op === '÷' ? '/' : op;
    if (isResult) {
        expression = currentInput + ' ' + realOp + ' ';
        currentInput = '0';
        isResult = false;
    } else if (currentInput === '0' && expression === '') {
        if (realOp === '-') currentInput = '-';
    } else if (currentInput === '0' && expression.endsWith(' ')) {
        expression = expression.slice(0, -3) + ' ' + realOp + ' ';
    } else {
        expression += currentInput + ' ' + realOp + ' ';
        currentInput = '0';
    }
    updateDisplay();
}

function compute() {
    if (expression === '' && !isResult) return;
    let finalExpr = expression + currentInput;
    if (finalExpr.endsWith(' ')) finalExpr = finalExpr.trim().slice(0, -1);
    const resValue = calculate(finalExpr);
    if (resValue !== 'Error') saveToHistory(finalExpr, resValue);
    currentInput = resValue;
    expression = '';
    isResult = true;
    updateDisplay();
}

function clearAll() {
    currentInput = '0';
    expression = '';
    isResult = false;
    updateDisplay();
}

function backspace() {
    if (isResult) {
        expression = '';
        isResult = false;
    } else if (currentInput !== '0') {
        currentInput = currentInput.slice(0, -1);
        if (currentInput === '' || currentInput === '-') currentInput = '0';
    }
    updateDisplay();
}

function appendDecimal() {
    if (isResult) {
        currentInput = '0.';
        expression = '';
        isResult = false;
    } else if (!currentInput.includes('.')) {
        currentInput += '.';
    }
    updateDisplay();
}

function saveToHistory(expr, res) {
    const item = {
        expression: expr.replace(/\*/g, '×').replace(/\//g, '÷'),
        result: res,
        timestamp: Date.now()
    };
    history.unshift(item);
    if (history.length > 20) history.pop();
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history flex h-full flex-col items-center justify-center text-neutral-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-10"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
                <p class="text-[10px] font-mono uppercase tracking-[0.2em] font-medium">Memory is empty</p>
            </div>
        `;
        return;
    }
    historyList.innerHTML = history.map((item, i) => `
        <div class="history-item fade-in" style="animation-delay: ${i * 0.05}s">
            <span class="history-expr">${item.expression}</span>
            <span class="history-res" onclick="copyToClipboard('${item.result}')">
                = ${item.result}
            </span>
        </div>
    `).join('');
}

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
};

document.querySelectorAll('[data-num]').forEach(btn => btn.addEventListener('click', () => appendNumber(btn.dataset.num)));
document.querySelectorAll('[data-op]').forEach(btn => btn.addEventListener('click', () => appendOperator(btn.dataset.op)));
document.querySelector('[data-action="calculate"]').addEventListener('click', compute);
document.querySelector('[data-action="all-clear"]').addEventListener('click', clearAll);
document.querySelector('[data-action="backspace"]').addEventListener('click', backspace);
document.querySelector('[data-action="decimal"]').addEventListener('click', appendDecimal);
historyToggle.addEventListener('click', () => historyPanel.classList.remove('translate-y-full'));
historyClose.addEventListener('click', () => historyPanel.classList.add('translate-y-full'));

window.addEventListener('keydown', (e) => {
    if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
    if (e.key === '+') appendOperator('+');
    if (e.key === '-') appendOperator('-');
    if (e.key === '*' || e.key === 'x') appendOperator('×');
    if (e.key === '/') { e.preventDefault(); appendOperator('÷'); }
    if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); compute(); }
    if (e.key === 'Backspace') backspace();
    if (e.key === 'Escape') clearAll();
    if (e.key === '.') appendDecimal();
});

updateDisplay();
