const model = require("./classRule.model");

exports.createRule = ({ class_id, text }) => model.create({ class_id, text });
exports.getRules = (class_id) => model.findByClass(class_id);
exports.updateRule = (id, text) => model.update(id, { text });
exports.deleteRule = (id) => model.remove(id);
