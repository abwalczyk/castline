export type ActionState = { error: string; ok: string };

export const initialActionState: ActionState = { error: "", ok: "" };

export function failure(error: string): ActionState {
  return { error, ok: "" };
}

export function success(ok: string): ActionState {
  return { error: "", ok };
}
