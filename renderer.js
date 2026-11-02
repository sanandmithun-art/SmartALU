"use strict";

// ============================================
// SMARTALU - 8 BIT EDUCATIONAL SIMULATOR
// ============================================

const $ = id => document.getElementById(id);

const MASK = 255;
const SIGN = 128;

let operationHistory = [];
let currentLesson = "ADD";

function binary(value) {
    return (value & MASK).toString(2).padStart(8, "0");
}

function negative(value) {
    return (value & SIGN) !== 0;
}

function readInput(element, required = true) {
    const value = element.value.trim();

    if (!value && !required) return 0;

    if (!/^[01]{8}$/.test(value)) {
        throw new Error("Enter exactly 8 binary digits (0 or 1).");
    }

    return parseInt(value, 2);
}

// ============================================
// NAVIGATION
// ============================================

document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => {

        document.querySelectorAll(".nav-button").forEach(b =>
            b.classList.remove("active")
        );

        document.querySelectorAll(".page").forEach(page =>
            page.classList.remove("active")
        );

        button.classList.add("active");
        $(button.dataset.page).classList.add("active");
    });
});

// ============================================
// ALU CALCULATIONS
// ============================================

function performOperation(operation) {

    try {
        const a = readInput($("inputA"));
        const unary = ["NOT", "INC", "DEC", "SHL", "SHR"];
        const b = readInput($("inputB"), !unary.includes(operation));

        let result = 0;
        let carry = 0;
        let overflow = 0;
        let description = "";

        switch (operation) {

            case "ADD": {
                const sum = a + b;
                result = sum & MASK;
                carry = sum > MASK ? 1 : 0;
                overflow = (!(negative(a) ^ negative(b)) &&
                    (negative(a) ^ negative(result))) ? 1 : 0;
                description = "Adds Operand A and Operand B.";
                break;
            }

            case "SUB":
                result = (a - b) & MASK;
                carry = a < b ? 1 : 0;
                overflow = ((negative(a) ^ negative(b)) &&
                    (negative(a) ^ negative(result))) ? 1 : 0;
                description = "Subtracts Operand B from Operand A.";
                break;

            case "INC":
                result = (a + 1) & MASK;
                overflow = a === 127 ? 1 : 0;
                description = "Increments Operand A by one.";
                break;

            case "DEC":
                result = (a - 1) & MASK;
                overflow = a === 128 ? 1 : 0;
                description = "Decrements Operand A by one.";
                break;

            case "AND":
                result = a & b;
                description = "Performs bitwise AND.";
                break;

            case "OR":
                result = a | b;
                description = "Performs bitwise OR.";
                break;

            case "NOT":
                result = (~a) & MASK;
                description = "Inverts all bits of Operand A.";
                break;

            case "XOR":
                result = a ^ b;
                description = "Performs exclusive OR.";
                break;

            case "NAND":
                result = (~(a & b)) & MASK;
                description = "Performs AND followed by inversion.";
                break;

            case "NOR":
                result = (~(a | b)) & MASK;
                description = "Performs OR followed by inversion.";
                break;

            case "XNOR":
                result = (~(a ^ b)) & MASK;
                description = "Performs exclusive NOR.";
                break;

            case "SHL":
                carry = negative(a) ? 1 : 0;
                result = (a << 1) & MASK;
                overflow = (negative(a) !== negative(result)) ? 1 : 0;
                description = "Shifts Operand A one bit to the left.";
                break;

            case "SHR":
                carry = a & 1;
                result = a >>> 1;
                description = "Shifts Operand A one bit to the right.";
                break;

            default:
                throw new Error("Unknown operation.");
        }

        const zero = result === 0 ? 1 : 0;
        const sign = negative(result) ? 1 : 0;

        const output = binary(result);

        $("result").textContent = output;
        $("decimalResult").textContent = result;
        $("operationName").textContent = operation;
        $("message").textContent = "Operation completed successfully.";

        $("carryFlag").textContent = carry;
        $("zeroFlag").textContent = zero;
        $("signFlag").textContent = sign;
        $("overflowFlag").textContent = overflow;

        $("explanation").textContent =
            description + " Binary result: " + output +
            ". Unsigned decimal result: " + result + ".";

        updateArchitecture(a, b, operation, output, carry, zero, sign, overflow);

        document.querySelectorAll(".operation-button").forEach(button => {
            button.classList.toggle("active", button.dataset.op === operation);
        });

        operationHistory.unshift({
            operation,
            a: binary(a),
            b: unary.includes(operation) ? "-" : binary(b),
            result: output
        });

        operationHistory = operationHistory.slice(0, 20);
        renderHistory();

    } catch (error) {
        $("result").textContent = "--------";
        $("decimalResult").textContent = "--";
        $("operationName").textContent = operation;
        $("message").textContent = error.message;
        $("explanation").textContent = "Please correct the input and try again.";
    }
}

