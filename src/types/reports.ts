export interface OverviewKPIs {
    total_candidates: number;
    total_validated: number;
    total_pending: number;
    validation_rate_pct: number;
    rejection_rate_pct: number;
}

export interface BPOProductivity {
    bpo_name: string;
    bpo_id: string;
    total_validations: number;
    validations_today: number;
    avg_time_seconds: number;
    last_active_at: string | null;
    total_rollbacks: number;
}

export interface HiringFunnel {
    status: string;
    count: number;
    percentage: number;
}

export interface DocumentationStats {
    range_label: string; // '0%', '1-50%', '51-99%', '100%'
    count: number;
    percentage: number;
}

export interface MatrixPerformance {
    matrix_name: string;
    matrix_id: number;
    total_candidates: number;
    validated_count: number;
    pending_count: number;
    avg_documentation_progress: number;
}
