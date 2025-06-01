var takenCoursesInput;
var url = "http://184.73.142.80"
// var url = "http://localhost:9000"

function showContent() {
  document.getElementById("protected-content").style.display = "block";
}
function checkPassword() {
  const correctPassword = "usf_course_scheduler"; // Change this to your desired password
  const savedPassword = localStorage.getItem("auth");

  if (savedPassword === correctPassword) {
    showContent();
    return;
  }

  const userInput = prompt("Enter the password:");
  if (userInput === correctPassword) {
    localStorage.setItem("auth", correctPassword); // Save password in localStorage
    showContent();
  } else {
    alert("Incorrect password. Access denied.");
    checkPassword(); // Keep prompting until the correct password is entered
  }
}
function updateTakenCourses() {
  const checkboxes = document.querySelectorAll(".form-check-input:checked");
  takenCoursesInput = Array.from(checkboxes).map((checkbox) => checkbox.value);
  // console.log("Selected Courses:", selectedCourses); // Debugging
  // takenCoursesInput = document.getElementById('taken_courses_input');
  // takenCoursesInput.value = JSON.stringify({ value: selectedCourses });
}
function updateResultsMessage(message) {
  const messageElement = document.getElementById("results-message");
  messageElement.textContent = message; // Update the text content of the message
}

// the function for printing the table
function printTablePdf() {
  const tableSection = document.getElementById("table-wrapper");
  if (!tableSection) {
    console.error("Table section not found!");
    return;
  }

  const printWindow = window.open(
    "",
    "",
    "width=800,height=600,location=no,menubar=no,toolbar=no,status=no"
  );
  printWindow.document.write("<html><head><title>Print Schedule</title>");
  printWindow.document.write(
    '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css">'
  );
  printWindow.document.write("</head><body>");
  printWindow.document.write("<h3>Generated Schedule</h3>");
  printWindow.document.write(tableSection.innerHTML);
  printWindow.document.write("</body></html>");
  printWindow.document.close();
  printWindow.print();
}


$(document).ready(function () {
  // Print the table in PDF format
  $("#printPdf").on("click", function () {
    printTable2("pdf");
  });

  // Print the table in Word format
  $("#printWord").on("click", function () {
    printTable2("word");
  });
});


$(document).ready(function () {
  // Check if program is selected on form submission
  // $("#formSubmitButton").on("click", function () {
  //   const program = $("#program").val();
  //   if (!program) {
  //     const toastElement = new bootstrap.Toast(
  //       document.getElementById("errorToast")
  //     );
  //     toastElement.show();
  //   }
  // });
  $("#selectCoursesBtn").on("click", function(e) {
    e.preventDefault();                  // stop any default behavior
    const program = $("#program").val(); // read selected program
  
    if (!program) {
      // show “select program first” toast
      const toastEl = document.getElementById("programSelectToastfirst");
      new bootstrap.Toast(toastEl).show();
    } else {
      // open the modal by script
      const takenModal = new bootstrap.Modal(
        document.getElementById("takenCoursesModal")
      );
      takenModal.show();
    }
  });
});


function send_data() {
  console.log("Sending Data:", takenCoursesInput);
  const program = $("#program").val(); // Get the selected program
  const nextSemester = $("#semester").val(); // Get the selected semester

  if (program !== "") {
    fetch(url + "/api/recommend/create", {
      method: "POST",
      body: JSON.stringify({
        program: program,
        next_semester: nextSemester,
        taken_courses: takenCoursesInput
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Please select taken courses!");
          });
        }
        return response.json();
      })
      .then((json) => {
        console.log("Response Data:", json); // Debugging the response
        parseAndRenderTable(json); // Call to render the table with response data
        updateResultsMessage(
          "This plan must be reviewed and approved by a Bellini CAICC advisor!"
        );
        let printDropdown = document.getElementById('printDropdown');
        if (printDropdown) {
          printDropdown.style.display = 'inline-block'; // Make it visible
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        // Show error in toast
        $(".toast-body").text(error.message); // Set the error message
        //$(".toast").toast("show"); // Show the toast
        $("#programSelectToast").toast("show");
      });
  } else {
    $(".toast-body").text("Inputs are required!"); // Set the message for missing program
    //$(".toast").toast("show"); // Show the toast
    $("#programSelectToast").toast("show");
  }
}

