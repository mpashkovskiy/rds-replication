const fs = require("fs");
const { Transform, pipeline } = require("stream");
const { promisify } = require("util");
const ppipeline = promisify(pipeline);
const pgwire = require("pgwire");
const { copyDb, CORS } = require("./utils.js");

const TABLES = [
  "Categories",
  "Customers",
  "Employees",
  "Shippers",
  "Suppliers",
  "Products",
  "Orders",
  "OrderDetails",
];

exports.main = async function (event, _) {
  console.log(JSON.stringify(event, null, 2));
  try {
    let body = JSON.parse(event.body);
    if (!body["sourceConnection"] || !body["targetConnection"]) {
      return {
        statusCode: 400,
        headers: CORS,
      };
    }

    await copyDb(body["sourceConnection"], body["targetConnection"], "-s");
    await copyData(
      body["sourceConnection"],
      body["targetConnection"],
      body["fieldsToMask"]
    );
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: "DB was copied successfully" }),
    };
  } catch (error) {
    var message = error.stack || JSON.stringify(error, null, 2);
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ message }),
    };
  }
};

async function copyData(sourceConnection, targetConnection, fieldsToMask) {
  const sourceDb = await pgwire.connect(sourceConnection);
  const targetDb = await pgwire.connect(targetConnection);
  for (const table of TABLES) {
    if (!fieldsToMask[table]) {
      const copyUpstream = sourceDb.query({
        statement: `COPY ${table} TO STDOUT`,
      });
      await targetDb.query({
        statement: `COPY ${table} FROM STDIN`,
        stdin: copyUpstream,
      });
    } else {
      const dataFile = `/tmp/${table}_${Date.now()}.csv`;
      const copyUpstream = sourceDb.query({
        statement: `COPY ${table} TO STDOUT DELIMITER ';' CSV HEADER`,
      });
      await ppipeline(
        copyUpstream,
        getMasker(fieldsToMask[table]),
        fs.createWriteStream(dataFile)
      );
      await targetDb.query({
        statement: `COPY ${table} FROM STDIN DELIMITER ';' CSV HEADER`,
        stdin: fs.createReadStream(dataFile),
      });
    }
  }
}

function getMasker(fields) {
  const masker = new Transform({
    colIdxs: undefined,
    transform: function (chunk, _, callback) {
      let row = chunk.toString();
      if (row.length > 0) {
        if (!masker.colIdxs) {
          const header = row
            .split(";")
            .map((name) => name.trim().toLowerCase());
          masker.colIdxs = fields.map((name) =>
            header.indexOf(name.toLowerCase())
          );
        } else {
          row = row
            .split(";")
            .map((el, idx) =>
              masker.colIdxs.indexOf(idx) === -1 ? el.trim() : "***"
            )
            .join(";");
          row = row + "\n";
        }
      }
      callback(null, row);
    },
  });
  return masker;
}
