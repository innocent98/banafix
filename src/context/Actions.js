export const LoginStart = (userCredentials) => ({
  type: "LOGIN_START",
});

export const LoginSuccess = (user, accessToken, refreshToken) => ({
  type: "LOGIN_SUCCESS",
  payload: user,
  accessToken,
  refreshToken,
});

export const LoginFailure = (error) => ({
  type: "LOGIN_FAILURE",
  payload: error,
});

export const Logout = () => ({
  type: "LOGOUT",
});

export const UpdateStart = (userCredentials) => ({
  type: "UPDATE_START",
});

export const UpdateSuccess = (user, accessToken, refreshToken) => ({
  type: "UPDATE_SUCCESS",
  payload: user,
  accessToken: accessToken,
  refreshToken: refreshToken
});

export const UpdateFailure = (error) => ({
  type: "UPDATE_FAILURE",
  payload: error,
});
