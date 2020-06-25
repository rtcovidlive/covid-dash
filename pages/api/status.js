export default async (req, res) => {
  res.statusCode = 200;
  res.end(JSON.stringify({ status: "ok" }));
};
