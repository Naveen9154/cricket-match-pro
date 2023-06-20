const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const cdbPObjectToReOb = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const cdbMObjectToReOb = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPq = `
   SELECT
    *
    FROM
     player_details;`;
  const pa = await db.all(getPq);
  response.send(pa.map((ep) => cdbPObjectToReOb(ep)));
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPq = `SELECT
    *
    FROM
     player_details
     WHERE
     player_id=${playerId}`;
  const pa = await db.get(getPq);
  response.send(cdbPObjectToReOb(pa));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const getPq = `UPDATE
     player_details
     SET
     player_name='${playerName}'
     WHERE
     player_id=${playerId}`;
  await db.run(getPq);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPq = `SELECT
    *
    FROM
     match_details
     WHERE
     match_id=${matchId}`;
  const pa = await db.get(getPq);
  response.send(cdbMObjectToReOb(pa));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPq = `SELECT
    *
    FROM
     player_match_score
     NATURAL JOIN match_details
     WHERE
     player_id=${playerId}`;
  const pa = await db.all(getPq);
  response.send(pa.map((ep) => cdbMObjectToReOb(ep)));
});

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPq = `SELECT
    *
    FROM
     player_match_score
     NATURAL JOIN player_details
     WHERE
     match_id=${matchId}`;
  const pa = await db.all(getPq);
  response.send(pa.map((ep) => cdbPObjectToReOb(ep)));
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getPq = `SELECT
    player_id as playerId,
    player_name as playerName,
    SUM(score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes
    FROM
     player_match_score NATURAL JOIN player_details
     WHERE
     player_id=${playerId}`;
  const pa = await db.get(getPq);
  response.send(pa);
});

module.exports = app;
