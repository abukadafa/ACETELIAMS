const fs = require('fs');

const admittedCsv = `Surname,Other Names,Applicant Name,Programme,Previous Degree,CGPA,Nationality,Personal Email,Phone Number
Doe,John,John Doe,MSc Cybersecurity,BSc Computer Science,4.5,Nigeria,john.doe@email.com,08012345678
Smith,Jane,Jane Smith,,BSc Admin,4.2,Ghana,jane.s@email.com,08087654321`;

fs.writeFileSync('2024_1_Admitted_MSc_Cybersecurity.csv', admittedCsv);

const registeredCsv = `Surname,First Name,Matric Number,Programme,Semester,Gender,Grad Year,Status,Personal Email,Institutional Email,Phone Number,Nationality
Okafor,Emeka,NOU12345,PhD Artificial Intelligence,2,Male,2027,Active,emeka@mail.com,eokafor@acetel.edu.ng,09011112222,Nigeria
Ade,Bola,NOU67890,,1,Female,2025,Active,bola@mail.com,bade@acetel.edu.ng,08122223333,Nigeria`;

fs.writeFileSync('2025_Registered_MIS_Students.csv', registeredCsv);

console.log("Mock CSVs created successfully.");
