module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // In EAS Build, set GOOGLE_SERVICES_JSON as a "file" env var.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
  },
});
