var takenCoursesInput;

function updateTakenCourses() {
  const checkboxes = document.querySelectorAll('.form-check-input:checked');
  takenCoursesInput = Array.from(checkboxes).map(checkbox => checkbox.value);
  // console.log("Selected Courses:", selectedCourses); // Debugging
  // takenCoursesInput = document.getElementById('taken_courses_input');
  // takenCoursesInput.value = JSON.stringify({ value: selectedCourses });
}
function updateResultsMessage(message) {
  const messageElement = document.getElementById('results-message');
  messageElement.textContent = message; // Update the text content of the message
}

// the function for printing the table
function printTable() {
  const tableSection = document.getElementById('table-wrapper');
  if (!tableSection) {
      console.error("Table section not found!");
      return;
  }

  const printWindow = window.open('', '', 'width=800,height=600,location=no,menubar=no,toolbar=no,status=no');
  printWindow.document.write('<html><head><title>Print Schedule</title>');
  printWindow.document.write('<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css">');
  printWindow.document.write('</head><body>');
  printWindow.document.write('<h3>Generated Schedule</h3>');
  printWindow.document.write(tableSection.innerHTML);
  printWindow.document.write('</body></html>');
  printWindow.document.close();
  printWindow.print();
}

$(document).ready(function () {
  // Print the table when the print button is clicked
  $('#printButton').on('click', function () {
      printTable();
  });
});


$(document).ready(function () {
  // Check if semester is selected on form submission
  $('#formSubmitButton').on('click', function () {
      const semester = $('#semester').val();
      if (!semester) {
          const toastElement = new bootstrap.Toast(document.getElementById('errorToast'));
          toastElement.show();
      }
  });
});


// function send_data() {
//   console.log(takenCoursesInput)
//   const semester = $('#semester').val();; // Replace "mySelect" with the ID of your select element

//   if(semester != ""){

//     fetch("http://127.0.0.1:8000/api/recommend/create", {
//         method: "POST",
//         body: JSON.stringify({
//           semester: semester,
//           taken_courses: takenCoursesInput,
//         }),
//         headers: {
//           "Content-type": "application/json; charset=UTF-8"
//         }
//       })
//         .then((response) => response.json())
//         .then((json) => {
//             document.getElementById("response").innerHTML = json;
//         });
//   }else{
//     $('.toast').toast('show');
//   }

// }


//new scripts for the response table 
// Function to send data and handle the response
// function send_data() {
//   console.log("Sending Data:", takenCoursesInput);
//   const semester = $('#semester').val(); // Get the selected semester

//   if (semester !== "") {
//     fetch("http://127.0.0.1:8000/api/recommend/create", {
//       method: "POST",
//       body: JSON.stringify({
//         semester: semester,
//         taken_courses: takenCoursesInput,
//       }),
//       headers: {
//         "Content-type": "application/json; charset=UTF-8",
//       },
//     })
//       .then((response) => response.json())
//       .then((json) => {
//         console.log("Response Data:", json); // Debugging the response
//         parseAndRenderTable(json); // Call to render the table with response data
//         // Example usage after populating the table
//         updateResultsMessage("This plan must be reviewed and approved by a CSE advisor!");
//       })
//       .catch((error) => console.error("Error:", error));
//   } else {
//     $('.toast').toast('show');
//   }
// }

function send_data() {
  console.log("Sending Data:", takenCoursesInput);
  const semester = $('#semester').val(); // Get the selected semester

  if (semester !== "") {
    fetch("http://127.0.0.1:8000/api/recommend/create", {
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
        updateResultsMessage("This plan must be reviewed and approved by a CSE advisor!");
      })
      .catch((error) => {
        console.error("Error:", error);
        // Show error in toast
        $('.toast-body').text(error.message); // Set the error message
        $('.toast').toast('show'); // Show the toast
      });
  } else {
    $('.toast-body').text("Semester is required!"); // Set the message for missing semester
    $('.toast').toast('show'); // Show the toast
  }
}

// Function to parse and render the table
function parseAndRenderTable(responseText) {
  // Parse the response into structured data
  const parsedData = responseText
    .trim()
    .split('<br/>')
    .filter(line => line.trim() !== "")
    .map(line => {
      const semesterMatch = line.match(/Semester: (\w+)/);
      const coursesMatch = line.match(/Courses: (\[.*?\])/);
      const creditsMatch = line.match(/Credits: (\d+)/);

      return {
        semester: semesterMatch ? semesterMatch[1] : "",
        courses: coursesMatch ? JSON.parse(coursesMatch[1].replace(/'/g, '"')) : [],
        credits: creditsMatch ? parseInt(creditsMatch[1], 10) : 0,
      };
    });

  // Update the table dynamically
  const semesterHeaders = document.getElementById("semester-headers");
  const courseBody = document.getElementById("course-body");
  semesterHeaders.innerHTML = "";
  courseBody.innerHTML = "";

  // Add semester headers
  parsedData.forEach(semester => {
    const headerCell = document.createElement("th");
    headerCell.className = "semester-column";
    headerCell.style.color="white"
    headerCell.innerText = `Semester ${semester.semester}`;
    semesterHeaders.appendChild(headerCell);
  });

  // Maximum number of courses for any semester
  const maxCourses = Math.max(...parsedData.map(s => s.courses.length));

  // Add rows for courses
  for (let i = 0; i < maxCourses; i++) {
    const row = document.createElement("tr");
    parsedData.forEach(semester => {
      const cell = document.createElement("td");
      cell.innerText = semester.courses[i] || ""; // Leave blank if no course
      row.appendChild(cell);
    });
    courseBody.appendChild(row);
  }

  // Add row for credits
  const creditsRow = document.createElement("tr");
  parsedData.forEach(semester => {
    const cell = document.createElement("td");
    cell.innerHTML = `<strong>Credits: ${semester.credits}</strong>`;
    creditsRow.appendChild(cell);
  });
  courseBody.appendChild(creditsRow);
}