// Function to parse and render the table
function parseAndRenderTable(responseText) {
  // Parse the response into structured data
  const parsedData = responseText
    .trim()
    .split("<br/>")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const semesterMatch = line.match(/Semester: (\w+)/);
      const coursesMatch = line.match(/Courses: (\[.*?\])/);
      const creditsMatch = line.match(/Credits: (\d+)/);

      // Parse the courses and include the credit for each course
      const courses = coursesMatch
        ? JSON.parse(coursesMatch[1].replace(/'/g, '"')).map((course) => {
          return {
            label: course.label,
            credit: course.credit,
            difficulty: course.difficulty
          };
        })
        : [];

      return {
        semester: semesterMatch ? semesterMatch[1] : "",
        courses: courses,
        credits: creditsMatch ? parseInt(creditsMatch[1], 10) : 0,
      };
    });

  // Update the table dynamically
  const semesterHeaders = document.getElementById("semester-headers");
  const courseBody = document.getElementById("course-body");
  semesterHeaders.innerHTML = "";
  courseBody.innerHTML = "";

  // Add semester headers
  parsedData.forEach((semester) => {
    const headerCell = document.createElement("th");
    headerCell.className = "semester-column";
    headerCell.style.color = "white";
    headerCell.innerText = `Semester ${semester.semester}`;
    semesterHeaders.appendChild(headerCell);
  });

  // Maximum number of courses for any semester
  const maxCourses = Math.max(...parsedData.map((s) => s.courses.length));

  // Add rows for courses
  for (let i = 0; i < maxCourses; i++) {
    const row = document.createElement("tr");
    parsedData.forEach((semester) => {
      const cell = document.createElement("td");
      cell.innerText = semester.courses[i] ? semester.courses[i].label : ""; // Only label is shown
      row.appendChild(cell);
    });
    courseBody.appendChild(row);
  }

  // Add row for credits
  const creditsRow = document.createElement("tr");
  parsedData.forEach((semester) => {
    const cell = document.createElement("td");
    cell.innerHTML = `<strong>Credits: ${semester.credits}</strong>`;
    creditsRow.appendChild(cell);
  });
  courseBody.appendChild(creditsRow);

  // Add row for difficulty category (smaller, non-bold)
  const diffRow = document.createElement("tr");
  parsedData.forEach((semester) => {
    // 1) compute the numeric score
    const score = semester.courses
      .reduce((sum, c) => sum + (c.difficulty || 0), 0);

    // 2) bucket into a category
    let category;
    if (score <= 9)         category = 'Easy';
    else if (10 <= score <= 14)   category = 'Moderate';
    else                     category = 'Hard';

    // 3) render
    const cell = document.createElement("td");
    cell.innerHTML = `<span style="font-size:0.8em;">Difficulty: ${category}</span>`;
    diffRow.appendChild(cell);
  });
  courseBody.appendChild(diffRow);

  // Make the parsedData available for other functions
  window.courseData = parsedData;
}


