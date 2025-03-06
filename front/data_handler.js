var takenCoursesInput;
var url = "http://100.29.16.102"

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
  // Check if semester is selected on form submission
  $("#formSubmitButton").on("click", function () {
    const semester = $("#semester").val();
    if (!semester) {
      const toastElement = new bootstrap.Toast(
        document.getElementById("errorToast")
      );
      toastElement.show();
    }
  });
});


function send_data() {
  console.log("Sending Data:", takenCoursesInput);
  const semester = $("#semester").val(); // Get the selected semester

  if (semester !== "") {
    fetch(url+"/api/recommend/create", {
      method: "POST",
      body: JSON.stringify({
        semester: semester,
        taken_courses: takenCoursesInput,
      }),
      headers: {
        "Content-type": "application/json; charset=UTF-8",
      },
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || "Invalid input");
          });
        }
        return response.json();
      })
      .then((json) => {
        console.log("Response Data:", json); // Debugging the response
        parseAndRenderTable(json); // Call to render the table with response data
        updateResultsMessage(
          "This plan must be reviewed and approved by a CSE advisor!"
        );
        let printDropdown = document.getElementById('printDropdown');
        if (printDropdown) {
            printDropdown.style.display = 'inline-block'; // Make it visible
        }      })
      .catch((error) => {
        console.error("Error:", error);
        // Show error in toast
        $(".toast-body").text(error.message); // Set the error message
        $(".toast").toast("show"); // Show the toast
      });
  } else {
    $(".toast-body").text("Semester is required!"); // Set the message for missing semester
    $(".toast").toast("show"); // Show the toast
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
              credit: course.credit
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
          <h3 style="text-align: center;">Generated Schedule</h3>
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

