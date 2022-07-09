const { copyDb, CORS } = require("./utils.js");

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

    await copyDb(body["sourceConnection"], body["targetConnection"]);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ message: "Copying is finished" }),
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
