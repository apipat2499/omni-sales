import { useState, useCallback } from 'react';

export interface TrainingLog {
  id: string;
  model_type: string;
  status: 'started' | 'completed' | 'failed';
  metrics: any;
  error_message?: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
}

export interface TrainingResult {
  startedAt: string;
  completedAt: string;
  totalDurationSeconds: string;
  success: boolean;
  models: {
    recommendations?: any;
    forecast?: any;
    churn?: any;
  };
}

export interface UseMLTrainingReturn {
  isTraining: boolean;
  trainingResult: TrainingResult | null;
  trainingLogs: TrainingLog[];
  error: string | null;
  trainModels: (models?: string[]) => Promise<void>;
  fetchTrainingLogs: (limit?: number) => Promise<void>;
}

/**
 * Hook for managing ML model training
 */
export function useMLTraining(): UseMLTrainingReturn {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trainModels = useCallback(async (models: string[] = ['all']) => {
    setIsTraining(true);
    setError(null);
    setTrainingResult(null);

    try {
      const response = await fetch('/api/ml/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ models }),
      });

      if (!response.ok) {
        throw new Error('Failed to train models');
      }

      const result = await response.json();

      if (result.success === false && result.error) {
        throw new Error(result.error);
      }

      setTrainingResult(result);
    } catch (err: any) {
      setError(err.message);
      console.error('Error training models:', err);
    } finally {
      setIsTraining(false);
    }
  }, []);

  const fetchTrainingLogs = useCallback(async (limit: number = 10) => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`/api/ml/train?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch training logs');
      }

      const result = await response.json();

      if (result.success) {
        setTrainingLogs(result.data.logs);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching training logs:', err);
    }
  }, []);

  return {
    isTraining,
    trainingResult,
    trainingLogs,
    error,
    trainModels,
    fetchTrainingLogs,
  };
}

export default useMLTraining;
