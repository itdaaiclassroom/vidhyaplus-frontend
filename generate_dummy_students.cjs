const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const headers = [
  "First Name", "Last Name", "Grade", "Section", "Password", "Gender", "Category", 
  "Date of Birth", "Father Name", "Mother Name", "Phone", "Aadhaar", "Address", 
  "Village", "Mandal", "District", "State", "Pincode", "Hostel Status", "Disabilities"
];

const data = [headers];

const grades = [6, 7, 8, 9, 10];
const sections = ["A", "B", "C"];

let counter = 1;
for (let g of grades) {
  for (let s of sections) {
    // 3 students per section, total 45 students
    for (let i = 1; i <= 3; i++) {
      data.push([
        `Student${counter}`,
        `Test`,
        g,
        s,
        "123456",
        i % 2 === 0 ? "Female" : "Male",
        "General",
        "2010-01-01",
        `Father${counter}`,
        `Mother${counter}`,
        `9876543210`,
        `123456789012`,
        `Address ${counter}`,
        "Village",
        "Mandal",
        "Hyderabad",
        "Telangana",
        "500001",
        "no",
        "none"
      ]);
      counter++;
    }
  }
}

const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Students");

const outPath = path.join(process.cwd(), "Dummy_Students_Data.xlsx");
XLSX.writeFile(wb, outPath);

console.log(`Generated file at: ${outPath}`);
