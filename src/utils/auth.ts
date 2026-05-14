import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

function getPool(): CognitoUserPool {
  return new CognitoUserPool({
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  });
}

export function isConfigured(): boolean {
  return !!(import.meta.env.VITE_COGNITO_USER_POOL_ID && import.meta.env.VITE_COGNITO_CLIENT_ID);
}

export function getCurrentUserEmail(): string | null {
  return getPool().getCurrentUser()?.getUsername() ?? null;
}

export function getIdToken(): Promise<string | null> {
  return new Promise(resolve => {
    const user = getPool().getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: { isValid: () => boolean; getIdToken: () => { getJwtToken: () => string } } | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}

export async function signIn(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.authenticateUser(
      new AuthenticationDetails({ Username: email, Password: password }),
      { onSuccess: () => resolve(), onFailure: reject }
    );
  });
}

export async function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getPool().signUp(
      email,
      password,
      [new CognitoUserAttribute({ Name: 'email', Value: email })],
      [],
      err => (err ? reject(err) : resolve())
    );
  });
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.confirmRegistration(code, true, err => (err ? reject(err) : resolve()));
  });
}

export function signOut(): void {
  getPool().getCurrentUser()?.signOut();
}
