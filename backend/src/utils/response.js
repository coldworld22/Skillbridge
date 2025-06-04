exports.sendSuccess = (res, data, message = "Success") => {
  res.status(200).json({
    status: "success",
    message,
    data,
  });
};