function updateArchitecture(a, b, operation, output, cf, zf, sf, of) {
    $("archA").textContent = binary(a);
    $("archB").textContent =
        ["NOT", "INC", "DEC", "SHL", "SHR"].includes(operation)
            ? "NOT USED" : binary(b);

    $("archOperation").textContent = operation;
    $("archResult").textContent = output;
    $("archFlags").textContent =
        `CF: ${cf} | ZF: ${zf} | SF: ${sf} | OF: ${of}`;
}

document.querySelectorAll(".operation-button").forEach(button => {
    button.addEventListener("click", () => performOperation(button.dataset.op));
});

// ============================================
// OPERATION HISTORY
// ============================================

function renderHistory() {

    const tbody = $("historyList");
    tbody.replaceChildren();

    if (!operationHistory.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 4;
        cell.className = "empty-history";
        cell.textContent = "No calculations yet.";

        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    operationHistory.forEach(item => {
        const row = document.createElement("tr");

        [item.operation, item.a, item.b, item.result].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value;
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });
}

$("clearHistory").addEventListener("click", () => {
    operationHistory = [];
    renderHistory();
});

$("resetButton").addEventListener("click", () => {

    $("inputA").value = "";
    $("inputB").value = "";

    $("result").textContent = "00000000";
    $("decimalResult").textContent = "0";
    $("operationName").textContent = "NONE";
    $("message").textContent = "Inputs reset successfully.";

    $("carryFlag").textContent = "0";
    $("zeroFlag").textContent = "0";
    $("signFlag").textContent = "0";
    $("overflowFlag").textContent = "0";

    $("explanation").textContent = "Enter new operands and select an operation.";

    updateArchitecture(0, 0, "WAITING FOR OPERATION",
        "00000000", 0, 0, 0, 0);

    document.querySelectorAll(".operation-button").forEach(button =>
        button.classList.remove("active")
    );
});

// ============================================
// NUMBER SYSTEM CONVERTER
// ============================================

function convertNumber() {

    const input = $("numberInput").value.trim();
    const base = Number($("numberBase").value);
    const error = $("conversionError");

    error.textContent = "";

    try {

        if (!input) throw new Error("Please enter a number.");

        let value;

        if (base === 2) {
            if (!/^[01]{1,8}$/.test(input))
                throw new Error("Enter 1 to 8 binary digits.");
            value = parseInt(input, 2);
        }

        if (base === 10) {
            if (!/^\d+$/.test(input))
                throw new Error("Enter a valid positive decimal number.");
            value = Number(input);
        }

        if (base === 16) {
            if (!/^[0-9a-fA-F]{1,2}$/.test(input))
                throw new Error("Enter a valid hexadecimal number (00–FF).");
            value = parseInt(input, 16);
        }

        if (!Number.isInteger(value) || value < 0 || value > 255)
            throw new Error("Value must be between 0 and 255.");

        $("binaryOutput").textContent = binary(value);
        $("decimalOutput").textContent = value;
        $("hexOutput").textContent = value.toString(16).toUpperCase().padStart(2, "0");

    } catch (e) {
        error.textContent = e.message;
        $("binaryOutput").textContent = "--------";
        $("decimalOutput").textContent = "--------";
        $("hexOutput").textContent = "--------";
    }
}

$("convertButton").addEventListener("click", convertNumber);

$("numberInput").addEventListener("keydown", event => {
    if (event.key === "Enter") convertNumber();
});

document.querySelectorAll(".copy-button").forEach(button => {

    button.addEventListener("click", async () => {

        const value = $(button.dataset.copy).textContent;

        if (value === "--------") return;

        try {
            await navigator.clipboard.writeText(value);
            button.textContent = "COPIED";
            setTimeout(() => button.textContent = "COPY", 1200);
        } catch {
            button.textContent = "FAILED";
        }
    });
});

// ============================================
// LEARNING CENTRE CONTENT
// ============================================

const lessons = {

    ADD: {
        category: "ARITHMETIC OPERATION",
        title: "Addition (ADD)",
        description: "Addition combines two binary operands and produces an 8-bit result.",
        working: "The ALU adds each binary bit along with any carry from the previous position. A carry may be generated from the most significant bit.",
        example: "Operand A : 00000101 (5)\nOperand B : 00000011 (3)\n------------------------\nResult    : 00001000 (8)",
        headers: ["A", "B", "Carry In", "Sum", "Carry Out"],
        rows: [
            ["0", "0", "0", "0", "0"],
            ["0", "0", "1", "1", "0"],
            ["0", "1", "0", "1", "0"],
            ["0", "1", "1", "0", "1"],
            ["1", "0", "0", "1", "0"],
            ["1", "0", "1", "0", "1"],
            ["1", "1", "0", "0", "1"],
            ["1", "1", "1", "1", "1"]
        ],
        note: "Full-adder truth table."
    },

    SUB: {
        category: "ARITHMETIC OPERATION",
        title: "Subtraction (SUB)",
        description: "Subtraction calculates Operand A minus Operand B.",
        working: "Binary subtraction uses borrow propagation. In two's-complement arithmetic, subtraction can also be implemented by adding the complement of the second operand and one.",
        example: "Operand A : 00000101 (5)\nOperand B : 00000011 (3)\n------------------------\nResult    : 00000010 (2)",
        headers: ["A", "B", "Borrow In", "Difference", "Borrow Out"],
        rows: [
            ["0","0","0","0","0"],
            ["0","0","1","1","1"],
            ["0","1","0","1","1"],
            ["0","1","1","0","1"],
            ["1","0","0","1","0"],
            ["1","0","1","0","0"],
            ["1","1","0","0","0"],
            ["1","1","1","1","1"]
        ],
        note: "Full-subtractor truth table."
    },

    INC: {
        category: "ARITHMETIC OPERATION",
        title: "Increment (INC)",
        description: "Increment increases the value of Operand A by one.",
        working: "The ALU adds binary 1 to Operand A. If the value is 255, the 8-bit result wraps around to zero.",
        example: "Operand A : 00000101 (5)\nIncrement : 00000001 (1)\n------------------------\nResult    : 00000110 (6)",
        headers: ["A", "Incremented A"],
        rows: [["0","1"],["1","10"]],
        note: "Single-bit increment behavior. Carry propagates through higher bits."
    },

    DEC: {
        category: "ARITHMETIC OPERATION",
        title: "Decrement (DEC)",
        description: "Decrement decreases the value of Operand A by one.",
        working: "The ALU subtracts binary 1 from Operand A. When the input is zero, the 8-bit output wraps around to 255.",
        example: "Operand A : 00000101 (5)\nDecrement : 00000001 (1)\n------------------------\nResult    : 00000100 (4)",
        headers: ["A", "Decremented A"],
        rows: [["0","-1"],["1","0"]],
        note: "Single-bit decrement behavior; borrow may propagate."
    },

    AND: {
        category: "LOGICAL OPERATION",
        title: "AND Operation",
        description: "AND produces 1 only when both corresponding input bits are 1.",
        working: "Each bit position is processed independently. The result bit is 1 only when both inputs are 1.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 00000001",
        headers: ["A", "B", "Output"],
        rows: [["0","0","0"],["0","1","0"],["1","0","0"],["1","1","1"]],
        note: "Two-input AND truth table."
    },

    OR: {
        category: "LOGICAL OPERATION",
        title: "OR Operation",
        description: "OR produces 1 when at least one of the input bits is 1.",
        working: "Each corresponding bit is compared. The output is zero only when both inputs are zero.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 00000111",
        headers: ["A", "B", "Output"],
        rows: [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","1"]],
        note: "Two-input OR truth table."
    },

    NOT: {
        category: "LOGICAL OPERATION",
        title: "NOT Operation",
        description: "NOT inverts every bit of Operand A.",
        working: "A zero becomes one, and a one becomes zero. NOT is a unary operation and uses only one operand.",
        example: "Operand A : 00000101\nNOT A     : 11111010",
        headers: ["A", "Output"],
        rows: [["0","1"],["1","0"]],
        note: "Single-input NOT truth table."
    },

    XOR: {
        category: "LOGICAL OPERATION",
        title: "XOR Operation",
        description: "Exclusive OR produces 1 when the input bits are different.",
        working: "When both inputs are equal, the output is zero. When they differ, the output is one.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 00000110",
        headers: ["A", "B", "Output"],
        rows: [["0","0","0"],["0","1","1"],["1","0","1"],["1","1","0"]],
        note: "Two-input XOR truth table."
    },

    NAND: {
        category: "LOGICAL OPERATION",
        title: "NAND Operation",
        description: "NAND is the inverse of the AND operation.",
        working: "First perform AND, then invert the result. It outputs zero only when both inputs are one.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 11111110",
        headers: ["A", "B", "Output"],
        rows: [["0","0","1"],["0","1","1"],["1","0","1"],["1","1","0"]],
        note: "Two-input NAND truth table."
    },

    NOR: {
        category: "LOGICAL OPERATION",
        title: "NOR Operation",
        description: "NOR is the inverse of the OR operation.",
        working: "First perform OR, then invert the result. It outputs one only when both inputs are zero.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 11111000",
        headers: ["A", "B", "Output"],
        rows: [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","0"]],
        note: "Two-input NOR truth table."
    },

    XNOR: {
        category: "LOGICAL OPERATION",
        title: "XNOR Operation",
        description: "XNOR produces one when both input bits are equal.",
        working: "XNOR is the inverse of XOR. It outputs one for equal inputs and zero for different inputs.",
        example: "Operand A : 00000101\nOperand B : 00000011\n----------------\nResult    : 11111001",
        headers: ["A", "B", "Output"],
        rows: [["0","0","1"],["0","1","0"],["1","0","0"],["1","1","1"]],
        note: "Two-input XNOR truth table."
    },

    SHL: {
        category: "SHIFT OPERATION",
        title: "Shift Left (SHL)",
        description: "Shift Left moves all bits one position to the left.",
        working: "Every bit moves one position left. The most significant bit is shifted out and zero enters the least significant position.",
        example: "Operand A : 00000101 (5)\nShift Left: 00001010 (10)",
        headers: ["Before", "After SHL"],
        rows: [
            ["00000001","00000010"],
            ["00000010","00000100"],
            ["00000101","00001010"]
        ],
        note: "Illustrative 8-bit shift examples."
    },

    SHR: {
        category: "SHIFT OPERATION",
        title: "Shift Right (SHR)",
        description: "Logical Shift Right moves all bits one position to the right.",
        working: "Every bit moves one position right. The least significant bit is shifted out and zero enters the most significant position.",
        example: "Operand A : 00001010 (10)\nShift Right: 00000101 (5)",
        headers: ["Before", "After SHR"],
        rows: [
            ["00000010","00000001"],
            ["00000100","00000010"],
            ["00001010","00000101"]
        ],
        note: "Illustrative 8-bit logical right-shift examples."
    },

    // ============================================
    // NEW LESSON: FULL ADDER
    // ============================================

    FULLADDER: {
        category: "ARITHMETIC CIRCUIT",
        title: "Full Adder",
        description: "A Full Adder is a combinational logic circuit that adds three binary inputs: A, B and Carry-in (Cin). It produces two outputs: Sum and Carry-out (Cout).",
        working: "The Full Adder adds A, B and Cin. The Sum output is 1 when an odd number of inputs are 1. The Carry-out output is 1 when at least two of the three inputs are 1. It can be constructed using XOR, AND and OR gates.",
        example: "Input A   : 1\nInput B   : 1\nCarry-in  : 1\n----------------\nSum       : 1\nCarry-out : 1",
        headers: ["A", "B", "Cin", "Sum", "Cout"],
        rows: [
            ["0", "0", "0", "0", "0"],
            ["0", "0", "1", "1", "0"],
            ["0", "1", "0", "1", "0"],
            ["0", "1", "1", "0", "1"],
            ["1", "0", "0", "1", "0"],
            ["1", "0", "1", "0", "1"],
            ["1", "1", "0", "0", "1"],
            ["1", "1", "1", "1", "1"]
        ],
        note: "Full Adder truth table showing all eight possible input combinations."
    }
};

// ============================================
// DISPLAY LESSONS AND TRUTH TABLES
// ============================================

function showLesson(operation) {

    const lesson = lessons[operation];
    if (!lesson) return;

    currentLesson = operation;

    $("lessonCategory").textContent = lesson.category;
    $("lessonTitle").textContent = lesson.title;
    $("lessonDescription").textContent = lesson.description;
    $("lessonWorking").textContent = lesson.working;
    $("lessonExample").textContent = lesson.example;
    $("truthNote").textContent = lesson.note;

    const head = $("truthHead");
    const body = $("truthBody");

    head.replaceChildren();
    body.replaceChildren();

    const headingRow = document.createElement("tr");

    lesson.headers.forEach(header => {
        const th = document.createElement("th");
        th.textContent = header;
        headingRow.appendChild(th);
    });

    head.appendChild(headingRow);

    lesson.rows.forEach(values => {
        const row = document.createElement("tr");

        values.forEach(value => {
            const td = document.createElement("td");
            td.textContent = value;
            row.appendChild(td);
        });

        body.appendChild(row);
    });

    document.querySelectorAll(".learn-button").forEach(button => {
        button.classList.toggle("active", button.dataset.learn === operation);
    });

    // Full Adder is a learning topic, not a selectable ALU operation.
    $("tryLessonButton").textContent =
        operation === "FULLADDER"
            ? "FULL ADDER LEARNING TOPIC"
            : "TRY THIS OPERATION IN SIMULATOR";

    $("tryLessonButton").disabled = operation === "FULLADDER";
}

document.querySelectorAll(".learn-button").forEach(button => {
    button.addEventListener("click", () => showLesson(button.dataset.learn));
});

$("tryLessonButton").addEventListener("click", () => {

    // Do not try to run Full Adder as a normal ALU operation.
    if (currentLesson === "FULLADDER") {
        return;
    }

    document.querySelectorAll(".nav-button").forEach(button => {
        button.classList.toggle("active", button.dataset.page === "simulator");
    });

    document.querySelectorAll(".page").forEach(page => {
        page.classList.toggle("active", page.id === "simulator");
    });

    const defaults = {
        ADD: ["00000101", "00000011"],
        SUB: ["00000101", "00000011"],
        INC: ["00000101", ""],
        DEC: ["00000101", ""],
        AND: ["00000101", "00000011"],
        OR: ["00000101", "00000011"],
        NOT: ["00000101", ""],
        XOR: ["00000101", "00000011"],
        NAND: ["00000101", "00000011"],
        NOR: ["00000101", "00000011"],
        XNOR: ["00000101", "00000011"],
        SHL: ["00000101", ""],
        SHR: ["00001010", ""]
    };

    $("inputA").value = defaults[currentLesson][0];
    $("inputB").value = defaults[currentLesson][1];

    performOperation(currentLesson);

    window.scrollTo({ top: 0, behavior: "smooth" });
});

// ============================================
// INITIALIZATION
// ============================================

renderHistory();
showLesson("ADD");

convertNumber();

console.log("SmartALU educational simulator initialized.");
console.log("13 ALU operations, converter and learning centre ready.");