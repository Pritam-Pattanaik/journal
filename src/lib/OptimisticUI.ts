import { toast } from 'sonner';

export interface OptimisticMutationConfig<TData, TVariables> {
  onMutate: (variables: TVariables) => Promise<TData | undefined> | TData | undefined;
  onError: (error: Error, variables: TVariables, context?: TData) => void;
  onSuccess?: (data: any, variables: TVariables, context?: TData) => void;
  onSettled?: () => void;
  conflictRetryLimit?: number;
}

/**
 * OptimisticUI Controller for Institutional Trade Ledger & Journal Operations.
 * Manages zero-latency local memory transitions, rollback reconciliations,
 * and HTTP 409 Overwrite Protection / Concurrent collision detection.
 */
export class OptimisticController {
  private static pendingMutations: Map<string, any> = new Map();

  /**
   * Executes an optimistic state transition with deterministic rollback on failure.
   */
  public static async execute<TData, TVariables>(
    mutationId: string,
    variables: TVariables,
    asyncTask: () => Promise<any>,
    config: OptimisticMutationConfig<TData, TVariables>
  ): Promise<any> {
    // 1. Capture snapshots and execute optimistic local update immediately
    const previousState = await config.onMutate(variables);
    this.pendingMutations.set(mutationId, { variables, previousState });

    try {
      // 2. Perform background API call
      const result = await asyncTask();
      
      this.pendingMutations.delete(mutationId);
      if (config.onSuccess) {
        config.onSuccess(result, variables, previousState);
      }
      return result;
    } catch (error: any) {
      // 3. Handle specific failure classifications & rollback
      this.pendingMutations.delete(mutationId);
      config.onError(error as Error, variables, previousState);

      const status = error?.status || error?.response?.status || 500;

      // HTTP 409 Conflict (Concurrency divergence)
      if (status === 409) {
        toast.error('Concurrency Collision (409): Record modified by another session. Automatically rolling back local state to preserve audit integrity.');
      } else if (status === 401 || status === 403) {
        toast.error('Session Token Expired (401/403): Authentication validation failed. Reconciled state to pre-mutation snapshot.');
      } else if (!navigator.onLine) {
        toast.error('Network Offline: Could not synchronize order entry. Rolled back state safely.');
      } else {
        toast.error(`Mutation failed (${error.message || status}). Local state automatically reconciled.`);
      }

      throw error;
    } finally {
      if (config.onSettled) {
        config.onSettled();
      }
    }
  }

  /**
   * Verifies whether a given resource currently has an incomplete optimistic transition pending.
   */
  public static isPending(mutationId: string): boolean {
    return this.pendingMutations.has(mutationId);
  }
}
