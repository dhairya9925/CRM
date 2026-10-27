from typing import List
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_leads: int
    new_leads_this_week: int
    open_deals: int
    pipeline_value: float
    won_deals: int
    won_value: float
    tasks_due_today: int
    overdue_tasks: int


class GroupCountData(BaseModel):
    label: str
    count: int


class PipelineStageMetric(BaseModel):
    stage: str
    deal_count: int
    total_value: float
