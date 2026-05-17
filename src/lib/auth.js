import { writable } from 'svelte/store';
import { PublicClientApplication, InteractionRequiredAuthError } from '@azure/msal-browser';
import { useMock } from './env';
import { mockUser, mockAccessToken } from './mock';
export const accessToken = writable(null);
export const user = writable(null);

import { msalConfig, loginRequest, tokenRequest } from "./auth.config";

// In mock mode, skip MSAL entirely. The real PublicClientApplication
// initialization triggers redirect-handling on load even before getAuth()
// is called, so we conditionally construct it.
const oMsal = useMock ? null : new PublicClientApplication(msalConfig);
if (oMsal) await oMsal.initialize();

export const getAuth = async () => {
    if (useMock) {
        user.set(mockUser.username);
        accessToken.set(mockAccessToken);
        return mockUser;
    }
    return oMsal.handleRedirectPromise()
        .then(() => oMsal.getAllAccounts()[0] ?? oMsal.loginRedirect(loginRequest))
            .then(x => { if (x) { user.set(x.username) }; return x; })
            .then(x => x && oMsal
                .acquireTokenSilent({ ...tokenRequest, account: x })
                .then(x => accessToken.set(x.accessToken))
                .catch(e => e instanceof InteractionRequiredAuthError
                    ? oMsal.acquireTokenRedirect({ ...tokenRequest, account: x })
                    : Promise.reject(e)));
};
