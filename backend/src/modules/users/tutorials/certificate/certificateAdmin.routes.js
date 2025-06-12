router.patch("/:id/revoke", verifyToken, isAdmin, ctrl.revokeCertificate);
