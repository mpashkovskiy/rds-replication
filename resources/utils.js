const { spawn } = require("child_process");

exports.copyDb = async function (
  sourceConnection,
  targetConnection,
  dumpOptions = ""
) {
  const cmd = `pg_dump ${dumpOptions} --dbname=${sourceConnection} | psql --dbname=${targetConnection}`;
  console.log(cmd);
  await new Promise((resolve, reject) => {
    const process = spawn("sh", ["-c", cmd]);
    process.stdout.on("data", (data) => console.log(`${data}`));
    process.stderr.on("data", (data) => console.error(`${data}`));
    process.on("exit", function (code, signal) {
      if (+code !== 0) {
        console.error(`Exited with code: ${code} and signal: ${signal}`);
        reject("Cannot perform the operation");
      }
      resolve();
    });
    process.on("error", reject);
  });
};

exports.CORS = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};
