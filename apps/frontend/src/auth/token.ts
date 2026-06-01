type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export const setAuthTokenProvider = (provider: TokenProvider | null) => {
  tokenProvider = provider;
};

export const getAuthToken = async () => {
  if (!tokenProvider) {
    return null;
  }
  return tokenProvider();
};
