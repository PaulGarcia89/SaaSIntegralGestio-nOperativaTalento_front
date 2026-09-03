const STORAGE_PREFIX = "training-assessment-submit:";

function browserStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function trainingAssessmentSubmitKey(attemptId: string) {
  return `training-assessment-submit:${attemptId}`;
}

export function getTrainingAssessmentSubmitKey(attemptId: string, storage: Storage | null = browserStorage()) {
  if (!attemptId || !storage) return null;
  const expected = trainingAssessmentSubmitKey(attemptId);
  try {
    return storage.getItem(`${STORAGE_PREFIX}${attemptId}`) === expected ? expected : null;
  } catch {
    return null;
  }
}

export function acquireTrainingAssessmentSubmit(lock: { current: boolean }, isPending: boolean) {
  if (lock.current || isPending) return false;
  lock.current = true;
  return true;
}

export function persistTrainingAssessmentSubmitKey(attemptId: string, storage: Storage | null = browserStorage()) {
  if (!attemptId || !storage) return null;
  const key = trainingAssessmentSubmitKey(attemptId);
  try {
    storage.setItem(`${STORAGE_PREFIX}${attemptId}`, key);
    return key;
  } catch {
    return key;
  }
}

export function clearTrainingAssessmentSubmitKey(attemptId: string, storage: Storage | null = browserStorage()) {
  if (!attemptId || !storage) return;
  try {
    storage.removeItem(`${STORAGE_PREFIX}${attemptId}`);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}
