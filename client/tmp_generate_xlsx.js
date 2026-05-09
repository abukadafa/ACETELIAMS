const XLSX = require('xlsx');

function createTestExcel() {
  const wb = XLSX.utils.book_new();

  // Test Admitted
  const wsAdmitted = XLSX.utils.json_to_sheet([
    { Surname: 'Doe', 'Other Names': 'John', 'Applicant Name': 'John Doe', Program: 'MSc Cybersecurity', 'Previous Degree': 'BSc Computer Science', CGPA: '4.5', Nationality: 'Nigeria', 'Personal Email': 'john.doe@email.com', Phone: '08012345678' },
    { Surname: 'Smith', 'Other Names': 'Jane', 'Applicant Name': 'Jane Smith', Program: '', 'Previous Degree': 'BSc Admin', CGPA: '4.2', Nationality: 'Ghana', 'Personal Email': 'jane.s@email.com', Phone: '08087654321' }
  ]);
  XLSX.utils.book_append_sheet(wb, wsAdmitted, 'Sheet1');
  XLSX.writeFile(wb, '2024_1_Admitted_MSc_Cybersecurity.xlsx');
  
  const wb2 = XLSX.utils.book_new();
  // Test Registered Students
  const wsReg = XLSX.utils.json_to_sheet([
    { Surname: 'Okafor', 'First Name': 'Emeka', 'Matric Number': 'NOU12345', Programme: 'PhD Artificial Intelligence', Semester: '2', Gender: 'Male', 'Grad Year': '2027', Status: 'Active', 'Personal Email': 'emeka@mail.com', 'Institutional Email': 'eokafor@acetel.edu.ng', 'Phone Number': '09011112222', Nationality: 'Nigeria' },
    { Surname: 'Ade', 'First Name': 'Bola', 'Matric Number': 'NOU67890', Programme: '', Semester: '1', Gender: 'Female', 'Grad Year': '2025', Status: 'Active', 'Personal Email': 'bola@mail.com', 'Institutional Email': 'bade@acetel.edu.ng', 'Phone Number': '08122223333', Nationality: 'Nigeria' }
  ]);
  XLSX.utils.book_append_sheet(wb2, wsReg, 'Sheet1');
  XLSX.writeFile(wb2, '2025_Registered_MIS_Students.xlsx');

  console.log("Mock files created.");
}

createTestExcel();
