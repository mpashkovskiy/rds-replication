exports.main = async function (event, context) {
  return {
    statusCode: 200,
    headers: CORS,
    body: "OK",
  };
};
