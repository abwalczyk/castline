import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { failure, success, type ActionState } from "@/lib/action-state";
import { AppError } from "@/lib/errors";

export async function run(work: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    const result = await work();
    const path = (await headers()).get("x-pathname");
    if (path?.startsWith("/")) revalidatePath(path);
    return result ?? success("Saved.");
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof AppError) return failure(error.message);
    console.error(error);
    return failure("Something went wrong. Try again.");
  }
}
