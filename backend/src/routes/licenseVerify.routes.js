const express = require('express');
const router = express.Router();
const { validatePurchaseCode } = require('../services/licenseService');

router.post('/verify', async (req, res) => {
  try {
    const { purchase_code: purchaseCode, domain } = req.body;
    if (!purchaseCode) {
      return res.status(400).json({ error: 'Purchase code required' });
    }

    const result = await validatePurchaseCode(purchaseCode, domain);

    if (result.valid) {
      return res.json({ success: true, message: result.message });
    }

    return res
      .status(400)
      .json({ success: false, message: result.message || 'Invalid purchase code' });
  } catch (err) {
    return res.status(500).json({ error: 'License check failed' });
  }
});

module.exports = router;