function printTable2(mode) {
  // Get the parsed data directly from the global variable
  const parsedData = window.courseData;

  // Generate the new vertical layout with an additional column for credits
  let customTable = `
    <table style="width: 98%; border-collapse: collapse; background-color: white;">
      <tbody>`;

  parsedData.forEach((semester) => {
    customTable += `
      <tr>
        <td colspan="3" style="width: 100%; border: 1px solid black; padding: 4px; font-weight: bold; background-color: #f4f4f9;">
          Semester ${semester.semester}
        </td>
      </tr>`;

    customTable += `
      <tr>
        <td colspan="1" style="width: 40%; border: 1px solid black; padding: 4px; font-weight: bold; background-color: #f4f4f9;">
          Course
        </td>
        <td colspan="1" style="width: 10%; border: 1px solid black; padding: 4px; font-weight: bold; background-color: #f4f4f9;">
          credit
        </td>
        <td colspan="1" style="width: 50%; border: 1px solid black; padding: 4px; font-weight: bold; background-color: #f4f4f9;">
          Notes
        </td>
      </tr>`;

    semester.courses.forEach((course) => {
      customTable += `
        <tr>
          <td style="width: 40%; border: 1px solid black; padding: 4px; text-align: left;">
            ${course.label}
          </td>
          <td style="width: 10%; border: 1px solid black; padding: 4px; text-align: center;">
            ${course.credit}
          </td>
          <td style="width: 50%; border: 1px solid black; padding: 4px; text-align: center;">
          &nbsp;</td>
        </tr>`;
    });

    customTable += `
      <tr>
        <td colspan="1" style="width: 40%; border: 1px solid black; padding: 4px; text-align: left; font-weight: bold;">
          Total Credits:
        </td>
        <td colspan="1" style="width: 10%; border: 1px solid black; padding: 4px; text-align: center; font-weight: bold;">
          ${semester.credits}
        </td>
        <td colspan="1" style="width: 50%; border: 1px solid black; padding: 4px; text-align: left; font-weight: bold;">
        &nbsp;</td>
      </tr>
      <tr><td colspan="3" style="height: 20px;"></td></tr>`;
  });

  customTable += `
      </tbody>
    </table>`;

  // Add CSS for the Word or PDF layout
  const css = `
    <style>
      @page WordSection1 {
        size: a4;
        mso-page-orientation: landscape;
        margin: 4mm;
      }
      div.WordSection1 {
        page: WordSection1;
      }
      body {
        font-size: 10pt;
        font-family: Arial, sans-serif;
        background-color: white;
        margin: 0;
        padding: 0;
        margin-bottom: 10px;
        margin-bottom: 10px;
      }
      h3 {
        margin-top: 0;
        margin: 0;
        padding: 0;
        margin-bottom: 0px; /* Adjust as needed */
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
      }
      td {
        border: 1px solid black;
        padding: 8px;
        text-align: center;
        vertical-align: middle;
        word-wrap: break-word;
        white-space: normal;
      }
      table, td {
        border-collapse: collapse;
        border: 1px solid black;
      }
    </style>`;

  const html = `
    <html>
      <head>
        ${css}
      </head>
      <body>
        <div class="WordSection1">
          <h3 style="text-align: left; font-size: 0.9em">Student Name: </h3>
          <h3 style="text-align: left; font-size: 0.9em">U Number: </h3>
          <h3 style="text-align: left; font-size: 0.9em">Program: </h3>
          <br>
          ${customTable}
        </div>
      </body>
    </html>`;


    if (mode === "pdf") {
      const opt = {
        margin: [5, 5, 5, 5],
        filename: "usf_scheduler.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 , 
          backgroundColor: null, y: 0 , useCORS: true},
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };
      // const printWindow = window.open("", "_blank", "width=800,height=600"); // to show the opt to debug
      // printWindow.document.write(opt);
      // printWindow.document.close();  // Close the document stream to render the content
      
      html2pdf().from(html).set(opt).save();
    } else if (mode === "word") {
      const blob = new Blob(["\ufeff", html], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("A");
      link.href = url;
      link.download = "usf_scheduler.doc";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }


// // for the comment form:

// document.addEventListener("DOMContentLoaded", function () {
//   loadComments();
// });

// function submitComment() {
//   let username = document.getElementById("username").value;
//   let comment = document.getElementById("comment").value;

//   if (!username || !comment) {
//     alert("Both fields are required!");
//     return;
//   }

//   fetch("http://127.0.0.1:5000/add_comment", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({ username: username, comment: comment }),
//   })
//     .then(response => response.json())
//     .then(data => {
//       alert(data.message);
//       loadComments(); // Refresh comments list
//     });
// }

// function loadComments() {
//   fetch("http://127.0.0.1:5000/get_comments")
//     .then(response => response.json())
//     .then(comments => {
//       let commentSection = document.getElementById("comment-section");
//       commentSection.innerHTML = ""; // Clear existing comments
//       comments.forEach(c => {
//         let div = document.createElement("div");
//         div.innerHTML = `<strong>${c.username}:</strong> ${c.comment}`;
//         commentSection.appendChild(div);
//       });
//     });
// }

const courseLabels = {
"CAI4002": "CAI 4002 Intro to Artificial Intelligence",
"CAI4100": "CAI 4100 Intro to Machine Learning",
"CDA3103": "CDA3 103 Computer Organization",
"CDA3201/3201L": "CDA 3201/3201L Computer Logic and Design/ Lab",
"CDA4021": "CDA 4021 Computing Circuits",
"CDA4203/L": "CDA 4203/4203L Computer System Design/ Lab",
"CDA4205/4205L": "CDA 4205/4205 Computer Architecture/ Lab",
"CDA4213/L": "CDA 4213/4213L CMOS VLSI Desig/ Lab",
"CEN4020": "CEN 4020 Software Engineering",
"CGS1540": "CGS 1540 Intro to Databases",
"CGS3853": "CGS 3853 Web Systems for IT",
"CHM2045/2045L": "CHM 2045/2045L General Chemistry/ Lab",
"CIS1930": "CIS 1930 Freshman Seminar for Computing",
"CIS3213": "CIS 3213 Foundations of Cybersecurity",
"CIS3433": "CIS 3433 System Integration and Architecture for IT",
"CIS4083": "CIS 4083 Cloud Computing for IT",
"CIS4200": "CIS 4200 Penetration Testing",
"CIS4219": "CIS 4219 Human Aspects of Cybersecurity",
"CIS4250": "CIS 4250 Ethical Issues and Prof Conduct",
"CIS4622": "CIS4622 Hands-on Cybersecurity",
"CIS4910": "CIS 4910 Comp Science and Engineering Project",
"CNT4104/L": "CNT4104/4104L Comp Info Networks/ Lab",
"CNT4403": "CNT 4403 Network Security and Firewalls",
"CNT4419": "CNT 4419 Secure Coding",
"CNT4603": "CNT 4603 System Admin and Maintenance for IT",
"COP2510": "COP 2510 Programming Concepts",
"COP2513": "COP 2513 Object Oriented Programming",
"COP3514": "COP 3514 Program Design",
"COP3515": "COP 3515 Advanced Program Design",
"COP4530": "COP 4530 Data Structures",
"COP4538": "COP 4538 Data Structures and Algorithms",
"COP4600": "COP 4600 Operating Systems",
"COP4703": "COP 4703 Advanced Database Systems",
"COT3100": "COT 3100 Introduction to Discrete Structures",
"COT4400": "COT 4400 Analysis of Algorithms",
"AIElec1": "AI Elective",
"AIElec2": "AI Elective",
"AIElec3": "AI Elective",
"AIElec4": "AI Elective",
"HardwareElec1": "Hardware Elective",
"HardwareElec2": "Hardware Elective",
"SoftwareElelc1": "Software Elective",
"SoftwareElelc2": "Software Elective",
"SoftwareElelc3": "Software Elective",
"TheoryElelc": "Theory Elective",
"Techelec1": "Technical Elective",
"Techelec2": "Technical Elective",
"Techelec3": "Technical Elective",
"CyberElec1": "Cybersecurity Elective",
"CyberElec2": "Cybersecurity Elective",
"CyberElec3": "Cybersecurity Elective",
"CyberElec4": "Cybersecurity Elective",
"CyberElec5": "Cybersecurity Elective",
"CyberElec6": "Cybersecurity Elective",
"CyberElec7": "Cybersecurity Elective",
"ECO2013": "ECO 2013 Economic Principles (Macroeconomics)",
"EGN2440": "EGN 2440 Probability and Statistics with calculus",
"EGN2615": "EGN 2615 Economics with SG Implications",
"EGN3433": "EGN 3433 EGN3433 or MAP2302",
"EGN4450": "EGN 4450 Introduction to Linear Systems",
"ENC1101": "ENC 1101 Composition I",
"ENC1102": "ENC 1102 Composition II",
"GenEdHumanities1": "Gen Ed Humanities Elective",
"GenEdHumanities2": "Gen Ed Humanities Elective",
"GenEdSocialScience1": "POS2041/AMH2010/AMH2020",
"GenEdSocialScience2": "Gen Ed Social Science Elective",
"GeneralElec1": "General Elective",
"GeneralElec2": "General Elective",
"GeneralElec3": "General Elective",
"GeneralElec4": "General Elective",
"GeneralElec5": "General Elective",
"GeneralElec6": "General Elective",
"ISM4323": "ISM 4323 Information Sec and IT Risk Management",
"ITElec1": "IT Elective",
"ITElec2": "IT Elective",
"ITElec3": "IT Elective",
"ITElec4": "IT Elective",
"ITElec5": "IT Elective",
"ITElec6": "IT Elective",
"ITElec7": "IT Elective",
"LDR2010": "LDR 2010 Leadership Fundamentals",
"LIS4414": "LIS 4414 Information Policy and Ethics",
"MAC1147": "MAC 1147 Precalculus Algebra and Trigonometry",
"MAC2311": "MAC 2311 Calculus 1",
"MAC2312": "MAC 2312 Calculus 2",
"MAC2313": "MAC 2283 or MAC 2313 Calculus 3",
"MAD2104": "MAD 2104 Discrete Math",
"NatSciElec1": "Gen Ed Natural Science Elective",
"NatSciElec2": "Natural Science Elective",
"PHY2020": "PHY 2020 Conceptual Physics",
"PHY2048/2048L": "PHY2048/2048L General Physics I - Calculus Based/ Lab",
"PHY2049/2049L": "PHY2049/2049L General Physics II - Calculus Based/ Lab",
"PSY2012": "PSY 2012 Intro to Psychological Science",
"STA2023": "STA 2023 Introductory Statistics I"
}


// updating the list of taken courses based on each program
// Dynamically build taken courses checkboxes from goal JSON based on selected program
function buildTakenCoursesCheckboxes(programId, goalJsonData) {
  const container = document.getElementById("accordionExample");
  container.innerHTML = ""; // Clear previous content

  const goalData = goalJsonData[programId];
  if (goalData) {
    goalData.semesters.forEach((semester, index) => {
      const semesterName = semester.name;
      const courses = semester.courses;

      const accordionItem = document.createElement("div");
      accordionItem.className = "accordion-item";

      const headerId = `heading${index}`;
      const collapseId = `collapse${index}`;

      // Build the checkbox list for each course
      const courseCheckboxes = courses.map((courseId) => {
        const label = courseLabels[courseId] || courseId; // Use label if found, fallback to ID
        return `
          <div class="form-check">
            <input class="form-check-input" type="checkbox" id="${courseId}" value="${courseId}" name="taken_courses">
            <label class="form-check-label" for="${courseId}">${label}</label>
          </div>`;
      }).join("");

      accordionItem.innerHTML = `
        <h2 class="accordion-header" id="${headerId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
            Semester ${semesterName}
          </button>
        </h2>
        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headerId}" data-bs-parent="#accordionExample">
          <div class="accordion-body checkbox-list">
            ${courseCheckboxes}
          </div>
        </div>`;

      container.appendChild(accordionItem);
    });
  } else {
    console.error("Failed to load program goal data");
  }
}


// Bind to program selection change
$(document).ready(function () {
  $("#program").on("change", function () {
    const selectedProgram = $(this).val();
    if (selectedProgram) {
      buildTakenCoursesCheckboxes(selectedProgram,course_json);
    }
  });
});

var course_json = {
  "1": {
    "semesters": [
      {
        "name": "1",
        "id": "1",
        "term": "Fall",
        "courses": [
          "CIS1930",
          "COP2510",
          "MAC2311",
          "ENC1101",
          "NatSciElec1"
        ],
        "credits": 13
      },
      {
        "name": "2",
        "id": "2",
        "term": "Spring",
        "courses": [
          "COP3514",
          "MAC2312",
          "PHY2048/2048L",
          "ENC1102"
        ],
        "credits": 14
      },
      {
        "name": "3",
        "id": "3",
        "term": "Fall",
        "courses": [
          "CDA3103",
          "COT3100",
          "PHY2049/2049L",
          "GenEdHumanities1"
        ],
        "credits": 13
      },
      {
        "name": "4",
        "id": "4",
        "term": "Spring",
        "courses": [
          "COP4530",
          "CDA3201/3201L",
          "GeneralElec1",
          "GeneralElec2"
        ],
        "credits": 14
      },
      {
        "name": "Summer1",
        "id": "4.5",
        "term": "Summer",
        "courses": [
          "EGN2440",
          "GenEdSocialScience1",
          "NatSciElec2"
        ],
        "credits": 9
      },
      {
        "name": "5",
        "id": "5",
        "term": "Fall",
        "courses": [
          "CDA4205/4205L",
          "EGN4450",
          "GenEdHumanities2",
          "SoftwareElelc1",
          "GeneralElec3"
        ],
        "credits": 15
      },
      {
        "name": "6",
        "id": "6",
        "term": "Spring",
        "courses": [
          "COT4400",
          "GenEdSocialScience2",
          "SoftwareElelc2",
          "SoftwareElelc3",
          "Techelec1"
        ],
        "credits": 15
      },
      {
        "name": "7",
        "id": "7",
        "term": "Fall",
        "courses": [
          "COP4600",
          "CNT4419",
          "TheoryElelc",
          "Techelec2",
          "GeneralElec4"
        ],
        "credits": 15
      },
      {
        "name": "8",
        "id": "8",
        "term": "Spring",
        "courses": [
          "CEN4020",
          "CIS4250",
          "Techelec3",
          "GeneralElec5"
        ],
        "credits": 12
      },
      {
        "name": "9",
        "id": "9",
        "term": "Fall",
        "courses": [],
        "credits": 0
      }
    ]
  },
  "2": {
    "semesters": [
      {
        "name": "1",
        "id": "1",
        "term": "Fall",
        "courses": [
          "CIS1930",
          "MAC2311",
          "CHM2045/2045L",
          "ENC1101",
          "GeneralElec1"
        ],
        "credits": 14
      },
      {
        "name": "2",
        "id": "2",
        "term": "Spring",
        "courses": [
          "MAC2312",
          "COT3100",
          "COP2510",
          "PHY2048/2048L"
        ],
        "credits": 14
      },
      {
        "name": "3",
        "id": "3",
        "term": "Fall",
        "courses": [
          "MAC2313",
          "COP3514",
          "CDA3103",
          "COT3100",
          "PHY2049/2049L"
        ],
        "credits": 14
      },
      {
        "name": "4",
        "id": "4",
        "term": "Spring",
        "courses": [
          "EGN3433",
          "COP4530",
          "CDA3201/3201L",
          "ENC1102",
          "GenEdHumanities1"
        ],
        "credits": 16
      },
      {
        "name": "Summer1",
        "id": "4.5",
        "term": "Summer",
        "courses": [
          "EGN2440",
          "GenEdSocialScience1",
          "NatSciElec2"
        ],
        "credits": 9
      },
      {
        "name": "5",
        "id": "5",
        "term": "Fall",
        "courses": [
          "CDA4205/4205L",
          "CDA4021",
          "EGN4450",
          "EGN2615",
          "GeneralElec2"
        ],
        "credits": 15
      },
      {
        "name": "6",
        "id": "6",
        "term": "Spring",
        "courses": [
          "COT4400",
          "CDA4203/L",
          "HardwareElec1",
          "GeneralElec3"
        ],
        "credits": 13
      },
      {
        "name": "7",
        "id": "7",
        "term": "Fall",
        "courses": [
          "COP4600",
          "CDA4213/L",
          "GenEdHumanities2",
          "Techelec1"
        ],
        "credits": 13
      },
      {
        "name": "8",
        "id": "8",
        "term": "Spring",
        "courses": [
          "CIS4910",
          "CIS4250",
          "HardwareElec2",
          "Techelec2"
        ],
        "credits": 12
      },
      {
        "name": "9",
        "id": "9",
        "term": "Fall",
        "courses": [],
        "credits": 0
      }
    ]
  }, 
  "3":{
    "semesters": [
      {
        "name": "1",
        "id": "1",
        "term": "Fall",
        "courses": [
          "CIS1930",
          "COP2510",
          "MAC2311",
          "ENC1101",
          "NatSciElec1"
        ],
        "credits": 13
      },
      {
        "name": "2",
        "id": "2",
        "term": "Spring",
        "courses": [
          "COP3514",
          "MAC2312",
          "PHY2048/2048L",
          "ENC1102"
        ],
        "credits": 14
      },
      {
        "name": "3",
        "id": "3",
        "term": "Fall",
        "courses": [
          "CDA3103",
          "COT3100",
          "PHY2049/2049L",
          "GenEdHumanities1"
        ],
        "credits": 13
      },
      {
        "name": "4",
        "id": "4",
        "term": "Spring",
        "courses": [
          "COP4530",
          "CAI4002",
          "GeneralElec1",
          "GeneralElec2"
        ],
        "credits": 12
      },
      {
        "name": "Summer1",
        "id": "4.5",
        "term": "Summer",
        "courses": [
          "EGN2440",
          "GenEdSocialScience1",
          "NatSciElec2"
        ],
        "credits": 9
      },
      {
        "name": "5",
        "id": "5",
        "term": "Fall",
        "courses": [
          "CAI4100",
          "EGN4450",
          "GenEdHumanities2",
          "Techelec1",
          "GeneralElec3"
        ],
        "credits": 14
      },
      {
        "name": "6",
        "id": "6",
        "term": "Spring",
        "courses": [
          "COT4400",
          "GenEdSocialScience2",
          "AIElec1",
          "AIElec2",
          "Techelec2"
        ],
        "credits": 15
      },
      {
        "name": "7",
        "id": "7",
        "term": "Fall",
        "courses": [
          "COP4600",
          "CNT4419",
          "AIElec3",
          "TheoryElelc",
          "GeneralElec4"
        ],
        "credits": 15
      },
      {
        "name": "8",
        "id": "8",
        "term": "Spring",
        "courses": [
          "CIS4910",
          "CIS4250",
          "CEN4020",
          "AIElec4",
          "Techelec3"
        ],
        "credits": 15
      },
      {
        "name": "9",
        "id": "9",
        "term": "Fall",
        "courses": [],
        "credits": 0
      }
    ]
  }, 
  "4": {
    "semesters": [
      {
        "name": "1",
        "id": "1",
        "term": "Fall",
        "courses": [
          "CIS1930",
          "COP2510",
          "CGS1540",
          "MAC1147",
          "ENC1101"
        ],
        "credits": 13
      },
      {
        "name": "2",
        "id": "2",
        "term": "Spring",
        "courses": [
          "COP2513",
          "MAD2104",
          "ENC1102",
          "PHY2020",
          "GenEdHumanities1"
        ],
        "credits": 15
      },
      {
        "name": "3",
        "id": "3",
        "term": "Fall",
        "courses": [
          "CIS3213",
          "STA2023",
          "ECO2013",
          "GeneralElec2"
        ],
        "credits": 12
      },
      {
        "name": "4",
        "id": "4",
        "term": "Spring",
        "courses": [
          "COP3515",
          "PSY2012",
          "NatSciElec1",
          "GeneralElec1"
        ],
        "credits": 13
      },
      {
        "name": "Summer1",
        "id": "4.5",
        "term": "Summer",
        "courses": [
          "GenEdHumanities2",
          "GenEdSocialScience1",
          "GeneralElec3"
        ],
        "credits": 9
      },
      {
        "name": "5",
        "id": "5",
        "term": "Fall",
        "courses": [
          "COP4538",
          "CIS4622",
          "ISM4323",
          "GenEdSocialScience2",
          "CyberElec1"
        ],
        "credits": 15
      },
      {
        "name": "6",
        "id": "6",
        "term": "Spring",
        "courses": [
          "CNT4104/L",
          "CIS4219",
          "CyberElec2",
          "CyberElec3",
          "GeneralElec4"
        ],
        "credits": 16
      },
      {
        "name": "7",
        "id": "7",
        "term": "Fall",
        "courses": [
          "CIS4200",
          "CNT4403",
          "CyberElec4",
          "CyberElec5",
          "GeneralElec5"
        ],
        "credits": 15
      },
      {
        "name": "8",
        "id": "8",
        "term": "Spring",
        "courses": [
          "LIS4414",
          "COP4703",
          "CyberElec6",
          "CyberElec7"
        ],
        "credits": 12
      },
      {
        "name": "9",
        "id": "9",
        "term": "Fall",
        "courses": [],
        "credits": 0
      }
    ]
  },
  "5": {
    "semesters": [
      {
        "name": "1",
        "id": "1",
        "term": "Fall",
        "courses": [
          "CIS1930",
          "COP2510",
          "CGS1540",
          "MAC1147",
          "ENC1101"
        ],
        "credits": 13
      },
      {
        "name": "2",
        "id": "2",
        "term": "Spring",
        "courses": [
          "COP2513",
          "MAD2104",
          "ENC1102",
          "PHY2020",
          "GenEdHumanities1"
        ],
        "credits": 15
      },
      {
        "name": "3",
        "id": "3",
        "term": "Fall",
        "courses": [
          "CIS3213",
          "STA2023",
          "ECO2013",
          "GeneralElec1"
        ],
        "credits": 13
      },
      {
        "name": "4",
        "id": "4",
        "term": "Spring",
        "courses": [
          "COP3515",
          "CIS3433",
          "PSY2012",
          "LDR2010"
        ],
        "credits": 12
      },
      {
        "name": "Summer1",
        "id": "4.5",
        "term": "Summer",
        "courses": [
          "GenEdSocialScience1",
          "GeneralElec2",
          "GeneralElec3"
        ],
        "credits": 9
      },
      {
        "name": "5",
        "id": "5",
        "term": "Fall",
        "courses": [
          "COP4538",
          "CGS3853",
          "NatSciElec1",
          "GenEdHumanities2",
          "GeneralElec4"
        ],
        "credits": 15
      },
      {
        "name": "6",
        "id": "6",
        "term": "Spring",
        "courses": [
          "CNT4104/L",
          "ITElec1",
          "ITElec2",
          "ITElec3",
          "GeneralElec5"
        ],
        "credits": 16
      },
      {
        "name": "7",
        "id": "7",
        "term": "Fall",
        "courses": [
          "CIS4083",
          "CNT4603",
          "ITElec4",
          "ITElec5",
          "GeneralElec6"
        ],
        "credits": 15
      },
      {
        "name": "8",
        "id": "8",
        "term": "Spring",
        "courses": [
          "LIS4414",
          "COP4703",
          "ITElec6",
          "ITElec7"
        ],
        "credits": 12
      },
      {
        "name": "9",
        "id": "9",
        "term": "Fall",
        "courses": [],
        "credits": 0
      }
    ]
  }
}

