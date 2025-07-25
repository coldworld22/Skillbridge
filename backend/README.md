# Backend

This folder contains the Express.js API for SkillBridge. Run `npm test` to execute the Jest suite.

The `/api/system-errors` route reads the latest lines from `logs/error.log` and is used by the admin alerts page. Only authenticated admins can access it.
