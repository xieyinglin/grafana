import config from 'app/core/config';
import { ThunkResult } from 'app/types';
import {
  getLdapState,
  getLdapSyncStatus,
  getUser,
  getUserInfo,
  getUserSessions,
  revokeAllUserSessions,
  revokeUserSession,
  syncLdapUser,
} from './apis';
import {
  clearUserErrorAction,
  clearUserMappingInfoAction,
  ldapConnectionInfoLoadedAction,
  ldapFailedAction,
  ldapSyncStatusLoadedAction,
  userLoadedAction,
  userMappingInfoFailedAction,
  userMappingInfoLoadedAction,
  userSessionsLoadedAction,
  userSyncFailedAction,
} from './reducers';

// Actions

export function loadLdapState(): ThunkResult<void> {
  return async dispatch => {
    try {
      const connectionInfo = await getLdapState();
      dispatch(ldapConnectionInfoLoadedAction(connectionInfo));
    } catch (error) {
      error.isHandled = true;
      const ldapError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(ldapFailedAction(ldapError));
    }
  };
}

export function loadLdapSyncStatus(): ThunkResult<void> {
  return async dispatch => {
    if (config.buildInfo.isEnterprise) {
      // Available only in enterprise
      const syncStatus = await getLdapSyncStatus();
      dispatch(ldapSyncStatusLoadedAction(syncStatus));
    }
  };
}

export function loadUserMapping(username: string): ThunkResult<void> {
  return async dispatch => {
    try {
      const userInfo = await getUserInfo(username);
      dispatch(userMappingInfoLoadedAction(userInfo));
    } catch (error) {
      error.isHandled = true;
      const userError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(clearUserMappingInfoAction());
      dispatch(userMappingInfoFailedAction(userError));
    }
  };
}

export function clearUserError(): ThunkResult<void> {
  return dispatch => {
    dispatch(clearUserErrorAction());
  };
}

export function clearUserMappingInfo(): ThunkResult<void> {
  return dispatch => {
    dispatch(clearUserErrorAction());
    dispatch(clearUserMappingInfoAction());
  };
}

export function syncUser(userId: number): ThunkResult<void> {
  return async dispatch => {
    try {
      await syncLdapUser(userId);
      dispatch(loadLdapUserInfo(userId));
      dispatch(loadLdapSyncStatus());
    } catch (error) {
      dispatch(userSyncFailedAction());
    }
  };
}

export function loadLdapUserInfo(userId: number): ThunkResult<void> {
  return async dispatch => {
    try {
      const user = await getUser(userId);
      dispatch(userLoadedAction(user));
      dispatch(loadUserSessions(userId));
      dispatch(loadUserMapping(user.login));
    } catch (error) {
      error.isHandled = true;
      const userError = {
        title: error.data.message,
        body: error.data.error,
      };
      dispatch(userMappingInfoFailedAction(userError));
    }
  };
}

export function loadUserSessions(userId: number): ThunkResult<void> {
  return async dispatch => {
    const sessions = await getUserSessions(userId);
    dispatch(userSessionsLoadedAction(sessions));
  };
}

export function revokeSession(tokenId: number, userId: number): ThunkResult<void> {
  return async dispatch => {
    await revokeUserSession(tokenId, userId);
    dispatch(loadUserSessions(userId));
  };
}

export function revokeAllSessions(userId: number): ThunkResult<void> {
  return async dispatch => {
    await revokeAllUserSessions(userId);
    dispatch(loadUserSessions(userId));
  };
}
