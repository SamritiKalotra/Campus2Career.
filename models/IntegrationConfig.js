const mongoose = require("mongoose");

const IntegrationConfigSchema = new mongoose.Schema({
  serviceName: String,
  apiKey: String,
  enabled: Boolean,
  config: Object
});

module.exports = mongoose.model("IntegrationConfig", IntegrationConfigSchema);