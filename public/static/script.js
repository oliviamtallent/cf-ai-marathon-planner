let plans = [];
let date = 0;
let running = false;

let personalNotes = []

// Set up day select box
const daySelect = document.getElementById("day-select");
daySelect.innerHTML = `<option value="">Day</option>`;
for (let i = 1; i <= 31; i++) {
  daySelect.innerHTML += `<option value="${i}">${i}</option>`;
}

// Set up year select box
const yearSelect = document.getElementById("year-select");
yearSelect.innerHTML = `<option value="">Year</option>`;
const currentYear = new Date().getFullYear();
for (let i = 0; i <= 1; i++) {
  yearSelect.innerHTML += `<option value="${currentYear + i}">${currentYear + i}</option>`;
}

function showData(daysFromToday) {
  // set up all of the text output values
  const runTypeBox = document.getElementById("run-type-box");
  const distanceBox = document.getElementById("distance-box");
  const descBox = document.getElementById("desc-box");
  const notesBox = document.getElementById("notes-box");
  const dateTextBox = document.getElementById("date-text-box");
  
  document.getElementById("user-notes").value = personalNotes[date]

  const dayPlan = plans[daysFromToday];

  dateTextBox.textContent = dayPlan.date
  runTypeBox.textContent = dayPlan.type
  distanceBox.textContent = dayPlan.distance_miles
  descBox.textContent = dayPlan.description
  notesBox.textContent = dayPlan.notes
}

async function sendMessage(startDay, endDay, totalDays, marathonDate) {
  if (running == true) {
    // retrieve user inputted data
    const trainingStatus = document.getElementById("training-status").value;
    const goals = document.getElementById("goals").value;
    const timeConstraints = document.getElementById("time-constraints").value;

    const res = await fetch("/api/plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trainingStatus,
        marathonDate,
        goals,
        timeConstraints,
        startDay,
        endDay,
        totalDays
      })
    });

    const data = await res.json();

    console.log("Plan found.")
    console.log(data.response)
    let parsed;

    // Parse the JSON given from the model
    if (typeof data.response == "string") {
      try {
        parsed = JSON.parse(data.response)
      } catch (err) {
        document.getElementById("error-text").textContent = "An Error Has Occurred, please try again."
        console.log("Improper AI JSON Output")
        document.getElementById("loading-text").textContent = "";
        running = false;
        return;
      }
    } else {
      parsed = data.response
    }

    plans.push(...parsed.plan)

    if (endDay < totalDays) {
      let newEnd = endDay + 2
      let newStart = startDay + 2
      if (newEnd > totalDays) {
        newEnd = totalDays;
      }

      console.log("Start: " + newStart)
      document.getElementById("loading-text").textContent = "Loading Your Plan... Days Generated: " + (newStart - 2);

      // Recursively chunk calls to the AI to avoid truncated output
      return await sendMessage(newStart, newEnd, totalDays);
    }
    
    // Update Loading Screen to Show Output
    const loading = document.getElementById("loading-text");
    loading.classList.toggle("hidden", true)
    const plansView = document.getElementById("plan-view");
    plansView.classList.toggle("hidden", false)

    // Remove user Inputs
    document.getElementById("training-status").value = "";
    document.getElementById("goals").value = "";
    document.getElementById("time-constraints").value = "";
    document.getElementById("year-select").value = "";
    document.getElementById("day-select").value = "";
    document.getElementById("month-select").value = "";

    personalNotes = new Array(plans.length).fill("")
    running = false;
    showData(0)
  }
}

document
  .getElementById("create-plan-btn")
  .addEventListener("click", function (e) {
    document.getElementById("error-text").textContent = ""

    // Ensure data is entered for all text areas
    const trainingStatus = document.getElementById("training-status").value;
    const goals = document.getElementById("goals").value;
    const timeConstraints = document.getElementById("time-constraints").value;

    if (trainingStatus == "" || goals == "" || timeConstraints == "") {
      document.getElementById("error-text").textContent = "Please input information."
      return;
    }
    let year = parseInt(document.getElementById("year-select").value);
    let day = parseInt(document.getElementById("day-select").value);
    let month = parseInt(document.getElementById("month-select").value);

    // Ensure something has been selected for all drop downs
    if (Number.isNaN(year) || Number.isNaN(day) || Number.isNaN(month)) {
      document.getElementById("error-text").textContent = "Please enter a projected marathon date."
      return;
    }
    console.log(year)

    // figure out the marathon date
    const marathonDate = new Date(year, month - 1, day);
    const today = new Date()
    const numDays = Math.ceil((marathonDate - today) / (1000 * 60 * 60 * 24));
    if (numDays < 0) {
      document.getElementById("error-text").textContent = "Please Enter a Marathon Date in the Future"
    } else if (!running) {
      plans = [];
      date = 0;
      personalNotes=[];
      running = true;
      console.log("Loading...")
      const loading = document.getElementById("loading-text");
      loading.classList.toggle("hidden", false)
      
      sendMessage(1, 2, numDays, marathonDate.toISOString().split("T")[0]);
    }
  });

document
  .getElementById("right-btn")
  .addEventListener("click", function (e) {
    if (date + 1 < plans.length) {
      personalNotes[date] = document.getElementById("user-notes").value
      date += 1;
      showData(date);
    }
  });

document
  .getElementById("left-btn")
  .addEventListener("click", function (e) {
    if (date > 0) {
      personalNotes[date] = document.getElementById("user-notes").value
      date -= 1;
      showData(date);
    }
  });
