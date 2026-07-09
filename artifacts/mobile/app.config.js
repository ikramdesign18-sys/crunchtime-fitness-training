const CLEAR_TEXT_BUILD_PROFILES = new Set(["development", "preview"]);

function getBuildProfile() {
  if (process.env.EAS_BUILD_PROFILE) {
    return process.env.EAS_BUILD_PROFILE;
  }

  return process.env.NODE_ENV === "production" ? "production" : "local";
}

function shouldEnableAndroidCleartextTraffic() {
  if (process.env.EAS_BUILD_PROFILE) {
    return CLEAR_TEXT_BUILD_PROFILES.has(process.env.EAS_BUILD_PROFILE);
  }

  return process.env.NODE_ENV !== "production";
}

module.exports = ({ config }) => {
  const buildProfile = getBuildProfile();
  const enableAndroidCleartextTraffic = shouldEnableAndroidCleartextTraffic();

  return {
    ...config,
    android: {
      ...config.android,
      usesCleartextTraffic: enableAndroidCleartextTraffic,
    },
    extra: {
      ...config.extra,
      buildProfile,
      enableAndroidCleartextTraffic,
    },
  };
};
