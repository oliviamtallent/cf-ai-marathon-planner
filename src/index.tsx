import { Hono } from "hono";
import { renderer } from "./renderer";
import { Ai } from "@cloudflare/workers-types";

const CHAT_MODEL_DEFAULT = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const SYSTEM_MESSAGE_DEFAULT = `You are a marathon training coach AI. 
You will be given today's date and information about the runner. 
Start the plan at this date and create plans for days 1-3.

You MUST output valid JSON only, make sure it is closed properly.
Do NOT include any explanatory text.
Do NOT include markdown.
Do NOT include multiple languages.
Do NOT include emojis or symbols.

Output must strictly follow this schema:

{
  "plan": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "type": "Easy Run | Workout | Long Run | Rest | Strength",
      "description": "string",
      "distance_miles": number | null,
      "notes": "string"
    }
  ]
}

If information is missing, make a reasonable assumption.`

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(renderer);

app.get("/", (c) => {
  return c.render(
    <>
      <div style={{display: 'flex'}}>
        <div style={{display: 'flex', flexDirection: 'column', marginLeft: 'clamp(0.9rem, 5vh, 1.3rem)', marginRight: 'clamp(0.9rem, 5vh, 1.3rem)', width: '125vh'}}>
          <h1 style={{fontSize: 'clamp(0.9rem, 10vh, 1.3rem)', fontWeight: 'bold', marginTop: 'clamp(0.9rem, 5vh, 1.3rem)', marginBottom: 'clamp(0.9rem, 5vh, 1.3rem)'}}>Marathon Plan Creator: Setup</h1>
          <h1>Training Status</h1>
          <textarea
              id="training-status"
              className="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
              placeholder="Explain your current fitness status..."
            ></textarea>
          <h1>Projected Marathon Date</h1>
          <div style={{display: 'flex', flexDirection: 'row', marginTop: '2vh', marginBottom: '2vh'}}>
            <div style={{display: 'flex', flexDirection: 'column', width: '45vh'}}>
              <select name="month" id="month-select" style={{height: '5vh', marginRight: '1vh'}} className="rounded shadow-sm border-chat-border border">
                <option value="">Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', width: '45vh'}}>
              <select id="day-select" style={{height: '5vh', marginRight: '1vh'}} className="rounded shadow-sm border-chat-border border"></select>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', width: '45vh'}}>
              <select id="year-select" style={{height: '5vh', marginRight: '1vh'}} className="rounded shadow-sm border-chat-border border"></select>
            </div>
          
          </div>
          <h1>Goals</h1>
          <textarea
            id="goals"
            className="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
            placeholder="Detail your marathon related goals (time or otherwise)..."
          ></textarea>
          <h1>Time Constraints</h1>
          <textarea
            id="time-constraints"
            className="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
            placeholder="Detail the amount of time you are willing to dedicate..."
          ></textarea>

          <button
                id="create-plan-btn"
                className="m-2 px-4 py-2 bg-chat-button text-black rounded hover:bg-gray-300"
              >
                Create Plan
              </button>
          <p1 style={{color: 'red'}} id="error-text"></p1>
        </div>
        <div>
          <h1 id="loading-text" className="hidden" style={{marginTop: '2vh'}}>Loading Your Plan... Days Generated: 0</h1>
          <div id="plan-view" className="hidden">
            <h1 style={{fontSize: 'clamp(0.9rem, 10vh, 1.3rem)', fontWeight: 'bold', marginTop: 'clamp(0.9rem, 5vh, 1.3rem)'}}>Your Plan</h1>
            <div style={{display: 'flex', width: '75vh', marginBottom: '5vh'}}>
              <button
                id="left-btn"
                style={{marginLeft: 'auto'}}
                className="m-2 px-4 py-2 bg-chat-button text-black rounded hover:bg-gray-300"
              >
                {"<"}
              </button>
              <h1 id="date-text-box" style={{fontWeight: 'bold', display: 'flex', alignItems: 'center'}}>02-05-2026</h1>
              <button
                id="right-btn"
                style={{marginRight: 'auto'}}
                className="m-2 px-4 py-2 bg-chat-button text-black rounded hover:bg-gray-300"
              >
                {">"}
              </button>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <h1 style={{fontWeight: 'bold', marginRight: '5vh'}}>Run Type: </h1>
              <p1 id="run-type-box" style={{width: '50vh', overflowWrap: 'break-word'}}></p1>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <h1 style={{fontWeight: 'bold', marginRight: '5vh'}}>Distance: </h1>
              <p1 id="distance-box" style={{width: '50vh', overflowWrap: 'break-word'}}></p1>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <h1 style={{fontWeight: 'bold', marginRight: '5vh'}}>Description: </h1>
              <p1 id="desc-box" style={{width: '50vh', overflowWrap: 'break-word'}}></p1>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
              <h1 style={{fontWeight: 'bold'}}>Additional Notes: </h1>
              <p1 id="notes-box" style={{width: '50vh', overflowWrap: 'break-word'}}></p1>
            </div>
            <div style={{display: 'flex', marginTop: '25vh', flexDirection: 'column'}}>
              <h1 style={{fontWeight: 'bold'}}>Personal Notes</h1>
              <textarea
                id="user-notes"
                className="flex-grow m-2 p-2 border border-chat-border rounded shadow-sm placeholder-chat-placeholder"
                placeholder="Describe how the run went..."
              ></textarea>
            </div>
          </div>
        </div>
        
      </div>
      <script src="/static/script.js"></script>
    </>
  );
});

app.post("/api/plan", async (c) => {
  const { trainingStatus, marathonDate, goals, timeConstraints, startDay, endDay, totalDays } = await c.req.json();

  const todaysDate = new Date().toISOString().split("T")[0]
  
  const prompt = "Generate Plan days " + parseInt(startDay) + "-" + parseInt(endDay) + " Today's Date: " + todaysDate + "Training status: " + trainingStatus + " Marathon Date: " + marathonDate + " Goal: " + goals + " Time Constraints: " + timeConstraints + " The last day is (make sure to taper as it gets closer, if this is zero, label the last day as the marathon): " + (totalDays - endDay);

  const result = await c.env.AI.run(
    CHAT_MODEL_DEFAULT,
    {
      messages: [
        {
          role: "system",
          content: SYSTEM_MESSAGE_DEFAULT
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2
    }
  );

  return c.json(result);
})

export default app;
