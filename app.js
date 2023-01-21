const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const dbObjectToObjectResponse = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1

app.get("/states/", async (request, response) => {
  const getStateQuery = `SELECT * FROM
    state;`;
  const state = await db.all(getStateQuery);
  response.send(state.map((each) => dbObjectToObjectResponse(each)));
});

//API 2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT * FROM 
    state
    WHERE state_id = ${stateId};`;
  const state = await db.get(getStateIdQuery);
  response.send(dbObjectToObjectResponse(state));
});

//API 3

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (district_name, state_id, cases, cured, active, deaths)
  VALUES
    ('${districtName}', '${stateId}', '${cases}', '${cured}', '${active}', '${deaths}');`;
  const dist = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { distId } = request.params;
  const getDistQuery = `
    SELECT 
      * 
    FROM 
      district 
    WHERE 
      district_id = '${distId}';`;
  const dist = await db.get(getDistQuery);
  response.send(dbObjectToObjectResponse(dist));
});

//API 5

app.delete("/districts/:districtId/", async (request, response) => {
  const { distId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM 
    district
    WHERE 
    district_id = '${distId}';`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { distId } = request.params;
  const putDistrictQuery = `
    UPDATE 
    district
    SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE 
    district_id = '${distId}';`;
  await db.run(putDistrictQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT 
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM 
        district
    WHERE 
        state_id = ${stateId};`;
  const dist = await db.get(getStatsQuery);
  console.log(dist);
  response.send({
    totalCases: dist["SUM(cases)"],
    totalCured: dist["SUM(cured)"],
    totalActive: dist["SUM(active)"],
    totalDeaths: dist["SUM(deaths)"],
  });
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { stateId } = request.params;
  const getStateIdQuery = `
    SELECT 
        state_name
    FROM 
        state
    WHERE 
        state_id = '${stateId}';`;
  const state = await db.get(getStateIdQuery);
  response.send(dbObjectToObjectResponse(state));
});

module.exports = app;
