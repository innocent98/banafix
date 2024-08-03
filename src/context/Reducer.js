const Reducer = (state, action, accessToken, refreshToken) => {
    switch (action.type) {
      case "LOGIN_START":
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          isFecting: true,
          error: false,
        };
      case "LOGIN_SUCCESS":
        return {
          user: action.payload,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
          isFetching: false,
          error: false,
        };
      case "LOGIN_FAILURE":
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          isFecting: false,
          error: action.payload,
        };
      case "UPDATE_START":
        return {
          ...state,
          isFetching: true,
        };
      case "UPDATE_SUCCESS":
        return {
          user: action.payload,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isFetching: false,
          error: false,
        };
      case "UPDATE_FAILURE":
        return {
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isFecting: false,
          error: true,
        };
      case "LOGOUT":
        return {
          user: null,
          accessToken: null,
          refreshToken: null,
          isFecting: false,
          error: false,
        };
      default:
        return state;
    }
  };
  
  export default Reducer;
  