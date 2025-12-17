exports.sendSuccess = (res, data, message = "Success", meta) => {
  res.status(200).json({
    status: "success",
    message,
    data,
    ...(meta ? { meta } : {}),
  });
};
