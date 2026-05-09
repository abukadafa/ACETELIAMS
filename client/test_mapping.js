const admittedRows = [
  { Surname: 'Doe', 'Other Names': 'John', 'Applicant Name': 'John Doe', Program: 'MSc Cybersecurity', 'Previous Degree': 'BSc Computer Science', CGPA: '4.5', Nationality: 'Nigeria', 'Personal Email': 'john.doe@email.com', Phone: '08012345678' },
  { Surname: 'Smith', 'Other Names': 'Jane', 'Applicant Name': 'Jane Smith', Program: '', 'Previous Degree': 'BSc Admin', CGPA: '4.2', Nationality: 'Ghana', 'Personal Email': 'jane.s@email.com', Phone: '08087654321' }
];

const registeredRows = [
  { Surname: 'Okafor', 'First Name': 'Emeka', 'Matric Number': 'NOU12345', Programme: 'PhD Artificial Intelligence', Semester: '2', Gender: 'Male', 'Grad Year': '2027', Status: 'Active', 'Personal Email': 'emeka@mail.com', 'Institutional Email': 'eokafor@acetel.edu.ng', 'Phone Number': '09011112222', Nationality: 'Nigeria' },
  { Surname: 'Ade', 'First Name': 'Bola', 'Matric Number': 'NOU67890', Programme: '', Semester: '1', Gender: 'Female', 'Grad Year': '2025', Status: 'Active', 'Personal Email': 'bola@mail.com', 'Institutional Email': 'bade@acetel.edu.ng', 'Phone Number': '08122223333', Nationality: 'Nigeria' }
];

const extractProg = (fallbackProg, rowProg) => {
  const searchString = typeof fallbackProg === 'string' ? fallbackProg.toLowerCase() : "";
  const rowSearch = typeof rowProg === 'string' ? rowProg.toLowerCase() : "";
  const combined = searchString + " " + rowSearch;
  
  const isPhD = combined.includes("phd") || combined.includes("ph.d");
  const isMSc = combined.includes("msc") || combined.includes("m.sc");
  const prefix = isPhD ? "PhD" : "MSc";
  
  if (combined.includes("cybersecurity") || combined.includes("cyber security")) return \`\${prefix} Cybersecurity\`;
  if (combined.includes("mis") || combined.includes("management information system") || combined.includes("information system")) return \`\${prefix} Management Information System\`;
  if (combined.includes("artificial intelligence") || combined.includes("ai")) return \`\${prefix} Artificial Intelligence\`;
  
  return "MSc Artificial Intelligence";
};

console.log("--- Testing Admitted Route ---");
const fileNameAdmissions = "2024_1_admitted_msc_cybersecurity.xlsx";
const mappedAdmissions = admittedRows.map((row) => {
  const fName = row["First Name"] || row["Names"] || row["Other Names"] || "";
  const sName = row["Surname"] || row["Last Name"] || "";
  const fullName = row["Full Name"] || row["Name"] || row["Applicant Name"] || \`\${sName} \${fName}\`.trim() || "Unknown";
  const prog = extractProg(fileNameAdmissions, row["Programme"] || row["Program"]);
  return {
    name: fullName,
    prog,
    status: fileNameAdmissions.includes("admitted") ? "Admitted" : (row["Status"] || "Pending")
  };
});
console.log(mappedAdmissions);

console.log("\n--- Testing Registry Route ---");
const fileNameRegistry = "2025_registered_mis_students.csv";
const mappedRegistry = registeredRows.map((row) => {
  const fName = row["First Name"] || row["Names"] || row["Other Names"] || "";
  const sName = row["Surname"] || row["Last Name"] || "";
  const fullName = row["Full Name"] || row["Name"] || \`\${sName} \${fName}\`.trim() || "Unknown";
  const prog = extractProg(fileNameRegistry, row["Programme"] || row["Program"]);
  return {
    id: row["Matric Number"] || row["Matric No"] || row["ID"],
    name: fullName,
    prog,
    email: row["Personal Email"] || row["Email"] || "",
    instEmail: row["Institutional Email"] || row["Inst Email"] || ""
  };
});
console.log(mappedRegistry);
