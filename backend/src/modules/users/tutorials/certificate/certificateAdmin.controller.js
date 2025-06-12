exports.revokeCertificate = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const cert = await db("certificates").where({ id }).first();
  if (!cert) throw new AppError("Certificate not found", 404);

  await db("certificates")
    .where({ id })
    .update({ status: "revoked", revoked_at: db.fn.now(), reason });

  sendSuccess(res, null, "Certificate revoked");
});
