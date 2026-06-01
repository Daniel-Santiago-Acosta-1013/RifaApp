import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const region = import.meta.env.VITE_COGNITO_REGION as string | undefined;
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string | undefined;

export const isCognitoConfigured = Boolean(region && userPoolId && userPoolClientId);

const userPool = isCognitoConfigured
  ? new CognitoUserPool({
      UserPoolId: userPoolId as string,
      ClientId: userPoolClientId as string,
    })
  : null;

const cognitoUser = (email: string) => {
  if (!userPool) {
    throw new Error("Cognito no esta configurado.");
  }
  return new CognitoUser({ Username: email, Pool: userPool });
};

const getCurrentCognitoUser = () => userPool?.getCurrentUser() ?? null;

const getSession = () =>
  new Promise<CognitoUserSession | null>((resolve, reject) => {
    const user = getCurrentCognitoUser();
    if (!user) {
      resolve(null);
      return;
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(session?.isValid() ? session : null);
    });
  });

export const getCurrentIdToken = async () => {
  if (!isCognitoConfigured) {
    return null;
  }
  const session = await getSession();
  return session?.getIdToken().getJwtToken() ?? null;
};

export const signUpWithCognito = (name: string, email: string, password: string) =>
  new Promise<void>((resolve, reject) => {
    if (!userPool) {
      reject(new Error("Cognito no esta configurado."));
      return;
    }
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

export const confirmSignUpWithCognito = (email: string, code: string) =>
  new Promise<void>((resolve, reject) => {
    cognitoUser(email).confirmRegistration(code, true, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

export const resendSignUpCodeWithCognito = (email: string) =>
  new Promise<void>((resolve, reject) => {
    cognitoUser(email).resendConfirmationCode((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });

export const signInWithCognito = (email: string, password: string) =>
  new Promise<void>((resolve, reject) => {
    const user = cognitoUser(email);
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: () => resolve(),
      onFailure: reject,
      newPasswordRequired: () => reject(new Error("Debes completar el cambio de contrasena antes de continuar.")),
    });
  });

export const signOutFromCognito = () => {
  getCurrentCognitoUser()?.signOut();
};

export const forgotPasswordWithCognito = (email: string) =>
  new Promise<void>((resolve, reject) => {
    cognitoUser(email).forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
      inputVerificationCode: () => resolve(),
    });
  });

export const confirmForgotPasswordWithCognito = (email: string, code: string, password: string) =>
  new Promise<void>((resolve, reject) => {
    cognitoUser(email).confirmPassword(code, password, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });

export const changePasswordWithCognito = async (oldPassword: string, newPassword: string) => {
  const user = getCurrentCognitoUser();
  if (!user) {
    throw new Error("No hay una sesion activa.");
  }
  await getSession();
  return new Promise<void>((resolve, reject) => {
    user.changePassword(oldPassword, newPassword, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};
